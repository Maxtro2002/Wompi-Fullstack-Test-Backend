import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Customer } from './entities/customer.entity';
import { CustomerRepositoryPort } from 'application/ports/customer.repository.port';
import { CustomerDto } from 'application/dtos/customer.dto';

@Injectable()
export class TypeOrmCustomerRepository implements CustomerRepositoryPort {
  constructor(
    @InjectRepository(Customer) private readonly customerRepo: Repository<Customer>,
  ) {}

  async findById(id: string): Promise<CustomerDto | null> {
    const c = await this.customerRepo.findOne({ where: { id } });
    if (!c) return null;
    return { id: c.id, name: c.name, email: c.email, phone: c.phone ?? undefined };
  }

  async findOrCreateByEmail(email: string, name: string, phone?: string): Promise<CustomerDto> {
    let c = await this.customerRepo.findOne({ where: { email } });
    if (!c) {
      c = this.customerRepo.create({ email, name, phone });
      c = await this.customerRepo.save(c);
    }
    return { id: c.id, name: c.name, email: c.email, phone: c.phone ?? undefined };
  }
}
