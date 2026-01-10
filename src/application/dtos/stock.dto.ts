import { IsUUID, IsInt, Min } from 'class-validator';

export class StockDto {
  @IsUUID()
  id!: string;

  @IsUUID()
  productId!: string;

  @IsInt()
  @Min(0)
  quantity!: number;

  @IsInt()
  @Min(0)
  reserved!: number;
}
