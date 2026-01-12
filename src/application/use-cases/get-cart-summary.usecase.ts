import { TransactionRepositoryPort } from '../ports/transaction.repository.port';
import { ProductRepositoryPort } from '../ports/product.repository.port';
import { CartSummaryDto, CartItemDto } from '../dtos/cart-summary.dto';
import { TransactionStatus } from 'shared/transaction-status.enum';

export class GetCartSummaryUseCase {
  constructor(
    private readonly transactions: TransactionRepositoryPort,
    private readonly products: ProductRepositoryPort
  ) {}

  async execute(customerId: string): Promise<CartSummaryDto> {
    const all = await this.transactions.findByCustomer(customerId);
    const pending = all.filter((t) => t.status === TransactionStatus.PENDING);

    if (pending.length === 0) {
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
