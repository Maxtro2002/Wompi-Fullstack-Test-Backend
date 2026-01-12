import { Body, Controller, Post, BadRequestException } from '@nestjs/common';
import { ProcessPaymentUseCase } from 'application/use-cases/process-payment.usecase';

class ProcessPaymentRequest {
  transactionId!: string;
  amount!: number;
  currency!: string;
  cardToken!: string;
}

@Controller('payments')
export class PaymentsController {
  constructor(private readonly processPayment: ProcessPaymentUseCase) {}

  @Post()
  async create(@Body() body: ProcessPaymentRequest) {
    const result = await this.processPayment.execute({
      transactionId: body.transactionId,
      amount: body.amount,
      currency: body.currency,
      cardToken: body.cardToken,
    });

    if (!result.ok) {
      const failure = result as { ok: false; error: any };
      throw new BadRequestException({ code: failure.error.code, message: failure.error.message });
    }

    return result.value;
  }
}
