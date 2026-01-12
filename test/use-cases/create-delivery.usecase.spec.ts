import { CreateDeliveryUseCase } from '../../src/application/use-cases/create-delivery.usecase';
import { DeliveryRepositoryPort } from '../../src/application/ports/delivery.repository.port';
import { TransactionRepositoryPort } from '../../src/application/ports/transaction.repository.port';
import { TransactionStatus } from '../../src/shared/transaction-status.enum';
import { InvalidTransactionStateError, TransactionNotFoundError } from '../../src/domain/errors';

function createTx(status: TransactionStatus) {
  return { id: 't1', productId: 'p1', customerId: 'c1', quantity: 1, amount: 10, status };
}

describe('CreateDeliveryUseCase', () => {
  let deliveries: DeliveryRepositoryPort;
  let transactions: TransactionRepositoryPort;

  beforeEach(() => {
    deliveries = {
      create: jest.fn().mockResolvedValue({
        id: 'd1', transactionId: 't1', addressLine1: 'A1', city: 'C', state: 'S', postalCode: 'Z', country: 'CO', status: 'PENDING',
      }),
      updateStatus: jest.fn(),
      findByTransactionId: jest.fn(),
    };
    transactions = {
      create: jest.fn(),
      updateStatus: jest.fn(),
      findById: jest.fn(),
      findByCustomer: jest.fn(),
    };
  });

  it('creates delivery when transaction is PAID', async () => {
    transactions.findById = jest.fn().mockResolvedValue(createTx(TransactionStatus.PAID));

    const uc = new CreateDeliveryUseCase(deliveries, transactions);
    const result = await uc.execute({
      transactionId: 't1', addressLine1: 'A1', city: 'C', state: 'S', postalCode: 'Z', country: 'CO',
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.id).toBe('d1');
    }
  });

  it('fails when transaction not found', async () => {
    transactions.findById = jest.fn().mockResolvedValue(null);

    const uc = new CreateDeliveryUseCase(deliveries, transactions);
    const result = await uc.execute({ transactionId: 'missing', addressLine1: 'A1', city: 'C', state: 'S', postalCode: 'Z', country: 'CO' });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      const failure = result as { ok: false; error: unknown };
      expect(failure.error).toBeInstanceOf(TransactionNotFoundError);
    }
  });

  it('fails when transaction not PAID', async () => {
    transactions.findById = jest.fn().mockResolvedValue(createTx(TransactionStatus.PENDING));

    const uc = new CreateDeliveryUseCase(deliveries, transactions);
    const result = await uc.execute({ transactionId: 't1', addressLine1: 'A1', city: 'C', state: 'S', postalCode: 'Z', country: 'CO' });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      const failure = result as { ok: false; error: unknown };
      expect(failure.error).toBeInstanceOf(InvalidTransactionStateError);
    }
  });
});
