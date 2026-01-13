import { ProcessPaymentUseCase } from '../../src/application/use-cases/process-payment.usecase';
import { PaymentGatewayPort } from '../../src/application/ports/payment.gateway.port';
import { TransactionRepositoryPort } from '../../src/application/ports/transaction.repository.port';
import { StockRepositoryPort } from '../../src/application/ports/stock.repository.port';
import { TransactionStatus } from '../../src/shared/transaction-status.enum';
import { InvalidTransactionStateError, TransactionNotFoundError, PaymentRejectedError } from '../../src/domain/errors';

function createTx(overrides: Partial<any> = {}) {
  return { id: 't1', productId: 'p1', customerId: 'c1', quantity: 2, amount: 20, status: TransactionStatus.PENDING, ...overrides };
}

describe('ProcessPaymentUseCase', () => {
  let payments: PaymentGatewayPort;
  let transactions: TransactionRepositoryPort;
  let stocks: StockRepositoryPort;

  beforeEach(() => {
    transactions = {
      create: jest.fn(),
      updateStatus: jest.fn().mockResolvedValue(undefined),
      findById: jest.fn(),
      findByCustomer: jest.fn(),
    };
    stocks = {
      getByProductId: jest.fn(),
      setReserved: jest.fn().mockResolvedValue(undefined),
      setQuantity: jest.fn(),
      incrementReserved: jest.fn().mockResolvedValue(0),
    };
    payments = {
      charge: jest.fn(),
    };
  });

  it('processes payment successfully', async () => {
    transactions.findById = jest.fn().mockResolvedValue(createTx());
    (payments.charge as jest.Mock).mockResolvedValue({ ok: true, value: { paymentId: 'pay_1' } });

    const uc = new ProcessPaymentUseCase(payments, transactions, stocks);
    const result = await uc.execute({ transactionId: 't1', amount: 20, currency: 'COP', cardToken: 'tok' });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.paymentId).toBe('pay_1');
      expect(transactions.updateStatus).toHaveBeenCalledWith('t1', TransactionStatus.PAID);
    }
  });

  it('fails when transaction not found', async () => {
    transactions.findById = jest.fn().mockResolvedValue(null);

    const uc = new ProcessPaymentUseCase(payments, transactions, stocks);
    const result = await uc.execute({ transactionId: 'missing', amount: 20, currency: 'COP', cardToken: 'tok' });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      const failure = result as { ok: false; error: unknown };
      expect(failure.error).toBeInstanceOf(TransactionNotFoundError);
    }
  });

  it('fails when transaction is not pending', async () => {
    transactions.findById = jest.fn().mockResolvedValue(createTx({ status: TransactionStatus.PAID }));

    const uc = new ProcessPaymentUseCase(payments, transactions, stocks);
    const result = await uc.execute({ transactionId: 't1', amount: 20, currency: 'COP', cardToken: 'tok' });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      const failure = result as { ok: false; error: unknown };
      expect(failure.error).toBeInstanceOf(InvalidTransactionStateError);
    }
  });

  it('releases stock and marks tx failed on payment rejection', async () => {
    transactions.findById = jest.fn().mockResolvedValue(createTx());
    stocks.getByProductId = jest.fn().mockResolvedValue({ id: 's1', productId: 'p1', quantity: 10, reserved: 4 });
    (payments.charge as jest.Mock).mockResolvedValue({ ok: false, error: new PaymentRejectedError('t1', 'declined') });

    const uc = new ProcessPaymentUseCase(payments, transactions, stocks);
    const result = await uc.execute({ transactionId: 't1', amount: 20, currency: 'COP', cardToken: 'tok' });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      const failure = result as { ok: false; error: unknown };
      expect(failure.error).toBeInstanceOf(PaymentRejectedError);
      expect(stocks.setReserved).toHaveBeenCalledWith('p1', 2); // reserved 4 - qty 2
      expect(transactions.updateStatus).toHaveBeenCalledWith('t1', TransactionStatus.FAILED);
    }
  });
});
