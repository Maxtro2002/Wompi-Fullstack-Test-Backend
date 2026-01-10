import { CustomerDto } from '../dtos/customer.dto';

export interface CustomerRepositoryPort {
  findById(id: string): Promise<CustomerDto | null>;
  findOrCreateByEmail(email: string, name: string, phone?: string): Promise<CustomerDto>;
}
