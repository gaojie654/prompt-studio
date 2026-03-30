import { PrismaClient } from '@prisma/client';
const p = new PrismaClient();

const total = await p.prompt.count({ where: { source: 'opennana' } });
const imageCount = await p.image.count({ where: { prompt: { source: 'opennana' } } });

console.log(`Total opennana prompts: ${total}`);
console.log(`Total images for opennana prompts: ${imageCount}`);

const prompts = await p.prompt.findMany({
  where: { source: 'opennana' },
  include: { images: true },
  take: 5
});

console.log('\nSample prompts:');
for (const prompt of prompts) {
  console.log(`- "${prompt.title}": ${prompt.images.length} image(s), url=${prompt.images[0]?.url || 'none'}`);
}

await p.$disconnect();
