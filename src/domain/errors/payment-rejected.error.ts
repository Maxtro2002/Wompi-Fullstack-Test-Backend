import { DomainError } from './base';

export class PaymentRejectedError extends DomainError {
  constructor(
    public readonly transactionId: string,
    public readonly reason: string
  ) {
    super(
      `Payment rejected for transaction ${transactionId}: ${reason}`,
      'PAYMENT_REJECTED'
    );
  }
}
