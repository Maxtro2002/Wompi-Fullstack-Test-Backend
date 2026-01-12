import { Body, Controller, Post, BadRequestException } from '@nestjs/common';
import { CreateTransactionUseCase } from 'application/use-cases/create-transaction.usecase';

class CreateTransactionRequest {
  productId!: string;
  customerId!: string;
  quantity!: number;
}

@Controller('transactions')
export class TransactionsController {
  constructor(private readonly createTransaction: CreateTransactionUseCase) {}

  @Post()
  async create(@Body() body: CreateTransactionRequest) {
    const result = await this.createTransaction.execute({
      productId: body.productId,
      customerId: body.customerId,
      quantity: body.quantity,
    });
    if (!result.ok) {
      const failure = result as { ok: false; error: any };
      throw new BadRequestException({ code: failure.error.code, message: failure.error.message });
    }
    return result.value;
  }
}
