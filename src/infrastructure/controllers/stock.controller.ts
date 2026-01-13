import { Body, Controller, Post, BadRequestException } from '@nestjs/common';
import { IsUUID, IsInt, Min } from 'class-validator';
import { ReserveStockUseCase } from 'application/use-cases/reserve-stock.usecase';

class ReserveStockRequest {
  @IsUUID()
  productId!: string;

  @IsInt()
  @Min(1)
  quantity!: number;

  @IsUUID()
  customerId!: string;
}

@Controller('stock')
export class StockController {
  constructor(private readonly reserveStock: ReserveStockUseCase) {}

  @Post('reserve')
  async reserve(@Body() body: ReserveStockRequest) {
    const result = await this.reserveStock.execute(body.productId, body.quantity, body.customerId);
    if (!result.ok) {
      const failure = result as { ok: false; error: any };
      throw new BadRequestException({ code: failure.error.code, message: failure.error.message });
    }
    return result.value;
  }
}
