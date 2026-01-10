import { DomainError } from './base';

export class CustomerNotFoundError extends DomainError {
  constructor(public readonly customerId: string) {
    super(`Customer not found: ${customerId}`, 'CUSTOMER_NOT_FOUND');
  }
}
