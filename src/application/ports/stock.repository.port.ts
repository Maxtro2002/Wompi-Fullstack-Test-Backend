import { StockDto } from '../dtos/stock.dto';

export interface StockRepositoryPort {
  getByProductId(productId: string): Promise<StockDto | null>;
  setReserved(productId: string, reserved: number): Promise<void>;
  setQuantity(productId: string, quantity: number): Promise<void>;
  // Atomically increment/decrement reserved by delta and return new reserved value
  incrementReserved(productId: string, delta: number): Promise<number>;
}
