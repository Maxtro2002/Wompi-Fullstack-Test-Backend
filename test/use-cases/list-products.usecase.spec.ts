import { ListProductsUseCase } from '../../src/application/use-cases/list-products.usecase';
import { ProductRepositoryPort } from '../../src/application/ports/product.repository.port';

describe('ListProductsUseCase', () => {
  it('returns ok with available products', async () => {
    const mockProducts: ProductRepositoryPort = {
      findAllAvailable: jest.fn().mockResolvedValue([
        { id: 'p1', name: 'A', description: 'd', price: 10, unitsAvailable: 5 },
      ]),
      findById: jest.fn(),
    };

    const uc = new ListProductsUseCase(mockProducts);
    const result = await uc.execute();
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).toHaveLength(1);
      expect(result.value[0].id).toBe('p1');
    }
  });
});
