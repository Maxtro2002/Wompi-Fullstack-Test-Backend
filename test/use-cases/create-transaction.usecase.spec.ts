import { CreateTransactionUseCase } from '../../src/application/use-cases/create-transaction.usecase';
import { ProductRepositoryPort } from '../../src/application/ports/product.repository.port';
import { TransactionRepositoryPort } from '../../src/application/ports/transaction.repository.port';
import { CustomerRepositoryPort } from '../../src/application/ports/customer.repository.port';
import { ProductNotFoundError, CustomerNotFoundError } from '../../src/domain/errors';

describe('CreateTransactionUseCase', () => {
  const mockProducts: ProductRepositoryPort = {
    findAllAvailable: jest.fn(),
    findById: jest.fn(),
  };
  const mockTransactions: TransactionRepositoryPort = {
    create: jest.fn(),
    updateStatus: jest.fn(),
    findById: jest.fn(),
    findByCustomer: jest.fn(),
  };
  const mockCustomers: CustomerRepositoryPort = {
    findById: jest.fn(),
    findOrCreateByEmail: jest.fn(),
  };

  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('creates transaction when product and customer exist', async () => {
    mockProducts.findById = jest.fn().mockResolvedValue({ id: 'p1', name: 'A', description: 'd', price: 10, unitsAvailable: 10 });
    mockCustomers.findById = jest.fn().mockResolvedValue({ id: 'c1', name: 'John', email: 'j@example.com' });
    mockTransactions.create = jest.fn().mockResolvedValue({ id: 't1', productId: 'p1', customerId: 'c1', quantity: 2, amount: 20, status: 'PENDING' });

    const uc = new CreateTransactionUseCase(mockProducts, mockTransactions, mockCustomers);
    const result = await uc.execute({ productId: 'p1', customerId: 'c1', quantity: 2 });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.amount).toBe(20);
    }
  });

  it('fails when product not found', async () => {
    mockProducts.findById = jest.fn().mockResolvedValue(null);
    mockCustomers.findById = jest.fn();

    const uc = new CreateTransactionUseCase(mockProducts, mockTransactions, mockCustomers);
    const result = await uc.execute({ productId: 'missing', customerId: 'c1', quantity: 1 });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      const failure = result as { ok: false; error: unknown };
      expect(failure.error).toBeInstanceOf(ProductNotFoundError);
    }
  });

  it('fails when customer not found', async () => {
    mockProducts.findById = jest.fn().mockResolvedValue({ id: 'p1', name: 'A', description: 'd', price: 10, unitsAvailable: 10 });
    mockCustomers.findById = jest.fn().mockResolvedValue(null);

    const uc = new CreateTransactionUseCase(mockProducts, mockTransactions, mockCustomers);
    const result = await uc.execute({ productId: 'p1', customerId: 'missing', quantity: 1 });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      const failure = result as { ok: false; error: unknown };
      expect(failure.error).toBeInstanceOf(CustomerNotFoundError);
    }
  });
});
