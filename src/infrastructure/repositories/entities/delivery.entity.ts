import { Column, Entity, JoinColumn, OneToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { Transaction } from './transaction.entity';
import { DeliveryStatus } from '../../../shared/delivery-status.enum';

@Entity({ name: 'deliveries' })
export class Delivery {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @OneToOne(() => Transaction, (tx) => tx.delivery, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'transaction_id' })
  transaction!: Transaction;

  @Column({ type: 'varchar', length: 200 })
  addressLine1!: string;

  @Column({ type: 'varchar', length: 200, nullable: true })
  addressLine2?: string;

  @Column({ type: 'varchar', length: 100 })
  city!: string;

  @Column({ type: 'varchar', length: 100 })
  state!: string;

  @Column({ type: 'varchar', length: 20 })
  postalCode!: string;

  @Column({ type: 'varchar', length: 60 })
  country!: string;

  @Column({ type: 'enum', enum: DeliveryStatus, default: DeliveryStatus.PENDING })
  status!: DeliveryStatus;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date;
}
