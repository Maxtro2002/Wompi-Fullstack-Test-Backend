import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Customer } from './entities/customer.entity';
import { CustomerRepositoryPort } from 'application/ports/customer.repository.port';
import { CustomerDto } from 'application/dtos/customer.dto';
import { randomBytes, scryptSync, timingSafeEqual } from 'crypto';

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

  async findOrCreateByEmailWithPassword(email: string, name: string, phone: string | undefined, password: string): Promise<CustomerDto> {
    let c = await this.customerRepo.findOne({ where: { email }, select: ['id', 'name', 'email', 'phone', 'passwordHash', 'passwordSalt'] as any });
    if (!c) {
      const salt = randomBytes(16).toString('hex');
      const hash = scryptSync(password, salt, 64).toString('hex');
      const toSave = this.customerRepo.create({ email, name, phone, passwordHash: hash, passwordSalt: salt });
      c = await this.customerRepo.save(toSave);
    } else if (!c.passwordHash) {
      // Set password if not present
      const salt = randomBytes(16).toString('hex');
      const hash = scryptSync(password, salt, 64).toString('hex');
      c.passwordHash = hash;
      c.passwordSalt = salt;
      c = await this.customerRepo.save(c as any);
    }
    return { id: c.id, name: c.name, email: c.email, phone: c.phone ?? undefined };
  }

  async authenticate(email: string, password: string): Promise<CustomerDto | null> {
    const c = await this.customerRepo.findOne({ where: { email }, select: ['id', 'name', 'email', 'phone', 'passwordHash', 'passwordSalt'] as any });
    if (!c || !c.passwordHash || !c.passwordSalt) return null;
    const hash = scryptSync(password, c.passwordSalt, 64).toString('hex');
    if (!timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(c.passwordHash, 'hex'))) {
      return null;
    }
    return { id: c.id, name: c.name, email: c.email, phone: c.phone ?? undefined };
  }
}
