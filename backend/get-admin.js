const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
p.user.findFirst({ where: { email: 'admin@promptstudio.com' } }).then(u => {
  console.log(u.id);
  p.disconnect();
});
