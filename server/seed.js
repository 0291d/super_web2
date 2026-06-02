import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { connectDB } from './config/db.js';
import { Product } from './models/Product.js';
import { Order } from './models/Order.js';
import { Professional } from './models/Professional.js';
import { ProfessionalInquiry } from './models/ProfessionalInquiry.js';
import { ServicePage } from './models/ServicePage.js';
import { Story } from './models/Story.js';
import { User } from './models/User.js';
import { products } from './seed/products.seed.js';
import { orders } from './seed/orders.seed.js';
import { customerPassword, customers } from './seed/customers.seed.js';
import { professionalPage } from './seed/professionals.seed.js';
import { servicePages } from './seed/servicePages.seed.js';
import { stories } from './seed/stories.seed.js';
import { hashPassword } from './utils/password.js';
import { syncLocalProductImages } from './utils/syncLocalProductImages.js';

dotenv.config();

await connectDB();
await Product.bulkWrite(
  products.map((product) => ({
    updateOne: {
      filter: { productId: product.productId },
      update: { $set: product },
      upsert: true,
    },
  })),
);
const projectRoot = process.cwd();
const imageSyncResult = await syncLocalProductImages({ projectRoot });
await Order.deleteMany({});
await Order.insertMany(orders);
await Story.deleteMany({});
await Story.insertMany(stories);
await Professional.deleteMany({});
await Professional.create(professionalPage);
await ProfessionalInquiry.deleteMany({});
await ServicePage.deleteMany({});
await ServicePage.insertMany(servicePages);

console.log(`Seeded ${products.length} demo products into brew.products`);
console.log(`Synced local images for ${imageSyncResult.updatedExistingCount || 0} demo products`);
console.log(`Seeded ${orders.length} demo orders into brew.orders`);
console.log(`Seeded ${stories.length} inspire stories into brew.stories`);
console.log('Seeded professionals page into brew.professionals');
console.log(`Seeded ${servicePages.length} service pages into brew.servicepages`);

const customerPasswordHash = await hashPassword(customerPassword);
await User.bulkWrite(
  customers.map((customer) => ({
    updateOne: {
      filter: { email: customer.email },
      update: {
        $set: customer,
        $setOnInsert: { passwordHash: customerPasswordHash },
      },
      upsert: true,
    },
  })),
);
console.log(`Seeded ${customers.length} demo customers into brew.users`);
console.log(`Demo customer password: ${customerPassword}`);

const demoUserEmail = 'user@brew.local';
const demoUserPassword = 'user12345';
await User.updateOne(
  { email: demoUserEmail },
  {
    $setOnInsert: {
      firstName: 'Demo',
      lastName: 'User',
      email: demoUserEmail,
      passwordHash: await hashPassword(demoUserPassword),
      role: 'user',
    },
  },
  { upsert: true },
);
console.log(`Demo user login: ${demoUserEmail} / ${demoUserPassword}`);

const adminEmail = process.env.ADMIN_EMAIL || 'admin@brew.local';
const adminPassword = process.env.ADMIN_PASSWORD || 'admin12345';
const admin = await User.findOne({ email: adminEmail });

if (!admin) {
  await User.create({
    firstName: 'BREW',
    lastName: 'Admin',
    email: adminEmail,
    passwordHash: await hashPassword(adminPassword),
    role: 'admin',
  });
  console.log(`Created admin user: ${adminEmail}`);
} else if (admin.role !== 'admin') {
  admin.role = 'admin';
  await admin.save();
  console.log(`Updated admin role for: ${adminEmail}`);
}

await mongoose.connection.close();
