import { IsUUID, IsString, IsEnum, IsOptional } from 'class-validator';
import { DeliveryStatus } from '../../shared/delivery-status.enum';

export class DeliveryDto {
  @IsUUID()
  id!: string;

  @IsUUID()
  transactionId!: string;

  @IsString()
  addressLine1!: string;

  @IsOptional()
  @IsString()
  addressLine2?: string;

  @IsString()
  city!: string;

  @IsString()
  state!: string;

  @IsString()
  postalCode!: string;

  @IsString()
  country!: string;

  @IsEnum(DeliveryStatus)
  status!: DeliveryStatus;
}
