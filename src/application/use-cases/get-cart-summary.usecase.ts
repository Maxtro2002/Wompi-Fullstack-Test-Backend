import { TransactionRepositoryPort } from '../ports/transaction.repository.port';
import { ProductRepositoryPort } from '../ports/product.repository.port';
import { ReservationRepositoryPort } from '../ports/reservation.repository.port';
import { CartSummaryDto, CartItemDto } from '../dtos/cart-summary.dto';
import { TransactionStatus } from 'shared/transaction-status.enum';

export class GetCartSummaryUseCase {
  constructor(
    private readonly transactions: TransactionRepositoryPort,
    private readonly products: ProductRepositoryPort,
    private readonly reservations?: ReservationRepositoryPort,
  ) {}

  async execute(customerId: string): Promise<CartSummaryDto> {
    // gather pending transactions
    const all = await this.transactions.findByCustomer(customerId);
    const pending = all.filter((t) => t.status === TransactionStatus.PENDING);

    // gather reservations (if reservations port is available)
    const reservations = this.reservations ? await this.reservations.findReservationsByCustomer(customerId) : [];

    if (pending.length === 0 && reservations.length === 0) {
      return { customerId, items: [], totalAmount: 0 };
    }

    const items: CartItemDto[] = [];
    const byProduct = new Map<string, { quantity: number; amount: number }>();

    for (const tx of pending) {
      const agg = byProduct.get(tx.productId) || { quantity: 0, amount: 0 };
      agg.quantity += tx.quantity;
      agg.amount += tx.amount;
      byProduct.set(tx.productId, agg);
    }

    // include reservations into aggregation
    for (const r of reservations) {
      const pid = r.product?.id ?? (r as any).productId;
      const unit = r.product?.price ?? 0;
      const amt = unit * (r.quantity || 0);
      const agg = byProduct.get(pid) || { quantity: 0, amount: 0 };
      agg.quantity += r.quantity || 0;
      agg.amount += amt;
      byProduct.set(pid, agg);
    }

    let totalAmount = 0;

    for (const [productId, agg] of byProduct.entries()) {
      const product = await this.products.findById(productId);
      const name = product?.name ?? 'Unknown product';
      const unitPrice = product?.price ?? 0;
      const lineAmount = agg.amount;
      totalAmount += lineAmount;

      items.push({
        productId,
        name,
        unitPrice,
        quantity: agg.quantity,
        lineAmount,
      });
    }

    return { customerId, items, totalAmount };
  }
}
