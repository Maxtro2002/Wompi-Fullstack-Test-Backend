import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { typeOrmConfig } from './repositories/typeorm.config';
import { Product } from './repositories/entities/product.entity';
import { Stock } from './repositories/entities/stock.entity';
import { Customer } from './repositories/entities/customer.entity';
import { Transaction } from './repositories/entities/transaction.entity';
import { Delivery } from './repositories/entities/delivery.entity';
import { Reservation } from './repositories/entities/reservation.entity';
import { TypeOrmProductRepository } from './repositories/typeorm-product.repository';
import { TypeOrmStockRepository } from './repositories/typeorm-stock.repository';
import { TypeOrmCustomerRepository } from './repositories/typeorm-customer.repository';
import { TypeOrmTransactionRepository } from './repositories/typeorm-transaction.repository';
import { TypeOrmDeliveryRepository } from './repositories/typeorm-delivery.repository';
import { TypeormReservationRepository } from './repositories/typeorm-reservation.repository';
import { ListProductsUseCase } from 'application/use-cases/list-products.usecase';
import { ReserveStockUseCase } from 'application/use-cases/reserve-stock.usecase';
import { CreateTransactionUseCase } from 'application/use-cases/create-transaction.usecase';
import { CreateDeliveryUseCase } from 'application/use-cases/create-delivery.usecase';
import { ProcessPaymentUseCase } from 'application/use-cases/process-payment.usecase';
import { GetCartSummaryUseCase } from 'application/use-cases/get-cart-summary.usecase';
import { ProductsController } from './controllers/products.controller';
import { StockController } from './controllers/stock.controller';
import { TransactionsController } from './controllers/transactions.controller';
import { DeliveriesController } from './controllers/deliveries.controller';
import { ReservationsController } from './controllers/reservations.controller';
import { CartController } from './controllers/cart.controller';
import { HealthController } from './controllers/health.controller';
import { PaymentsController } from './controllers/payments.controller';
import { WompiWidgetController } from './controllers/wompi-widget.controller';
import { CustomersController } from './controllers/customers.controller';
import { AuthController } from './controllers/auth.controller';
import { WompiPaymentGatewayAdapter } from './gateways/wompi-payment.gateway';

@Module({
  imports: [
    TypeOrmModule.forRoot(typeOrmConfig),
    TypeOrmModule.forFeature([Product, Stock, Customer, Transaction, Delivery, Reservation]),
  ],
  controllers: [ProductsController, StockController, TransactionsController, DeliveriesController, HealthController, PaymentsController, WompiWidgetController, CustomersController, AuthController, ReservationsController, CartController],
  providers: [
    // Adapters
    TypeOrmProductRepository,
    TypeOrmStockRepository,
    TypeOrmCustomerRepository,
    TypeOrmTransactionRepository,
    TypeOrmDeliveryRepository,
    TypeormReservationRepository,
    WompiPaymentGatewayAdapter,
    // Use cases wired to adapters
    {
      provide: ListProductsUseCase,
      useFactory: (products: TypeOrmProductRepository) => new ListProductsUseCase(products),
      inject: [TypeOrmProductRepository],
    },
    {
      provide: ReserveStockUseCase,
      useFactory: (stocks: TypeOrmStockRepository, reservations: TypeormReservationRepository) => new ReserveStockUseCase(stocks, reservations),
      inject: [TypeOrmStockRepository, TypeormReservationRepository],
    },
    {
      provide: CreateTransactionUseCase,
      useFactory: (
        products: TypeOrmProductRepository,
        transactions: TypeOrmTransactionRepository,
        customers: TypeOrmCustomerRepository,
        reservations: TypeormReservationRepository,
      ) => new CreateTransactionUseCase(products, transactions, customers, reservations),
      inject: [TypeOrmProductRepository, TypeOrmTransactionRepository, TypeOrmCustomerRepository, TypeormReservationRepository],
    },
    {
      provide: CreateDeliveryUseCase,
      useFactory: (
        deliveries: TypeOrmDeliveryRepository,
        transactions: TypeOrmTransactionRepository
      ) => new CreateDeliveryUseCase(deliveries, transactions),
      inject: [TypeOrmDeliveryRepository, TypeOrmTransactionRepository],
    },
    {
      provide: ProcessPaymentUseCase,
      useFactory: (
        payments: WompiPaymentGatewayAdapter,
        transactions: TypeOrmTransactionRepository,
        stocks: TypeOrmStockRepository
      ) => new ProcessPaymentUseCase(payments, transactions, stocks),
      inject: [WompiPaymentGatewayAdapter, TypeOrmTransactionRepository, TypeOrmStockRepository],
    },
    {
      provide: GetCartSummaryUseCase,
      useFactory: (
        transactions: TypeOrmTransactionRepository,
        products: TypeOrmProductRepository,
        reservations: TypeormReservationRepository,
      ) => new GetCartSummaryUseCase(transactions, products, reservations),
      inject: [TypeOrmTransactionRepository, TypeOrmProductRepository, TypeormReservationRepository],
    },
  ],
})
export class AppModule {}
