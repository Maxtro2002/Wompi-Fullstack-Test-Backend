import { DataSource, Repository } from 'typeorm';
import { Reservation } from './entities/reservation.entity';
import { Injectable } from '@nestjs/common';
import { ReservationRepositoryPort } from '../../application/ports/reservation.repository.port';

@Injectable()
export class TypeormReservationRepository implements ReservationRepositoryPort {
  private repo: Repository<Reservation>;

  constructor(private dataSource: DataSource) {
    this.repo = this.dataSource.getRepository(Reservation);
  }

  async createReservation(productId: string, customerId: string, quantity: number): Promise<Reservation> {
    const reservation = this.repo.create({ product: { id: productId } as any, customerId, quantity });
    return this.repo.save(reservation);
  }

  async findReservationsByCustomer(customerId: string): Promise<Reservation[]> {
    return this.repo.find({ where: { customerId } });
  }

  async findReservationsByCustomerAndProduct(customerId: string, productId: string): Promise<Reservation[]> {
    return this.repo.find({ where: { customerId, product: { id: productId } }, relations: ['product'] });
  }

  async deleteReservationsByIds(ids: string[]): Promise<void> {
    if (!ids || ids.length === 0) return;
    await this.repo.delete(ids);
  }

  async findById(id: string): Promise<Reservation | null> {
    return this.repo.findOne({ where: { id }, relations: ['product'] });
  }

  async updateQuantity(id: string, quantity: number): Promise<Reservation> {
    const r = await this.findById(id);
    if (!r) throw new Error('Reservation not found');
    r.quantity = quantity;
    return this.repo.save(r);
  }
}
