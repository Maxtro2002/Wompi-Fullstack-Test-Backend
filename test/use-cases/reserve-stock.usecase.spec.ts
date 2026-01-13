import { ReserveStockUseCase } from '../../src/application/use-cases/reserve-stock.usecase';
import { StockRepositoryPort } from '../../src/application/ports/stock.repository.port';
import { InsufficientStockError } from '../../src/domain/errors';

describe('ReserveStockUseCase', () => {
  it('reserves stock when available', async () => {
    const mockStocks: StockRepositoryPort = {
      getByProductId: jest.fn().mockResolvedValue({ id: 's1', productId: 'p1', quantity: 10, reserved: 2 }),
      setReserved: jest.fn(),
      setQuantity: jest.fn(),
      incrementReserved: jest.fn().mockResolvedValue(5),
    } as any;

    const mockReservations: any = { createReservation: jest.fn().mockResolvedValue(true) };

    const uc = new ReserveStockUseCase(mockStocks, mockReservations);
    const result = await uc.execute('p1', 3, 'c1');
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.reserved).toBe(5);
      expect((mockStocks.incrementReserved as jest.Mock)).toHaveBeenCalledWith('p1', 3);
      expect(mockReservations.createReservation).toHaveBeenCalledWith('p1', 'c1', 3);
    }
  });

  it('fails when insufficient stock', async () => {
    const mockStocks: StockRepositoryPort = {
      getByProductId: jest.fn().mockResolvedValue({ id: 's1', productId: 'p1', quantity: 5, reserved: 4 }),
      setReserved: jest.fn(),
      setQuantity: jest.fn(),
      incrementReserved: jest.fn(),
    };

    const mockReservations: any = { createReservation: jest.fn() };
    const uc = new ReserveStockUseCase(mockStocks, mockReservations);
    const result = await uc.execute('p1', 3, 'c1');
    expect(result.ok).toBe(false);
    if (!result.ok) {
      const failure = result as { ok: false; error: unknown };
      expect(failure.error).toBeInstanceOf(InsufficientStockError);
    }
  });

  it('fails when no stock record', async () => {
    const mockStocks: StockRepositoryPort = {
      getByProductId: jest.fn().mockResolvedValue(null),
      setReserved: jest.fn(),
      setQuantity: jest.fn(),
      incrementReserved: jest.fn(),
    };

    const mockReservations: any = { createReservation: jest.fn() };
    const uc = new ReserveStockUseCase(mockStocks, mockReservations);
    const result = await uc.execute('p1', 1, 'c1');
    expect(result.ok).toBe(false);
    if (!result.ok) {
      const failure = result as { ok: false; error: unknown };
      expect(failure.error).toBeInstanceOf(InsufficientStockError);
    }
  });
});
