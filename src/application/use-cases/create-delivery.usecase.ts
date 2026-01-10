import { DeliveryRepositoryPort } from '../ports/delivery.repository.port';
import { TransactionRepositoryPort } from '../ports/transaction.repository.port';
import { DeliveryDto } from '../dtos/delivery.dto';
import { Result, ok, err } from 'shared/result';
import { InvalidTransactionStateError, TransactionNotFoundError } from 'domain/errors';
import { TransactionStatus } from 'shared/transaction-status.enum';

export interface CreateDeliveryInput extends Omit<DeliveryDto, 'id' | 'status'> {}

export class CreateDeliveryUseCase {
  constructor(
    private readonly deliveries: DeliveryRepositoryPort,
    private readonly transactions: TransactionRepositoryPort
  ) {}

  async execute(input: CreateDeliveryInput): Promise<Result<DeliveryDto, InvalidTransactionStateError | TransactionNotFoundError>> {
    const tx = await this.transactions.findById(input.transactionId);
    if (!tx) {
      return err(new TransactionNotFoundError(input.transactionId));
    }
    if (tx.status !== TransactionStatus.PAID) {
      return err(new InvalidTransactionStateError(input.transactionId, tx.status, TransactionStatus.PAID));
    }
    const delivery = await this.deliveries.create({ ...input });
    return ok(delivery);
  }
}
