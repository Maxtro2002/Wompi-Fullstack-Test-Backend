import { DomainError } from './base';

export class TransactionNotFoundError extends DomainError {
  constructor(public readonly transactionId: string) {
    super(`Transaction not found: ${transactionId}`, 'TRANSACTION_NOT_FOUND');
  }
}
