const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

// Check how many prompts from opennana have images
const prompts = await p.prompt.findMany({
  where: { source: 'opennana' },
  include: { images: true },
  take: 5
});

console.log(`Total opennana prompts: ${await p.prompt.count({ where: { source: 'opennana' } })}`);
console.log(`Total images for opennana prompts: ${await p.image.count({ where: { prompt: { source: 'opennana' } } })}`);
console.log('\nSample prompts:');
for (const p of prompts) {
  console.log(`- ${p.title}: ${p.images.length} images, coverImage=${p.images[0]?.url || 'none'}`);
}
