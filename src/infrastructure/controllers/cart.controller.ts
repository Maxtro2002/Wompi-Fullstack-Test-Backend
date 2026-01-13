import { Body, Controller, Put, Delete, Query, BadRequestException } from '@nestjs/common';
import { IsUUID, IsInt, Min } from 'class-validator';
import { ReserveStockUseCase } from 'application/use-cases/reserve-stock.usecase';
import { TypeormReservationRepository } from '../repositories/typeorm-reservation.repository';
import { TypeOrmStockRepository } from '../repositories/typeorm-stock.repository';

class SetCartItemRequest {
  @IsUUID()
  productId!: string;

  @IsUUID()
  customerId!: string;

  @IsInt()
  @Min(0)
  quantity!: number;
}

@Controller('cart')
export class CartController {
  constructor(
    private readonly reserveStock: ReserveStockUseCase,
    private readonly reservations: TypeormReservationRepository,
    private readonly stocks: TypeOrmStockRepository,
  ) {}

  @Put('items')
  async setItem(@Body() body: SetCartItemRequest) {
    const { productId, customerId, quantity } = body;
    if (!productId || !customerId || typeof quantity !== 'number') {
      throw new BadRequestException('productId, customerId and quantity are required');
    }

    // get existing reservations for this customer+product
    const existing = await this.reservations.findReservationsByCustomerAndProduct(customerId, productId);
    const current = (existing || []).reduce((s, r) => s + (r.quantity || 0), 0);

    const delta = quantity - current;
    if (delta === 0) {
      return { productId, customerId, quantity: current, reservations: existing };
    }

    if (delta > 0) {
      // need to create additional reservations
      const res = await this.reserveStock.execute(productId, delta, customerId);
      if (!res.ok) {
        const failure = res as { ok: false; error: any };
        throw new BadRequestException({ code: failure.error.code, message: failure.error.message });
      }
      // return updated reservations
      const updated = await this.reservations.findReservationsByCustomerAndProduct(customerId, productId);
      return { productId, customerId, quantity: (current + delta), reservations: updated };
    }

    // delta < 0 -> remove/decrement reservations
    let toRemove = -delta;
    // sort by createdAt ascending (oldest first)
    const sorted = (existing || []).sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    for (const r of sorted) {
      if (toRemove <= 0) break;
      const rid = r.id;
      const rq = r.quantity || 0;
      if (rq <= toRemove) {
        // remove whole reservation
        await this.stocks.incrementReserved(productId, -rq);
        await this.reservations.deleteReservationsByIds([rid]);
        toRemove -= rq;
      } else {
        // reduce partial
        const newQty = rq - toRemove;
        await this.stocks.incrementReserved(productId, -toRemove);
        await this.reservations.updateQuantity(rid, newQty);
        toRemove = 0;
      }
    }

    const finalReservations = await this.reservations.findReservationsByCustomerAndProduct(customerId, productId);
    const finalQty = (finalReservations || []).reduce((s, r) => s + (r.quantity || 0), 0);
    return { productId, customerId, quantity: finalQty, reservations: finalReservations };
  }

  @Delete('items')
  async removeItem(@Query('productId') productId: string, @Query('customerId') customerId: string) {
    if (!productId || !customerId) throw new BadRequestException('productId and customerId are required');
    const existing = await this.reservations.findReservationsByCustomerAndProduct(customerId, productId);
    if (!existing || existing.length === 0) return { productId, customerId, removed: 0 };
    const total = existing.reduce((s, r) => s + (r.quantity || 0), 0);
    // decrement reserved atomically
    await this.stocks.incrementReserved(productId, -total);
    const ids = existing.map((r) => r.id);
    await this.reservations.deleteReservationsByIds(ids);
    return { productId, customerId, removed: total };
  }
}
