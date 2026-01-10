import { DomainError } from './base';

export class ProductNotFoundError extends DomainError {
  constructor(public readonly productId: string) {
    super(`Product not found: ${productId}`, 'PRODUCT_NOT_FOUND');
  }
}
