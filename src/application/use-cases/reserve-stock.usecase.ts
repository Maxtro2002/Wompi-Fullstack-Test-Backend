import { StockRepositoryPort } from '../ports/stock.repository.port';
import { Result, ok, err } from 'shared/result';
import { StockDto } from '../dtos/stock.dto';
import { InsufficientStockError } from 'domain/errors';

export class ReserveStockUseCase {
  constructor(private readonly stocks: StockRepositoryPort) {}

  async execute(productId: string, quantity: number): Promise<Result<StockDto, InsufficientStockError>> {
    const stock = await this.stocks.getByProductId(productId);
    if (!stock) {
      return err(new InsufficientStockError(productId, quantity, 0));
    }
    const available = stock.quantity - stock.reserved;
    if (available < quantity) {
      return err(new InsufficientStockError(productId, quantity, available));
    }
    await this.stocks.setReserved(productId, stock.reserved + quantity);
    const updated: StockDto = { ...stock, reserved: stock.reserved + quantity };
    return ok(updated);
  }
}
