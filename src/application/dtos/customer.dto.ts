import { IsUUID, IsString, IsEmail, IsOptional } from 'class-validator';

export class CustomerDto {
  @IsUUID()
  id!: string;

  @IsString()
  name!: string;

  @IsEmail()
  email!: string;

  @IsOptional()
  @IsString()
  phone?: string;
}
