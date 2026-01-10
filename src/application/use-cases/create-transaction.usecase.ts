import { ProductRepositoryPort } from '../ports/product.repository.port';
import { TransactionRepositoryPort } from '../ports/transaction.repository.port';
import { TransactionDto } from '../dtos/transaction.dto';

export interface CreateTransactionInput {
  productId: string;
  customerId: string;
  quantity: number;
}

export class CreateTransactionUseCase {
  constructor(
    private readonly products: ProductRepositoryPort,
    private readonly transactions: TransactionRepositoryPort
  ) {}

  async execute(input: CreateTransactionInput): Promise<TransactionDto | null> {
    const product = await this.products.findById(input.productId);
    if (!product) return null;
    const amount = product.price * input.quantity;
    const created = await this.transactions.create({
      productId: input.productId,
      customerId: input.customerId,
      quantity: input.quantity,
      amount,
      status: undefined,
    });
    return created;
  }
}
