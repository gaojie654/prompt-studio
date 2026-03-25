import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create demo user
  const hashedPassword = await bcrypt.hash('demo123', 12);
  const demoUser = await prisma.user.upsert({
    where: { email: 'demo@promptstudio.com' },
    update: {},
    create: {
      email: 'demo@promptstudio.com',
      password: hashedPassword,
      name: 'Demo User',
      membership: {
        create: {
          tier: 'PRO',
          credits: 500,
          totalCredits: 500,
        },
      },
    },
    include: { membership: true },
  });
  console.log('✅ Demo user created:', demoUser.email);

  // Create sample prompts
  const samplePrompts = [
    {
      title: '小红书美妆产品展示',
      content: 'A beautiful cosmetics product photo, placed on a marble surface, soft natural lighting from window, morning vibe, pastel colors, clean background, professional product photography, high-end beauty brand aesthetic',
      description: '适合美妆产品在小红书平台展示的提示词，突出产品质感和高级感',
      category: 'ecommerce',
      tags: ['美妆', '小红书', '产品展示', '高级感'],
      isPublic: true,
      isFeatured: true,
      price: 0,
      authorId: demoUser.id,
    },
    {
      title: '抖音服装带货场景',
      content: 'Fashion clothing displayed on a modern retail rack, bright studio lighting, clean white background, e-commerce product shot, vibrant colors, trendiest street style, Instagram-worthy composition',
      description: '适合抖音服装展示的场景图，突出服装质感和潮流感',
      category: 'ecommerce',
      tags: ['服装', '抖音', '带货', '潮流'],
      isPublic: true,
      isFeatured: true,
      price: 0,
      authorId: demoUser.id,
    },
    {
      title: '淘宝家居产品场景',
      content: 'Cozy living room interior with modern furniture, warm afternoon sunlight streaming through windows, neutral color palette with accent pillows, minimalist Scandinavian style, lifestyle photography, inviting and comfortable atmosphere',
      description: '适合淘宝家居产品展示的场景图，营造温馨生活氛围',
      category: 'ecommerce',
      tags: ['家居', '淘宝', '场景', '温馨'],
      isPublic: true,
      isFeatured: false,
      price: 0,
      authorId: demoUser.id,
    },
    {
      title: '小红书美食探店风格',
      content: 'Delicious food photography, top-down angle, wooden table texture, natural lighting, styled with utensils and napkins, appetizing colors, food blogger style, Instagram flat lay',
      description: '适合美食类小红书内容的图片提示词，美食探店风格',
      category: 'social',
      tags: ['美食', '小红书', '探店', '摄影'],
      isPublic: true,
      isFeatured: true,
      price: 0,
      authorId: demoUser.id,
    },
    {
      title: '抖音户外运动场景',
      content: 'Active lifestyle photography, person hiking in mountains, golden hour lighting, adventure and freedom feeling, breath-taking landscape background, energetic and inspiring mood',
      description: '适合户外运动类抖音内容的场景图，充满活力和自由感',
      category: 'social',
      tags: ['户外', '运动', '抖音', '活力'],
      isPublic: true,
      isFeatured: false,
      price: 0,
      authorId: demoUser.id,
    },
    {
      title: '公众号文章配图-科技风',
      content: 'Futuristic tech concept, abstract digital visualization, blue and purple gradient lighting, modern data center aesthetic, cyberpunk atmosphere, suitable for technology article cover',
      description: '适合科技类公众号文章配图，现代科技感',
      category: 'media',
      tags: ['科技', '公众号', '配图', '未来感'],
      isPublic: true,
      isFeatured: false,
      price: 0,
      authorId: demoUser.id,
    },
    {
      title: '电商数码产品展示',
      content: 'Sleek electronics product shot, latest smartphone on glass surface, studio lighting with soft shadows, minimalist setup, premium quality feel, clean and modern aesthetic',
      description: '适合数码产品电商展示，简洁现代风格',
      category: 'ecommerce',
      tags: ['数码', '手机', '电商', '简洁'],
      isPublic: true,
      isFeatured: true,
      price: 0,
      authorId: demoUser.id,
    },
    {
      title: '拼多多低价好物风格',
      content: 'Budget-friendly product photo, bright and cheerful color scheme, clean white background, clear product visibility, value for money feeling, appealing to price-conscious shoppers',
      description: '适合拼多多平台的低价好物风格，明亮清新',
      category: 'ecommerce',
      tags: ['拼多多', '低价', '好物', '清新'],
      isPublic: true,
      isFeatured: false,
      price: 0,
      authorId: demoUser.id,
    },
  ];

  for (const promptData of samplePrompts) {
    await prisma.prompt.upsert({
      where: {
        id: promptData.title, // Use title as unique identifier for upsert
      },
      update: {
        ...promptData,
        useCount: Math.floor(Math.random() * 1000),
        likeCount: Math.floor(Math.random() * 100),
        viewCount: Math.floor(Math.random() * 5000),
      },
      create: {
        ...promptData,
        useCount: Math.floor(Math.random() * 1000),
        likeCount: Math.floor(Math.random() * 100),
        viewCount: Math.floor(Math.random() * 5000),
      },
    });
  }
  console.log('✅ Sample prompts created:', samplePrompts.length);

  console.log('🎉 Seeding completed!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
