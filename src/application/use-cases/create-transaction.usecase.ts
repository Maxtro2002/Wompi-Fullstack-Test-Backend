import { ProductRepositoryPort } from '../ports/product.repository.port';
import { TransactionRepositoryPort } from '../ports/transaction.repository.port';
import { CustomerRepositoryPort } from '../ports/customer.repository.port';
import { ReservationRepositoryPort } from '../ports/reservation.repository.port';
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
    , private readonly reservations?: ReservationRepositoryPort
  ) {}

  async execute(input: CreateTransactionInput): Promise<Result<TransactionDto, ProductNotFoundError | CustomerNotFoundError>> {
    const product = await this.products.findById(input.productId);
    if (!product) return err(new ProductNotFoundError(input.productId));
    const customer = await this.customers.findById(input.customerId);
    if (!customer) return err(new CustomerNotFoundError(input.customerId));
    // If the customer has reservations for this product, consume them and use reserved quantity
    let finalQuantity = input.quantity;
    if (this.reservations) {
      const res = await this.reservations.findReservationsByCustomerAndProduct(input.customerId, input.productId);
      if (res && res.length > 0) {
        const totalReserved = res.reduce((s, r) => s + (r.quantity || 0), 0);
        // prefer reserved quantity when present
        finalQuantity = totalReserved;
        // delete consumed reservations
        const ids = res.map((r) => r.id);
        await this.reservations.deleteReservationsByIds(ids);
      }
    }

    const amount = product.price * finalQuantity;
    const created = await this.transactions.create({
      productId: input.productId,
      customerId: input.customerId,
      quantity: finalQuantity,
      amount,
      status: undefined,
    });
    return ok(created);
  }
}
