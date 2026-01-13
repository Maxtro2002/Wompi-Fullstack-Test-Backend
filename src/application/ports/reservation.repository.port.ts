import { Reservation } from '../../infrastructure/repositories/entities/reservation.entity';

export interface ReservationRepositoryPort {
  createReservation(productId: string, customerId: string, quantity: number): Promise<Reservation>;
  findReservationsByCustomer(customerId: string): Promise<Reservation[]>;
  findReservationsByCustomerAndProduct(customerId: string, productId: string): Promise<Reservation[]>;
  deleteReservationsByIds(ids: string[]): Promise<void>;
  findById(id: string): Promise<Reservation | null>;
  updateQuantity(id: string, quantity: number): Promise<Reservation>;
}
