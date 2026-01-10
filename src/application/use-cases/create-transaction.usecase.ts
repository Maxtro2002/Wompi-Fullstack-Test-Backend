import { ProductRepositoryPort } from '../ports/product.repository.port';
import { TransactionRepositoryPort } from '../ports/transaction.repository.port';
import { CustomerRepositoryPort } from '../ports/customer.repository.port';
import { TransactionDto } from '../dtos/transaction.dto';
import { Result, ok, err } from 'shared/result';
import { ProductNotFoundError, CustomerNotFoundError } from 'domain/errors';

export interface CreateTransactionInput {
  productId: string;
  customerId: string;
  quantity: number;
}

export class CreateTransactionUseCase {
  constructor(
    private readonly products: ProductRepositoryPort,
    private readonly transactions: TransactionRepositoryPort,
    private readonly customers: CustomerRepositoryPort
  ) {}

  async execute(input: CreateTransactionInput): Promise<Result<TransactionDto, ProductNotFoundError | CustomerNotFoundError>> {
    const product = await this.products.findById(input.productId);
    if (!product) return err(new ProductNotFoundError(input.productId));
    const customer = await this.customers.findById(input.customerId);
    if (!customer) return err(new CustomerNotFoundError(input.customerId));
    const amount = product.price * input.quantity;
    const created = await this.transactions.create({
      productId: input.productId,
      customerId: input.customerId,
      quantity: input.quantity,
      amount,
      status: undefined,
    });
    return ok(created);
  }
}
