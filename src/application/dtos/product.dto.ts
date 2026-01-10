import { IsUUID, IsString, IsNumber, Min } from 'class-validator';

export class ProductDto {
  @IsUUID()
  id!: string;

  @IsString()
  name!: string;

  @IsString()
  description!: string;

  @IsNumber()
  @Min(0)
  price!: number;

  @IsNumber()
  @Min(0)
  unitsAvailable!: number;
}
