import { Column, Entity, OneToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Stock } from './stock.entity';

@Entity({ name: 'products' })
export class Product {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 120 })
  name!: string;

  @Column({ type: 'varchar', length: 500 })
  description!: string;

  @Column({ type: 'numeric', precision: 10, scale: 2 })
  price!: number;

  @OneToOne(() => Stock, (stock) => stock.product)
  stock?: Stock;
}
