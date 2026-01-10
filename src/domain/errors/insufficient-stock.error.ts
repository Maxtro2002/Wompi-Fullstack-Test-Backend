import { DomainError } from './base';

export class InsufficientStockError extends DomainError {
  constructor(
    public readonly productId: string,
    public readonly requested: number,
    public readonly available: number
  ) {
    super(
      `Insufficient stock for product ${productId}: requested ${requested}, available ${available}`,
      'INSUFFICIENT_STOCK'
    );
  }
}
