import { Body, Controller, Post, BadRequestException } from '@nestjs/common';
import { randomUUID, createHash } from 'crypto';
import { IsOptional, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';

class WidgetRequest {
  // Accept either `amount` as float (e.g. 19.99) or `amountInCents` as integer (e.g. 1999)
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  amount?: number; // float in units

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  amountInCents?: number; // integer cents

  @IsOptional()
  currency?: string;

  @IsOptional()
  customerEmail?: string;

  @IsOptional()
  redirectUrl?: string;
}

@Controller('payments')
export class WompiWidgetController {
  @Post('widget')
  async createWidgetPayload(@Body() body: WidgetRequest) {
    // Normalize amount: prefer `amount` (float) else `amountInCents` (int)
    let amountInCents: number;
    if (typeof body.amount === 'number') {
      // convert units to cents, rounding to nearest integer
      amountInCents = Math.round(body.amount * 100);
    } else if (typeof body.amountInCents === 'number') {
      amountInCents = Math.round(body.amountInCents);
    } else {
      throw new BadRequestException({ message: 'amount o amountInCents debe ser provisto', error: 'Bad Request' });
    }

    if (amountInCents <= 0) {
      throw new BadRequestException({ message: 'amount debe ser un valor positivo', error: 'Bad Request' });
    }

    const currency = (body.currency || process.env.DEFAULT_CURRENCY || 'COP').toUpperCase();
    const publicKey = process.env.WOMPI_PUBLIC_KEY;
    const integrityKey = process.env.WOMPI_INTEGRITY_KEY;

    if (!publicKey || !integrityKey) {
      throw new BadRequestException('WOMPI_PUBLIC_KEY o WOMPI_INTEGRITY_KEY no están configuradas en el servidor');
    }

    const reference = `order-${randomUUID()}`;

    // Firma de integridad para widget estándar
    const signature = createHash('sha256')
      .update(`${reference}${amountInCents}${currency}${integrityKey}`)
      .digest('hex');

    return {
      publicKey,
      reference,
      amountInCents,
      currency,
      signature,
      customerEmail: body.customerEmail ?? null,
      redirectUrl: body.redirectUrl ?? null,
    };
  }
}
