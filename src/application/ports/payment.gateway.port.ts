import { Result } from 'shared/result';
import { PaymentRejectedError } from 'domain/errors';

export interface PaymentChargeRequest {
  transactionId: string;
  amount: number;
  currency: string;
  cardToken: string;
}

export interface PaymentGatewayPort {
  charge(req: PaymentChargeRequest): Promise<Result<{ paymentId: string }, PaymentRejectedError>>;
}
