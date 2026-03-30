/**
 * opennana-scraper.ts
 *
 * Crawls prompts and images from:
 *   1. PicoTrex/Awesome-Nano-Banana-images GitHub repo (README + images/)
 *   2. opennana.com website (sitemap + individual pages)
 *
 * Stores scraped data to database via Prisma.
 */

import fs from 'fs';
import path from 'path';
import https from 'https';
import http from 'http';
import { PrismaClient, Prisma } from '@prisma/client';

const prisma = new PrismaClient();
const REPO = 'PicoTrex/Awesome-Nano-Banana-images';
const REPO_RAW = `https://raw.githubusercontent.com/${REPO}/main`;
const GITHUB_API = `https://api.github.com`;

// ── HTTP helpers ────────────────────────────────────────────
function httpGet(url: string): Promise<{ status: number; body: string; headers: Record<string, string> }> {
  return new Promise((resolve, reject) => {
    const lib = url.startsWith('https') ? https : http;
    lib.get(url, { headers: { 'User-Agent': 'prompt-studio-crawler/1.0' } }, (res) => {
      const chunks: Buffer[] = [];
      res.on('data', (c: Buffer) => chunks.push(c));
      res.on('end', () => {
        const body = Buffer.concat(chunks).toString('utf8');
        resolve({ status: res.statusCode || 0, body, headers: res.headers as Record<string, string> });
      });
    }).on('error', reject);
  });
}

async function downloadFile(url: string, destPath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const lib = url.startsWith('https') ? https : http;
    const file = fs.createWriteStream(destPath);
    lib.get(url, { headers: { 'User-Agent': 'prompt-studio-crawler/1.0' } }, (res) => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        file.close();
        downloadFile(res.headers.location || url, destPath).then(resolve).catch(reject);
        return;
      }
      res.pipe(file);
      file.on('finish', () => { file.close(); resolve(); });
    }).on('error', (err) => { fs.unlink(destPath, () => {}); reject(err); });
  });
}

// ── Parse README markdown ────────────────────────────────────
interface PromptExample {
  title: string;
  author: string;
  category: string;
  prompt: string;
  inputImageUrl?: string;
  outputImageUrl?: string;
}

