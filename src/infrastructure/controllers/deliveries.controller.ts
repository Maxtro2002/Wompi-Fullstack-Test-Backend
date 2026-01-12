import { Body, Controller, Post, BadRequestException } from '@nestjs/common';
import { CreateDeliveryUseCase } from 'application/use-cases/create-delivery.usecase';

class CreateDeliveryRequest {
  transactionId!: string;
  addressLine1!: string;
  addressLine2?: string;
  city!: string;
  state!: string;
  postalCode!: string;
  country!: string;
}

@Controller('deliveries')
export class DeliveriesController {
  constructor(private readonly createDelivery: CreateDeliveryUseCase) {}

  @Post()
  async create(@Body() body: CreateDeliveryRequest) {
    const result = await this.createDelivery.execute({
      transactionId: body.transactionId,
      addressLine1: body.addressLine1,
      addressLine2: body.addressLine2,
      city: body.city,
      state: body.state,
      postalCode: body.postalCode,
      country: body.country,
    });
    if (!result.ok) {
      const failure = result as { ok: false; error: any };
      throw new BadRequestException({ code: failure.error.code, message: failure.error.message });
    }
    return result.value;
  }
}
