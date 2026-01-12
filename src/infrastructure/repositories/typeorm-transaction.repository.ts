import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Transaction } from './entities/transaction.entity';
import { Product } from './entities/product.entity';
import { Customer } from './entities/customer.entity';
import { TransactionRepositoryPort } from 'application/ports/transaction.repository.port';
import { TransactionDto } from 'application/dtos/transaction.dto';
import { TransactionStatus } from 'shared/transaction-status.enum';

@Injectable()
export class TypeOrmTransactionRepository implements TransactionRepositoryPort {
  constructor(
    @InjectRepository(Transaction) private readonly txRepo: Repository<Transaction>,
    @InjectRepository(Product) private readonly productRepo: Repository<Product>,
    @InjectRepository(Customer) private readonly customerRepo: Repository<Customer>,
  ) {}

  async create(data: Omit<TransactionDto, 'id' | 'status'> & { amount: number; status?: TransactionStatus }): Promise<TransactionDto> {
    const product = await this.productRepo.findOne({ where: { id: data.productId } });
    const customer = await this.customerRepo.findOne({ where: { id: data.customerId } });
    const tx = this.txRepo.create({
      product: product!,
      customer: customer!,
      quantity: data.quantity,
      amount: data.amount,
      status: data.status ?? TransactionStatus.PENDING,
    });
    const saved = await this.txRepo.save(tx);
    return {
      id: saved.id,
      productId: data.productId,
      customerId: data.customerId,
      quantity: saved.quantity,
      amount: Number(saved.amount),
      status: saved.status,
    };
  }

  async updateStatus(id: string, status: TransactionStatus): Promise<void> {
    await this.txRepo.update({ id }, { status });
  }

  async findById(id: string): Promise<TransactionDto | null> {
    const tx = await this.txRepo.findOne({ where: { id }, relations: ['product', 'customer'] });
    if (!tx) return null;
    return {
      id: tx.id,
      productId: tx.product.id,
      customerId: tx.customer.id,
      quantity: tx.quantity,
      amount: Number(tx.amount),
      status: tx.status,
    };
  }
}
