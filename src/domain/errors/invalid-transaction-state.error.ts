import { DomainError } from './base';
import { TransactionStatus } from 'shared/transaction-status.enum';

export class InvalidTransactionStateError extends DomainError {
  constructor(
    public readonly transactionId: string,
    public readonly current: TransactionStatus,
    public readonly expected?: TransactionStatus | TransactionStatus[]
  ) {
    const expectedText = Array.isArray(expected)
      ? expected.join(', ')
      : expected ?? 'N/A';
    super(
      `Invalid transaction state for ${transactionId}: current=${current}, expected=${expectedText}`,
      'INVALID_TRANSACTION_STATE'
    );
  }
}
