import 'dotenv/config';
import pkgPrisma from '@prisma/client';
const { PrismaClient } = pkgPrisma;
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import bcrypt from 'bcrypt';
import { nanoid } from 'nanoid';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function seed() {
  console.log('Starting seed...');
  
  // We'll use the same password for all for easy testing
  const password = 'password123';
  const hash = await bcrypt.hash(password, 10);

  const users = [
    {
      id: nanoid(),
      email: 'admin@cinecast.sk',
      full_name: 'Ahmed Arkan',
      role: 'admin',
      password_hash: hash,
      is_verified: 1,
    },
    {
      id: nanoid(),
      email: 'user1@cinecast.sk',
      full_name: 'John Doe',
      role: 'user',
      password_hash: hash,
      is_verified: 1,
    },
    {
      id: nanoid(),
      email: 'user2@cinecast.sk',
      full_name: 'Jane Smith',
      role: 'user',
      password_hash: hash,
      is_verified: 1,
    },
  ];

  for (const user of users) {
    await prisma.user.upsert({
      where: { email: user.email },
      update: {},
      create: user,
    });
    console.log(`Created/Verified user: ${user.email}`);
  }

  console.log('Seed completed successfully.');
}

seed()
  .catch((e) => {
    console.error('Error seeding users:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });