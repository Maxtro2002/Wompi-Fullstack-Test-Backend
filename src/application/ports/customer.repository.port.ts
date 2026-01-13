import { CustomerDto } from '../dtos/customer.dto';

export interface CustomerRepositoryPort {
  findById(id: string): Promise<CustomerDto | null>;
  findOrCreateByEmail(email: string, name: string, phone?: string): Promise<CustomerDto>;
  // Create or update a customer with a password (for login) and return DTO
  findOrCreateByEmailWithPassword(email: string, name: string, phone: string | undefined, password: string): Promise<CustomerDto>;
  // Authenticate an existing customer by email + password. Returns DTO when valid or null when invalid.
  authenticate(email: string, password: string): Promise<CustomerDto | null>;
}
