import { StockRepositoryPort } from '../ports/stock.repository.port';
import { ReservationRepositoryPort } from '../ports/reservation.repository.port';
import { Result, ok, err } from 'shared/result';
import { StockDto } from '../dtos/stock.dto';
import { InsufficientStockError } from 'domain/errors';

export class ReserveStockUseCase {
  constructor(private readonly stocks: StockRepositoryPort, private readonly reservations: ReservationRepositoryPort) {}

  async execute(productId: string, quantity: number, customerId: string): Promise<Result<StockDto, InsufficientStockError>> {
    const stock = await this.stocks.getByProductId(productId);
    if (!stock) {
      return err(new InsufficientStockError(productId, quantity, 0));
    }
    const available = stock.quantity - stock.reserved;
    if (available < quantity) {
      return err(new InsufficientStockError(productId, quantity, available));
    }
    // atomically increment reserved and then read updated stock
    const newReserved = await this.stocks.incrementReserved(productId, quantity);
    // create a reservation record linked to the customer
    try {
      await this.reservations.createReservation(productId, customerId, quantity);
    } catch (e) {
      // best-effort: if reservation creation fails, roll back the reserved increment
      // NOTE: rollback here is optimistic; repository-level transactions should be used in production
      await this.stocks.incrementReserved(productId, -quantity);
      return err(new InsufficientStockError(productId, quantity, available));
    }
    const updatedStock = await this.stocks.getByProductId(productId);
    if (!updatedStock) return err(new InsufficientStockError(productId, quantity, 0));
    return ok({ ...updatedStock, reserved: newReserved });
  }
}
