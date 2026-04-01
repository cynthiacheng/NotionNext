const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  const hashed = await bcrypt.hash('admin123', 10);
  await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      email: 'admin@example.com',
      password: hashed,
      name: 'Admin',
      company: 'HQ',
      role: 'ADMIN',
      approved: true
    }
  });
  console.log('Seeded admin: admin@example.com / admin123');
}

main().catch(console.error).finally(() => prisma.$disconnect());
