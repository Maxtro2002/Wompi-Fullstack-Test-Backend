import { TransactionsController } from '../../src/infrastructure/controllers/transactions.controller';
import { CreateTransactionUseCase } from '../../src/application/use-cases/create-transaction.usecase';
import { GetCartSummaryUseCase } from '../../src/application/use-cases/get-cart-summary.usecase';
import { createHash } from 'crypto';

describe('TransactionsController - integrity signature', () => {
  const mockCreate: Partial<CreateTransactionUseCase> = {
    execute: jest.fn(),
  };

  const mockGetCart: Partial<GetCartSummaryUseCase> = {
    execute: jest.fn(),
  };

  beforeEach(() => {
    jest.resetAllMocks();
    delete process.env.WOMPI_INTEGRITY_KEY;
    delete process.env.DEFAULT_CURRENCY;
  });

  it('returns signature.integrity when WOMPI_INTEGRITY_KEY is set', async () => {
    const tx = { id: 'tx-1', productId: 'p1', customerId: 'c1', quantity: 2, amount: 10, status: 'PENDING' } as any;
    (mockCreate.execute as jest.Mock).mockResolvedValue({ ok: true, value: tx });

    process.env.WOMPI_INTEGRITY_KEY = 'testsecret123';
    process.env.DEFAULT_CURRENCY = 'COP';

    const controller = new TransactionsController(mockCreate as any, mockGetCart as any);
    const res = await controller.create({ productId: 'p1', customerId: 'c1', quantity: 2 } as any);

    const amountInCents = Math.round(Number(tx.amount) * 100);
    const raw = `${tx.id}${amountInCents}${process.env.DEFAULT_CURRENCY}${process.env.WOMPI_INTEGRITY_KEY}`;
    const expected = createHash('sha256').update(raw).digest('hex');

    expect(res).toHaveProperty('signature');
    expect(res.signature).toHaveProperty('integrity', expected);
    expect(res).toHaveProperty('amount_in_cents', amountInCents);
  });

  it('returns amount_in_cents even when WOMPI_INTEGRITY_KEY is not set', async () => {
    const tx = { id: 'tx-2', productId: 'p2', customerId: 'c2', quantity: 1, amount: 5.5, status: 'PENDING' } as any;
    (mockCreate.execute as jest.Mock).mockResolvedValue({ ok: true, value: tx });

    const controller = new TransactionsController(mockCreate as any, mockGetCart as any);
    const res = await controller.create({ productId: 'p2', customerId: 'c2', quantity: 1 } as any);

    const amountInCents = Math.round(Number(tx.amount) * 100);
    expect(res).not.toHaveProperty('signature');
    expect(res).toHaveProperty('amount_in_cents', amountInCents);
  });
});
