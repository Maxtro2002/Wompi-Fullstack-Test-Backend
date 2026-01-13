import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Stock } from './entities/stock.entity';
import { Product } from './entities/product.entity';
import { StockRepositoryPort } from 'application/ports/stock.repository.port';
import { StockDto } from 'application/dtos/stock.dto';

@Injectable()
export class TypeOrmStockRepository implements StockRepositoryPort {
  constructor(
    @InjectRepository(Stock) private readonly stockRepo: Repository<Stock>,
    @InjectRepository(Product) private readonly productRepo: Repository<Product>,
  ) {}

  async getByProductId(productId: string): Promise<StockDto | null> {
    const product = await this.productRepo.findOne({ where: { id: productId } });
    if (!product) return null;
    const stock = await this.stockRepo.findOne({ where: { product: { id: productId } }, relations: ['product'] });
    if (!stock) return null;
    const quantity = typeof stock.quantity === 'number' && Number.isFinite(stock.quantity) ? stock.quantity : 0;
    const reserved = typeof stock.reserved === 'number' && Number.isFinite(stock.reserved) ? stock.reserved : 0;
    return {
      id: stock.id,
      productId: productId,
      quantity,
      reserved,
    };
  }

  async setReserved(productId: string, reserved: number): Promise<void> {
    const stock = await this.stockRepo.findOne({ where: { product: { id: productId } }, relations: ['product'] });
    if (!stock) return;
    const safeReserved = typeof reserved === 'number' && Number.isFinite(reserved) && reserved >= 0 ? reserved : 0;
    stock.reserved = safeReserved;
    await this.stockRepo.save(stock);
  }

  async incrementReserved(productId: string, delta: number): Promise<number> {
    // perform an atomic update at DB level to avoid lost updates (concurrent reservations)
    const inc = typeof delta === 'number' && Number.isFinite(delta) ? Math.trunc(delta) : 0;
    if (inc === 0) {
      const s = await this.stockRepo.findOne({ where: { product: { id: productId } } });
      return s ? (typeof s.reserved === 'number' ? s.reserved : 0) : 0;
    }
    await this.stockRepo
      .createQueryBuilder()
      .update(Stock)
      .set({ reserved: () => `reserved + ${inc}` })
      .where('product_id = :pid', { pid: productId })
      .execute();

    const updated = await this.stockRepo.findOne({ where: { product: { id: productId } } });
    return updated ? (typeof updated.reserved === 'number' ? updated.reserved : 0) : 0;
  }

  async setQuantity(productId: string, quantity: number): Promise<void> {
    const stock = await this.stockRepo.findOne({ where: { product: { id: productId } }, relations: ['product'] });
    if (!stock) return;
    const safeQuantity = typeof quantity === 'number' && Number.isFinite(quantity) && quantity >= 0 ? quantity : 0;
    stock.quantity = safeQuantity;
    await this.stockRepo.save(stock);
  }
}
