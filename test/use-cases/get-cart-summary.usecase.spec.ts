import { GetCartSummaryUseCase } from '../../src/application/use-cases/get-cart-summary.usecase';
import { TransactionRepositoryPort } from '../../src/application/ports/transaction.repository.port';
import { ProductRepositoryPort } from '../../src/application/ports/product.repository.port';
import { TransactionStatus } from '../../src/shared/transaction-status.enum';

function createTx(overrides: Partial<any> = {}) {
  return {
    id: 't1',
    productId: 'p1',
    customerId: 'c1',
    quantity: 1,
    amount: 100,
    status: TransactionStatus.PENDING,
    ...overrides,
  };
}

describe('GetCartSummaryUseCase', () => {
  let transactions: TransactionRepositoryPort;
  let products: ProductRepositoryPort;

  beforeEach(() => {
    transactions = {
      create: jest.fn(),
      updateStatus: jest.fn(),
      findById: jest.fn(),
      findByCustomer: jest.fn(),
    };

    products = {
      findAllAvailable: jest.fn(),
      findById: jest.fn(),
    };
  });

  it('returns empty summary when no pending transactions', async () => {
    (transactions.findByCustomer as jest.Mock).mockResolvedValue([]);

    const uc = new GetCartSummaryUseCase(transactions, products);
    const result = await uc.execute('c1');

    expect(result.customerId).toBe('c1');
    expect(result.items).toHaveLength(0);
    expect(result.totalAmount).toBe(0);
  });

  it('aggregates quantities and amounts per product and computes total', async () => {
    (transactions.findByCustomer as jest.Mock).mockResolvedValue([
      createTx({ id: 't1', productId: 'p1', quantity: 1, amount: 100 }),
      createTx({ id: 't2', productId: 'p1', quantity: 2, amount: 200 }),
      createTx({ id: 't3', productId: 'p2', quantity: 1, amount: 50 }),
      // Product without details in ProductRepository (to hit Unknown product / unitPrice 0 path)
      createTx({ id: 't5', productId: 'p3', quantity: 1, amount: 70 }),
      // Non-pending transaction should be ignored
      createTx({ id: 't4', productId: 'p1', quantity: 10, amount: 1000, status: TransactionStatus.PAID }),
    ]);

    (products.findById as jest.Mock).mockImplementation(async (id: string) => {
      if (id === 'p1') {
        return { id: 'p1', name: 'Product 1', description: 'd1', price: 100, unitsAvailable: 10 };
      }
      if (id === 'p2') {
        return { id: 'p2', name: 'Product 2', description: 'd2', price: 50, unitsAvailable: 5 };
      }
      return null;
    });

    const uc = new GetCartSummaryUseCase(transactions, products);
    const result = await uc.execute('c1');

    expect(result.customerId).toBe('c1');
    expect(result.items).toHaveLength(3);

    const itemP1 = result.items.find((i) => i.productId === 'p1');
    const itemP2 = result.items.find((i) => i.productId === 'p2');
    const itemP3 = result.items.find((i) => i.productId === 'p3');

    expect(itemP1).toBeDefined();
    expect(itemP1!.quantity).toBe(3); // 1 + 2
    expect(itemP1!.lineAmount).toBe(300); // 100 + 200
    expect(itemP1!.unitPrice).toBe(100);

    expect(itemP2).toBeDefined();
    expect(itemP2!.quantity).toBe(1);
    expect(itemP2!.lineAmount).toBe(50);
    expect(itemP2!.unitPrice).toBe(50);

    // Product without details should fall back to Unknown product and unitPrice 0
    expect(itemP3).toBeDefined();
    expect(itemP3!.name).toBe('Unknown product');
    expect(itemP3!.unitPrice).toBe(0);
    expect(itemP3!.quantity).toBe(1);
    expect(itemP3!.lineAmount).toBe(70);

    expect(result.totalAmount).toBe(420);
  });
});
