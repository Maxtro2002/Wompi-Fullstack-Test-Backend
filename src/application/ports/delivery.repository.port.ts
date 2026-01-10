import { DeliveryDto } from '../dtos/delivery.dto';
import { DeliveryStatus } from 'shared/delivery-status.enum';

export interface DeliveryRepositoryPort {
  create(data: Omit<DeliveryDto, 'id' | 'status'> & { status?: DeliveryStatus }): Promise<DeliveryDto>;
  updateStatus(id: string, status: DeliveryStatus): Promise<void>;
  findByTransactionId(transactionId: string): Promise<DeliveryDto | null>;
}
