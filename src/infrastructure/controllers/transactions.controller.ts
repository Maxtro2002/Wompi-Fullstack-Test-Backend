import { Body, Controller, Post, BadRequestException, Get, Param } from '@nestjs/common';
import { IsUUID, IsInt, Min } from 'class-validator';
import { createHash } from 'crypto';
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
    const tx = result.value as any;

    // compute integrity signature for Wompi widget
    try {
      const secret = process.env.WOMPI_INTEGRITY_KEY;
      const currency = process.env.DEFAULT_CURRENCY || 'COP';
      const amountInCents = Math.round(Number(tx.amount) * 100);
      if (secret) {
        const raw = `${tx.id}${amountInCents}${currency}${secret}`;
        const integrity = createHash('sha256').update(raw).digest('hex');
        return { ...tx, amount_in_cents: amountInCents, signature: { integrity } };
      }
    } catch (err) {
      // if signature generation fails, still return the transaction without signature
      console.error('Failed to compute integrity signature', err);
    }

    return { ...tx, amount_in_cents: Math.round(Number(tx.amount) * 100) };
  }

  @Get('cart/:customerId')
  async getCart(@Param('customerId') customerId: string) {
    return this.getCartSummary.execute(customerId);
  }
}
