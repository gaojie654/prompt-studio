import * as https from 'https';
import * as http from 'http';
import * as fs from 'fs';
import * as path from 'path';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const UPLOADS_DIR = path.join(process.cwd(), 'uploads', 'opennana');
const ADMIN_USER_ID = 'cmn8aznxx0000qkdgyf36e0sp';

function httpGet(url) {
  return new Promise((resolve, reject) => {
    const lib = url.startsWith('https') ? https : http;
    lib.get(url, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' } }, (res) => {
      const chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    }).on('error', reject).setTimeout(20000, function() { reject(new Error('timeout')); });
  });
}

function parseRsc(html) {
  const re = /self\.__next_f\.push\(\[\d+,\s*"((?:[^"\\]|\\.)*)"\]\)/g;
  const parts = [];
  let m;
  while ((m = re.exec(html)) !== null) {
    try {
      parts.push(m[1]
        .replace(/\\n/g, '\n').replace(/\\r/g, '\r')
        .replace(/\\'/g, "'").replace(/\\\\/g, '\\').replace(/\\"/g, '"'));
    } catch (e) { /* skip */ }
  }
  return parts.join('');
}

function extractJsonLdFromHtml(html) {
  const match = html.match(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/i);
  if (!match || !match[1]) return null;
  try { return JSON.parse(match[1]); } catch { return null; }
}

function tryParseJsonLd(rsc) {
  const htmlKeyPos = rsc.indexOf('"__html":"{');
  if (htmlKeyPos === -1) return null;
  const jsonStart = htmlKeyPos + '"__html":"{'.length;
  const nextEntry = rsc.indexOf('1d:', htmlKeyPos);
  const searchEnd = nextEntry !== -1 ? nextEntry : rsc.length;
  const searchSlice = rsc.substring(jsonStart, searchEnd);
  let lastEnd = -1, pos = searchSlice.indexOf('}}"');
  while (pos !== -1) { lastEnd = pos; pos = searchSlice.indexOf('}}"', pos + 2); }
  if (lastEnd === -1) return null;
  const rawInner = searchSlice.substring(0, lastEnd + 1);
  try { return JSON.parse(rawInner); } catch (e) { /* noop */ }
  try { return JSON.parse(rawInner.replace(/\\"/g, '"')); } catch (e) { /* noop */ }
  let s = rawInner;
  for (let i = 0; i < 5; i++) s = s.replace(/\\"/g, '"');
  try { return JSON.parse(s); } catch (e) { /* noop */ }
  return null;
}

function downloadFile(url, destPath) {
  return new Promise((resolve, reject) => {
    const lib = url.startsWith('https') ? https : http;
    if (fs.existsSync(destPath)) { resolve(); return; }
    const dir = path.dirname(destPath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    const file = fs.createWriteStream(destPath);
    lib.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        file.close();
        downloadFile(res.headers.location || url, destPath).then(resolve).catch(reject);
        return;
      }
      res.pipe(file);
      file.on('finish', () => { file.close(); resolve(); });
    }).on('error', (err) => { try { fs.unlinkSync(destPath); } catch (e) { /* ignore */ } reject(err); });
  });
}

async function fixMissingImages() {
  if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });

  // Find prompts missing images
  const prompts = await prisma.prompt.findMany({
    where: { source: 'opennana', images: { none: {} } },
    take: 20
  });

  console.log(`Found ${prompts.length} opennana prompts missing images`);
  if (prompts.length === 0) { await prisma.$disconnect(); return; }

  for (const prompt of prompts) {
    // Try to find image from sourceUrl or construct URL
    const slug = prompt.title; // Use title as slug fallback
    let imageUrl = '';

    // Try scraping the opennana page
    try {
      const url = `https://opennana.com/awesome-prompt-gallery/${encodeURIComponent(slug)}`;
      console.log(`Trying: ${url}`);
      const body = await httpGet(url);
      const rsc = parseRsc(body);
      const jsonLd = tryParseJsonLd(rsc) || extractJsonLdFromHtml(body);
      if (jsonLd && jsonLd.image) imageUrl = jsonLd.image;
    } catch (e) {
      console.log(`  Failed to fetch page for "${prompt.title}": ${e.message}`);
    }

    if (!imageUrl) {
      console.log(`  No image found for "${prompt.title}"`);
      continue;
    }

    // Download image
    const ext = imageUrl.match(/\.(jpg|jpeg|png|webp|gif)$/i)?.[0] || '.jpg';
    const safeTitle = prompt.title.replace(/[^a-zA-Z0-9\u4e00-\u9fa5-_]/g, '-').substring(0, 50);
    const filename = `${safeTitle}-cover${ext}`;
    const localPath = path.join(UPLOADS_DIR, filename);

    try {
      await downloadFile(imageUrl, localPath);
      const localUrl = `/uploads/opennana/${filename}`;
      await prisma.image.create({
        data: { url: localUrl, userId: ADMIN_USER_ID, promptId: prompt.id }
      });
      console.log(`  ✅ Fixed: "${prompt.title}" -> ${localUrl}`);
    } catch (e) {
      console.log(`  ❌ Failed to download image for "${prompt.title}": ${e.message}`);
    }

    await new Promise(r => setTimeout(r, 300));
  }

  await prisma.$disconnect();
  console.log('\nDone!');
}

fixMissingImages();
