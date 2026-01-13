import { Controller, Post, Body, UnauthorizedException } from '@nestjs/common';
import { IsEmail, IsString } from 'class-validator';
import { TypeOrmCustomerRepository } from '../repositories/typeorm-customer.repository';

class LoginDto {
  @IsEmail()
  email!: string;

  @IsString()
  password!: string;
}

@Controller('auth')
export class AuthController {
  constructor(private readonly customers: TypeOrmCustomerRepository) {}

  @Post('login')
  async login(@Body() dto: LoginDto) {
    const user = await this.customers.authenticate(dto.email, dto.password);
    if (!user) throw new UnauthorizedException({ message: 'Invalid email or password' });
    return { customerId: user.id };
  }
}