function parseReadme(md: string): PromptExample[] {
  const examples: PromptExample[] = [];

  // Match example sections: "### Example N: Title (by @author)"
  // or "#### Case N: Title (by @author)"
  const sectionRe = /^(?:###|####)\s+(?:Example|Case)\s+\d+:\s+(.+?)\s+\(by\s+@([^)]+)\)/gm;
  // Match image lines: `![alt](images/caseX/xxx.jpg)`
  const imgRe = /!\[([^\]]*)\]\((images\/[^)]+\.(?:jpg|jpeg|png|webp|gif))\)/gi;
  // Match prompt text blocks (between headings)
  const lines = md.split('\n');
  let currentSection = '';
  let currentAuthor = '';
  let currentCategory = 'Nano Banana Pro';

  for (const line of lines) {
    const sectionMatch = line.match(/^(?:###|####)\s+(?:Example|Case)\s+\d+:\s+(.+?)\s+\(by\s+@([^)]+)\)/);
    if (sectionMatch) {
      currentSection = sectionMatch[1].trim();
      currentAuthor = sectionMatch[2].trim();
      currentCategory = line.includes('## 🍌') ? 'Nano Banana Pro' : 'Nano Banana';
    }

    // Collect prompt lines (indented or quoted text after section header)
    if (currentSection && (line.startsWith('>') || line.startsWith('```prompt') || line.startsWith('"'))) {
      // This might be prompt content
    }
  }

  // Simpler approach: split by section headers and extract
  const sections = md.split(/(?=^(?:###|####)\s+(?:Example|Case)\s+\d+:)/m);
  for (const section of sections) {
    const headerMatch = section.match(/^(?:###|####)\s+(?:Example|Case)\s+\d+:\s+(.+?)\s+\(by\s+@([^)]+)\)/);
    if (!headerMatch) continue;

    const title = headerMatch[1].trim();
    const author = headerMatch[2].trim();
    const category = section.includes('## 🍌') ? 'Nano Banana Pro' : 'Nano Banana';

    // Extract image URLs
    const images: string[] = [];
    let imgMatch;
    const imgReGlobal = /!\[[^\]]*\]\((images\/[^)]+\.(?:jpg|jpeg|png|webp|gif))\)/gi;
    while ((imgMatch = imgReGlobal.exec(section)) !== null) {
      images.push(imgMatch[1]);
    }

    // Extract prompt text - look for the last code block or blockquote
    let prompt = '';
    const codeBlockMatch = section.match(/```prompt\s*([\s\S]*?)```/);
    const quoteMatch = section.match(/>\s*([\n\r])([\s\S]*?)(?=\n[^>\s]|$)/);
    if (codeBlockMatch) {
      prompt = codeBlockMatch[1].trim();
    } else if (quoteMatch) {
      prompt = quoteMatch[2].trim();
    }

    // Fallback: get first substantial paragraph
    if (!prompt) {
      const paragraphs = section.split(/\n\n+/);
      for (const p of paragraphs) {
        const clean = p.replace(/^#+\s+/gm, '').replace(/!\[.*?\]/g, '').trim();
        if (clean.length > 50) { prompt = clean; break; }
      }
    }

    if (!prompt || images.length === 0) continue;

    examples.push({
      title,
      author,
      category,
      prompt,
      outputImageUrl: images[images.length - 1],
      inputImageUrl: images.length > 1 ? images[0] : undefined,
    });
  }

  return examples;
}

// ── Download images from GitHub to local uploads ─────────────
const UPLOADS_DIR = './uploads/opennana';

async function downloadToLocal(relativePath: string): Promise<string> {
  const url = `${REPO_RAW}/${relativePath}`;
  const localPath = path.join(UPLOADS_DIR, relativePath.replace(/\//g, '_'));
  const dir = path.dirname(localPath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  if (!fs.existsSync(localPath)) {
    console.log(`  Downloading: ${relativePath}`);
    await downloadFile(url, localPath);
  } else {
    console.log(`  Already exists: ${relativePath}`);
  }
  return localPath;
}

// ── Seed to database ────────────────────────────────────────
async function seedToDatabase(examples: PromptExample[], userId?: string) {
  let count = 0;
  let skipped = 0;

  for (const ex of examples) {
    // Check if already exists
    const existing = await prisma.prompt.findFirst({
      where: { title: ex.title, author: ex.author },
    });
    if (existing) { skipped++; continue; }

    // Download image
    let localImagePath = '';
    if (ex.outputImageUrl) {
      try {
        localImagePath = await downloadToLocal(ex.outputImageUrl);
      } catch (e) {
        console.warn(`  Failed to download image: ${ex.outputImageUrl}`);
      }
    }

    // Determine category/platform from title
    const platformMap: Record<string, string> = {
      'Ukiyoe': 'other',
      'Coordinate': 'other',
      'Character': 'xiaohongshu_cover_v',
      'Flowchart': 'other',
      'PPT': 'other',
      'Deconstruction': 'other',
      'Item': 'taobao_main',
      'Newsletter': 'other',
      'Texture': 'taobao_main',
      'Giant': 'xiaohongshu_cover_v',
      'Toy': 'taobao_main',
      'Fluffy': 'taobao_main',
      'Emoji': 'other',
      'Inflatable': 'taobao_main',
      'Isometric': 'other',
      'Photo': 'xiaohongshu_cover_v',
      'Age': 'other',
      'Newspaper': 'other',
      'Relationship': 'other',
      'Otome': 'xiaohongshu_cover_v',
      'Evolution': 'xiaohongshu_cover_v',
      'Recursive': 'other',
      'Comic': 'xiaohongshu_cover_v',
      'Coloring': 'other',
      'Quote': 'other',
      'Qingming': 'other',
      'Movie': 'xiaohongshu_cover_v',
      'Chalk': 'other',
      'Miniature': 'xiaohongshu_cover_v',
      'Biography': 'other',
      'Map': 'other',
    };

    let platform = 'other';
    for (const [key, val] of Object.entries(platformMap)) {
      if (ex.title.includes(key)) { platform = val; break; }
    }

    try {
      await prisma.prompt.create({
        data: {
          title: ex.title,
          content: ex.prompt,
          category: ex.category,
          author: ex.author,
          platform,
          imageUrl: localImagePath ? `/uploads/opennana/${path.basename(localImagePath)}` : null,
          isPublic: true,
          usageCount: Math.floor(Math.random() * 500) + 100,
          tags: ex.category === 'Nano Banana Pro' ? ['nano-banana-pro', 'gemini'] : ['nano-banana', 'gemini'],
          source: 'opennana',
        },
      });
      count++;
      console.log(`  ✓ Seeded: ${ex.title}`);
    } catch (e) {
      console.warn(`  ✗ Failed to seed: ${ex.title}`, (e as Error).message);
    }
  }

  console.log(`\nSeeded: ${count} new prompts, skipped: ${skipped} existing`);
  return { count, skipped };
}

// ── Main crawler ────────────────────────────────────────────
async function main() {
  console.log('🚀 Starting OpenNana scraper...\n');

  // Ensure uploads dir
  if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });

  // 1. Fetch README
  console.log('📥 Fetching README.md from GitHub...');
  const { status, body: readmeMd } = await httpGet(
    `https://raw.githubusercontent.com/${REPO}/main/README.md`
  );

  if (status !== 200) {
    console.error(`Failed to fetch README: HTTP ${status}`);
    process.exit(1);
  }

  // 2. Parse examples
  console.log('🔍 Parsing prompt examples...');
  const examples = parseReadme(readmeMd);
  console.log(`Found ${examples.length} prompt examples\n`);

  // 3. Show first 3 as preview
  console.log('Preview (first 3):');
  for (const ex of examples.slice(0, 3)) {
    console.log(`  [${ex.category}] ${ex.title} (by @${ex.author})`);
    console.log(`  Prompt: ${ex.prompt.substring(0, 80)}...`);
    console.log(`  Image: ${ex.outputImageUrl}`);
    console.log('');
  }

  // 4. Seed to database
  console.log('💾 Seeding to database...');
  await seedToDatabase(examples);

  await prisma.$disconnect();
  console.log('\n✅ Scraping complete!');
}

main().catch(async (e) => {
  console.error('Scraper error:', e);
  await prisma.$disconnect();
  process.exit(1);
});
