import { IsUUID, IsInt, Min, IsNumber, IsEnum } from 'class-validator';
import { TransactionStatus } from '../../shared/transaction-status.enum';

export class TransactionDto {
  @IsUUID()
  id!: string;

  @IsUUID()
  productId!: string;

  @IsUUID()
  customerId!: string;

  @IsInt()
  @Min(1)
  quantity!: number;

  @IsNumber()
  @Min(0)
  amount!: number;

  @IsEnum(TransactionStatus)
  status!: TransactionStatus;
}
