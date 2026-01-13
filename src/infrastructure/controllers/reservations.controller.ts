import { Body, Controller, Post, Get, Query, Param, Patch, Delete, NotFoundException, BadRequestException, Put } from '@nestjs/common';
import { IsUUID, IsInt, Min } from 'class-validator';
import { ReserveStockUseCase } from 'application/use-cases/reserve-stock.usecase';
import { TypeormReservationRepository } from '../repositories/typeorm-reservation.repository';
import { TypeOrmStockRepository } from '../repositories/typeorm-stock.repository';

class CreateReservationRequest {
  @IsUUID()
  productId!: string;

  @IsInt()
  @Min(1)
  quantity!: number;

  @IsUUID()
  customerId!: string;
}

class UpdateReservationRequest {
  @IsInt()
  @Min(0)
  quantity!: number;
}

class SetReservationRequest {
  @IsUUID()
  productId!: string;

  @IsUUID()
  customerId!: string;

  @IsInt()
  @Min(0)
  quantity!: number;
}

@Controller('reservations')
export class ReservationsController {
  constructor(
    private readonly reserveStock: ReserveStockUseCase,
    private readonly reservations: TypeormReservationRepository,
    private readonly stocks: TypeOrmStockRepository,
  ) {}

  @Post()
  async create(@Body() body: CreateReservationRequest) {
    const res = await this.reserveStock.execute(body.productId, body.quantity, body.customerId);
    if (!res.ok) {
      const failure = res as { ok: false; error: any };
      throw new BadRequestException({ code: failure.error.code, message: failure.error.message });
    }
    // return reservations for this customer+product (may be multiple)
    const found = await this.reservations.findReservationsByCustomerAndProduct(body.customerId, body.productId);
    return { stock: res.value, reservations: found };
  }

  @Get()
  async list(@Query('customerId') customerId?: string) {
    if (!customerId) return [];
    return this.reservations.findReservationsByCustomer(customerId);
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() body: UpdateReservationRequest) {
    const r = await this.reservations.findById(id);
    if (!r) throw new NotFoundException();
    const delta = body.quantity - (r.quantity || 0);
    if (delta !== 0) {
      await this.stocks.incrementReserved(r.product.id, delta);
    }
    const updated = await this.reservations.updateQuantity(id, body.quantity);
    return updated;
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    const r = await this.reservations.findById(id);
    if (!r) throw new NotFoundException();
    // decrement reserved
    await this.stocks.incrementReserved(r.product.id, -(r.quantity || 0));
    await this.reservations.deleteReservationsByIds([id]);
    return { success: true };
  }

  @Put()
  async set(@Body() body: SetReservationRequest) {
    const { productId, customerId, quantity } = body;
    if (!productId || !customerId || typeof quantity !== 'number') {
      throw new BadRequestException('productId, customerId and quantity are required');
    }

    // existing reservations for this customer+product
    const existing = await this.reservations.findReservationsByCustomerAndProduct(customerId, productId);
    const current = (existing || []).reduce((s, r) => s + (r.quantity || 0), 0);

    const delta = quantity - current;
    if (delta === 0) {
      // consolidate if multiple
      if ((existing || []).length > 1) {
        const total = current;
        const first = existing[0];
        await this.reservations.updateQuantity(first.id, total);
        const others = existing.slice(1).map((r) => r.id);
        await this.reservations.deleteReservationsByIds(others);
        const consolidated = await this.reservations.findReservationsByCustomerAndProduct(customerId, productId);
        return { productId, customerId, quantity: total, reservations: consolidated };
      }
      return { productId, customerId, quantity: current, reservations: existing };
    }

    if (delta > 0) {
      const res = await this.reserveStock.execute(productId, delta, customerId);
      if (!res.ok) {
        const failure = res as { ok: false; error: any };
        throw new BadRequestException({ code: failure.error.code, message: failure.error.message });
      }
    } else {
      // reduce existing reservations
      let toRemove = -delta;
      const sorted = (existing || []).sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
      for (const r of sorted) {
        if (toRemove <= 0) break;
        const rid = r.id;
        const rq = r.quantity || 0;
        if (rq <= toRemove) {
          await this.stocks.incrementReserved(productId, -rq);
          await this.reservations.deleteReservationsByIds([rid]);
          toRemove -= rq;
        } else {
          const newQty = rq - toRemove;
          await this.stocks.incrementReserved(productId, -toRemove);
          await this.reservations.updateQuantity(rid, newQty);
          toRemove = 0;
        }
      }
    }

    // after adjustments, consolidate into single reservation
    const updated = await this.reservations.findReservationsByCustomerAndProduct(customerId, productId);
    const total = (updated || []).reduce((s, r) => s + (r.quantity || 0), 0);
    if ((updated || []).length > 1) {
      const first = updated[0];
      await this.reservations.updateQuantity(first.id, total);
      const others = updated.slice(1).map((r) => r.id);
      await this.reservations.deleteReservationsByIds(others);
    }
    const consolidated = await this.reservations.findReservationsByCustomerAndProduct(customerId, productId);
    return { productId, customerId, quantity: total, reservations: consolidated };
  }
}
