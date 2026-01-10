import { ProductDto } from '../dtos/product.dto';

export interface ProductRepositoryPort {
  findAllAvailable(): Promise<ProductDto[]>;
  findById(id: string): Promise<ProductDto | null>;
}
