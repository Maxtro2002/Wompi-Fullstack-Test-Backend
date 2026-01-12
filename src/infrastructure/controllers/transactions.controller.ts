import { Body, Controller, Post, BadRequestException, Get, Param } from '@nestjs/common';
import { IsUUID, IsInt, Min } from 'class-validator';
import { CreateTransactionUseCase } from 'application/use-cases/create-transaction.usecase';
import { GetCartSummaryUseCase } from 'application/use-cases/get-cart-summary.usecase';

class CreateTransactionRequest {
  @IsUUID()
  productId!: string;

  @IsUUID()
  customerId!: string;

  @IsInt()
  @Min(1)
  quantity!: number;
}

@Controller('transactions')
export class TransactionsController {
  constructor(
    private readonly createTransaction: CreateTransactionUseCase,
    private readonly getCartSummary: GetCartSummaryUseCase,
  ) {}

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

  @Get('cart/:customerId')
  async getCart(@Param('customerId') customerId: string) {
    return this.getCartSummary.execute(customerId);
  }
}
