import 'dotenv/config';
import { DataSource } from 'typeorm';
import { Product } from './entities/product.entity';
import { Stock } from './entities/stock.entity';
import { Customer } from './entities/customer.entity';
import { Transaction } from './entities/transaction.entity';
import { Delivery } from './entities/delivery.entity';

const dataSource = new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL,
  entities: [Product, Stock, Customer, Transaction, Delivery],
  synchronize: true,
  logging: false,
});

async function run() {
  await dataSource.initialize();
  const productRepo = dataSource.getRepository(Product);
  const stockRepo = dataSource.getRepository(Stock);
  const customerRepo = dataSource.getRepository(Customer);

  // Normalize any legacy NULL reserved values to 0 to keep logic consistent
  await stockRepo
    .createQueryBuilder()
    .update(Stock)
    .set({ reserved: 0 })
    .where('reserved IS NULL')
    .execute();

  const products = [
    { name: 'Basic Tee', description: '100% cotton t-shirt', price: 29900 },
    { name: 'Sport Shoes', description: 'Lightweight running shoes', price: 189900 },
    { name: 'Wireless Mouse', description: 'Ergonomic 2.4GHz mouse', price: 59900 },
    { name: 'Backpack', description: 'Water-resistant daily backpack', price: 129900 },
    { name: 'Coffee Mug', description: 'Ceramic mug 350ml', price: 19900 },
  ];

  for (const p of products) {
    let existing = await productRepo.findOne({ where: { name: p.name } });
    if (!existing) {
      existing = await productRepo.save(productRepo.create(p));
      const stock = stockRepo.create({ product: existing, quantity: 100, reserved: 0 });
      await stockRepo.save(stock);
    }
  }

  // Ensure a demo customer exists
  let demoCustomer = await customerRepo.findOne({ where: { email: 'demo@customer.local' } });
  if (!demoCustomer) {
    demoCustomer = await customerRepo.save(
      customerRepo.create({ name: 'Demo Customer', email: 'demo@customer.local', phone: '0000000000' })
    );
  }

  // Print out IDs to help with Postman requests
  const allProducts = await productRepo.find();
  console.log('Seed completed.');
  console.log('Customer ID:', demoCustomer.id);
  console.log('Product IDs:', allProducts.map((p) => ({ id: p.id, name: p.name })));
  await dataSource.destroy();
}

run().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
