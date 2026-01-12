import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Delivery } from './entities/delivery.entity';
import { Transaction } from './entities/transaction.entity';
import { DeliveryRepositoryPort } from 'application/ports/delivery.repository.port';
import { DeliveryDto } from 'application/dtos/delivery.dto';
import { DeliveryStatus } from 'shared/delivery-status.enum';

@Injectable()
export class TypeOrmDeliveryRepository implements DeliveryRepositoryPort {
  constructor(
    @InjectRepository(Delivery) private readonly deliveryRepo: Repository<Delivery>,
    @InjectRepository(Transaction) private readonly txRepo: Repository<Transaction>,
  ) {}

  async create(data: Omit<DeliveryDto, 'id' | 'status'> & { status?: DeliveryStatus }): Promise<DeliveryDto> {
    const tx = await this.txRepo.findOne({ where: { id: data.transactionId } });
    const d = this.deliveryRepo.create({
      transaction: tx!,
      addressLine1: data.addressLine1,
      addressLine2: data.addressLine2,
      city: data.city,
      state: data.state,
      postalCode: data.postalCode,
      country: data.country,
      status: data.status ?? DeliveryStatus.PENDING,
    });
    const saved = await this.deliveryRepo.save(d);
    return {
      id: saved.id,
      transactionId: data.transactionId,
      addressLine1: saved.addressLine1,
      addressLine2: saved.addressLine2 ?? undefined,
      city: saved.city,
      state: saved.state,
      postalCode: saved.postalCode,
      country: saved.country,
      status: saved.status,
    };
  }

  async updateStatus(id: string, status: DeliveryStatus): Promise<void> {
    await this.deliveryRepo.update({ id }, { status });
  }

  async findByTransactionId(transactionId: string): Promise<DeliveryDto | null> {
    const d = await this.deliveryRepo.findOne({ where: { transaction: { id: transactionId } }, relations: ['transaction'] });
    if (!d) return null;
    return {
      id: d.id,
      transactionId: d.transaction.id,
      addressLine1: d.addressLine1,
      addressLine2: d.addressLine2 ?? undefined,
      city: d.city,
      state: d.state,
      postalCode: d.postalCode,
      country: d.country,
      status: d.status,
    };
  }
}
