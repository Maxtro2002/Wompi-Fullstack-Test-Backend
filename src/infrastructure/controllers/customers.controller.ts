import { Controller, Post, Body, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { IsEmail, IsOptional, IsString } from 'class-validator';
import { TypeOrmCustomerRepository } from '../repositories/typeorm-customer.repository';

class CreateCustomerDto {
  @IsEmail()
  email!: string;

  @IsString()
  name!: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  password?: string;
}

@Controller('customers')
export class CustomersController {
  constructor(private readonly customers: TypeOrmCustomerRepository) {}

  @Post()
  async createOrLogin(@Body() dto: CreateCustomerDto) {
    try {
      // If password supplied, try to authenticate existing user first
      if (dto.password) {
        const existing = await this.customers.authenticate(dto.email, dto.password);
        if (existing) {
          return { customerId: existing.id };
        }

        // If not existing or password invalid, create or set password and return id
        const created = await this.customers.findOrCreateByEmailWithPassword(dto.email, dto.name, dto.phone, dto.password);
        return { customerId: created.id };
      }

      // No password: return or create customer without password
      const customer = await this.customers.findOrCreateByEmail(dto.email, dto.name, dto.phone);
      return { customerId: customer.id };
    } catch (err: any) {
      throw new BadRequestException({ message: err?.message ?? 'Failed to create/login customer' });
    }
  }
}
