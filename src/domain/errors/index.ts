export * from './base';
export * from './insufficient-stock.error';
export * from './payment-rejected.error';
export * from './invalid-transaction-state.error';
export * from './product-not-found.error';
export * from './customer-not-found.error';
export * from './transaction-not-found.error';

export type KnownDomainError =
  | import('./insufficient-stock.error').InsufficientStockError
  | import('./payment-rejected.error').PaymentRejectedError
  | import('./invalid-transaction-state.error').InvalidTransactionStateError
  | import('./product-not-found.error').ProductNotFoundError
  | import('./customer-not-found.error').CustomerNotFoundError
  | import('./transaction-not-found.error').TransactionNotFoundError;
