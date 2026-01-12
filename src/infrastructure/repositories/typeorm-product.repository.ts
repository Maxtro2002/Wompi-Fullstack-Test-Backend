import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from './entities/product.entity';
import { Stock } from './entities/stock.entity';
import { ProductRepositoryPort } from 'application/ports/product.repository.port';
import { ProductDto } from 'application/dtos/product.dto';

@Injectable()
export class TypeOrmProductRepository implements ProductRepositoryPort {
  constructor(
    @InjectRepository(Product) private readonly productRepo: Repository<Product>,
    @InjectRepository(Stock) private readonly stockRepo: Repository<Stock>,
  ) {}

  async findAllAvailable(): Promise<ProductDto[]> {
    const products = await this.productRepo.find({ relations: ['stock'] });
    return products.map((p) => ({
      id: p.id,
      name: p.name,
      description: p.description,
      price: Number(p.price),
      unitsAvailable: p.stock ? p.stock.quantity - p.stock.reserved : 0,
    }));
  }

  async findById(id: string): Promise<ProductDto | null> {
    const p = await this.productRepo.findOne({ where: { id }, relations: ['stock'] });
    if (!p) return null;
    return {
      id: p.id,
      name: p.name,
      description: p.description,
      price: Number(p.price),
      unitsAvailable: p.stock ? p.stock.quantity - p.stock.reserved : 0,
    };
  }
}
