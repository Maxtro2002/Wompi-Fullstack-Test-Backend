import { ProductRepositoryPort } from '../ports/product.repository.port';
import { ProductDto } from '../dtos/product.dto';
import { Result, ok } from 'shared/result';

export class ListProductsUseCase {
  constructor(private readonly products: ProductRepositoryPort) {}

  async execute(): Promise<Result<ProductDto[], never>> {
    const list = await this.products.findAllAvailable();
    return ok(list);
  }
}
