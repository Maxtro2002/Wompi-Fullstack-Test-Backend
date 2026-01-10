import { PaymentGatewayPort, PaymentChargeRequest } from '../ports/payment.gateway.port';
import { TransactionRepositoryPort } from '../ports/transaction.repository.port';
import { StockRepositoryPort } from '../ports/stock.repository.port';
import { Result, ok, err } from 'shared/result';
import { PaymentRejectedError, InvalidTransactionStateError, TransactionNotFoundError } from 'domain/errors';
import { TransactionStatus } from 'shared/transaction-status.enum';

export class ProcessPaymentUseCase {
  constructor(
    private readonly payments: PaymentGatewayPort,
    private readonly transactions: TransactionRepositoryPort,
    private readonly stocks: StockRepositoryPort
  ) {}

  async execute(req: PaymentChargeRequest): Promise<Result<{ paymentId: string }, PaymentRejectedError | InvalidTransactionStateError | TransactionNotFoundError>> {
    const tx = await this.transactions.findById(req.transactionId);
    if (!tx) {
      return err(new TransactionNotFoundError(req.transactionId));
    }
    if (tx.status !== TransactionStatus.PENDING) {
      return err(new InvalidTransactionStateError(req.transactionId, tx.status, TransactionStatus.PENDING));
    }
    const charge = await this.payments.charge(req);
    if (!charge.ok) {
      // Release reserved stock on payment failure
      const stock = await this.stocks.getByProductId(tx.productId);
      if (stock) {
        await this.stocks.setReserved(tx.productId, Math.max(0, stock.reserved - tx.quantity));
      }
      await this.transactions.updateStatus(tx.id, TransactionStatus.FAILED);
      return charge;
    }
    await this.transactions.updateStatus(tx.id, TransactionStatus.PAID);
    return ok(charge.value);
  }
}
