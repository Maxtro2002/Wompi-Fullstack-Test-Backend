import { Column, CreateDateColumn, Entity, ManyToOne, OneToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Product } from './product.entity';
import { Customer } from './customer.entity';
import { Delivery } from './delivery.entity';
import { TransactionStatus } from '../../../shared/transaction-status.enum';

@Entity({ name: 'transactions' })
export class Transaction {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => Product, { eager: true })
  product!: Product;

  @ManyToOne(() => Customer, (customer) => customer.transactions, { eager: true })
  customer!: Customer;

  @Column({ type: 'int' })
  quantity!: number;

  @Column({ type: 'numeric', precision: 12, scale: 2 })
  amount!: number;

  @Column({ type: 'enum', enum: TransactionStatus, default: TransactionStatus.PENDING })
  status!: TransactionStatus;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @OneToOne(() => Delivery, (delivery) => delivery.transaction)
  delivery?: Delivery;
}
