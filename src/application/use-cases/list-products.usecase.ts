import { ProductRepositoryPort } from '../ports/product.repository.port';
import { ProductDto } from '../dtos/product.dto';

export class ListProductsUseCase {
  constructor(private readonly products: ProductRepositoryPort) {}

  async execute(): Promise<ProductDto[]> {
    return this.products.findAllAvailable();
  }
}
