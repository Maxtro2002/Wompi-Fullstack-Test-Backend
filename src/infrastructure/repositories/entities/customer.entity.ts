import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { Transaction } from './transaction.entity';

@Entity({ name: 'customers' })
export class Customer {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 120 })
  name!: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  email!: string;

  @Column({ type: 'varchar', length: 30, nullable: true })
  phone?: string;

  @Column({ type: 'varchar', length: 128, nullable: true, select: false })
  passwordHash?: string;

  @Column({ type: 'varchar', length: 64, nullable: true, select: false })
  passwordSalt?: string;

  @OneToMany(() => Transaction, (tx) => tx.customer)
  transactions?: Transaction[];
}
