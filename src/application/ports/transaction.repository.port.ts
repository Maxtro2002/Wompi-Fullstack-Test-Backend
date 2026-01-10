import { TransactionDto } from '../dtos/transaction.dto';
import { TransactionStatus } from 'shared/transaction-status.enum';

export interface TransactionRepositoryPort {
  create(data: Omit<TransactionDto, 'id' | 'status' | 'amount'> & { amount: number; status?: TransactionStatus }): Promise<TransactionDto>;
  updateStatus(id: string, status: TransactionStatus): Promise<void>;
  findById(id: string): Promise<TransactionDto | null>;
}
