const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  // admin123
  const hash = await bcrypt.hash('admin123', 12);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@promptstudio.com' },
    update: { password: hash },
    create: {
      email: 'admin@promptstudio.com',
      password: hash,
      name: 'Admin',
      role: 'ADMIN',
      membership: { create: { tier: 'PRO', credits: 9999, totalCredits: 9999 } }
    }
  });
  console.log('Admin user:', admin.email, '| role:', admin.role);
  await prisma.$disconnect();
}

main().catch(console.error);
