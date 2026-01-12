import axios, { AxiosInstance, AxiosError } from 'axios';
import { PaymentGatewayPort, PaymentChargeRequest } from 'application/ports/payment.gateway.port';
import { Result, ok, err } from 'shared/result';
import { PaymentRejectedError } from 'domain/errors';

export class WompiPaymentGatewayAdapter implements PaymentGatewayPort {
  private readonly client: AxiosInstance;
  private readonly privateKey: string | undefined;

  constructor() {
    const baseURL = process.env.WOMPI_BASE_URL || 'https://sandbox.wompi.co';
    this.privateKey = process.env.WOMPI_PRIVATE_KEY;

    this.client = axios.create({
      baseURL,
      timeout: 5000,
    });
  }

  async charge(req: PaymentChargeRequest): Promise<Result<{ paymentId: string }, PaymentRejectedError>> {
    if (!this.privateKey) {
      return err(
        new PaymentRejectedError(req.transactionId, 'Wompi private key (WOMPI_PRIVATE_KEY) is not configured')
      );
    }

    try {
      const response = await this.client.post(
        '/v1/transactions',
        {
          amount_in_cents: Math.round(req.amount * 100),
          currency: req.currency,
          reference: req.transactionId,
          payment_method: {
            type: 'CARD',
            token: req.cardToken,
            installments: 1,
          },
        },
        {
          headers: {
            Authorization: `Bearer ${this.privateKey}`,
            'Content-Type': 'application/json',
          },
        }
      );

      const data: any = response.data;
      const wompiTx = data?.data;
      const status = wompiTx?.status;
      const id = wompiTx?.id;

      if (!id) {
        return err(new PaymentRejectedError(req.transactionId, 'Missing transaction id in Wompi response'));
      }

      if (status !== 'APPROVED') {
        const reason = wompiTx?.status_message || `Unexpected status ${status}`;
        return err(new PaymentRejectedError(req.transactionId, reason));
      }

      return ok({ paymentId: String(id) });
    } catch (error) {
      let reason = 'Unknown error calling Wompi';

      if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError<any>;
        const status = axiosError.response?.status;
        const body = axiosError.response?.data as any;

        let bodyReason: string | undefined;
        if (body && body.error) {
          const errObj = body.error;
          if (typeof errObj.reason === 'string') {
            bodyReason = errObj.reason;
          } else if (Array.isArray(errObj.messages)) {
            bodyReason = errObj.messages.join(', ');
          } else if (typeof errObj.messages === 'string') {
            bodyReason = errObj.messages;
          }
        }

        bodyReason = bodyReason || axiosError.message;
        reason = `HTTP ${status ?? 'N/A'} - ${bodyReason}`;
      } else if (error instanceof Error) {
        reason = error.message;
      }

      return err(new PaymentRejectedError(req.transactionId, reason));
    }
  }
}
