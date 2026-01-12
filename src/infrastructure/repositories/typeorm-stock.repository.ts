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
    return {
      id: stock.id,
      productId: productId,
      quantity: stock.quantity,
      reserved: stock.reserved,
    };
  }

  async setReserved(productId: string, reserved: number): Promise<void> {
    const stock = await this.stockRepo.findOne({ where: { product: { id: productId } }, relations: ['product'] });
    if (!stock) return;
    stock.reserved = reserved;
    await this.stockRepo.save(stock);
  }

  async setQuantity(productId: string, quantity: number): Promise<void> {
    const stock = await this.stockRepo.findOne({ where: { product: { id: productId } }, relations: ['product'] });
    if (!stock) return;
    stock.quantity = quantity;
    await this.stockRepo.save(stock);
  }
}
