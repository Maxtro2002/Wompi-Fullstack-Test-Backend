import { StockDto } from '../dtos/stock.dto';

export interface StockRepositoryPort {
  getByProductId(productId: string): Promise<StockDto | null>;
  setReserved(productId: string, reserved: number): Promise<void>;
  setQuantity(productId: string, quantity: number): Promise<void>;
}
