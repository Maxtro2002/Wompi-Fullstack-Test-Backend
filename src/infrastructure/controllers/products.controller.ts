import { Controller, Get } from '@nestjs/common';
import { ListProductsUseCase } from 'application/use-cases/list-products.usecase';

@Controller('products')
export class ProductsController {
  constructor(private readonly listProducts: ListProductsUseCase) {}

  @Get()
  async list() {
    const result = await this.listProducts.execute();
    return result.ok ? result.value : [];
  }
}
