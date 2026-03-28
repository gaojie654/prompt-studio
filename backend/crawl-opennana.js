/**
 * opennana-scraper.js
 *
 * Crawls prompts from opennana.com via Next.js RSC streaming HTML.
 * Run: node crawl-opennana.js
 *
 * Data structure in HTML (Next.js RSC format):
 *   self.__next_f.push([index, "chunk_data"])
 *
 * Key data locations:
 *   Entry 17: Contains Chinese prompt text + promptId
 *   Entry 1d: Contains English prompt text (referenced as "$1d" in entry 17)
 *   Entry 9:  JSON-LD with title, keywords, image URL, source URL
 */

const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');

const UPLOADS_DIR = './uploads/opennana';
const OUTPUT_FILE = './opennana-prompts.json';
const scrapedData = [];

// ── HTTP helper ────────────────────────────────────────────
function httpGet(url) {
  return new Promise((resolve, reject) => {
    const lib = url.startsWith('https') ? https : http;
    lib.get(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
    }, (res) => {
      const chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    }).on('error', reject).setTimeout(20000, () => reject(new Error('timeout')));
  });
}

// ── Download file ────────────────────────────────────────────
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
    }).on('error', (err) => { try { fs.unlinkSync(destPath); } catch(e) {} reject(err); });
  });
}

// ── RSC parser ─────────────────────────────────────────────
function parseRsc(html) {
  const re = /self\.__next_f\.push\(\[\d+,\s*"((?:[^"\\]|\\.)*)"\]\)/g;
  const parts = [];
  let m;
  while ((m = re.exec(html)) !== null) {
    try {
      const s = m[1]
        .replace(/\\n/g, '\n').replace(/\\r/g, '\r')
        .replace(/\\'/g, "'").replace(/\\\\/g, '\\')
        .replace(/\\"/g, '"');
      parts.push(s);
    } catch(e) {}
  }
  return parts.join('');
}

// ── Unescape a second level of JSON string escaping ─────────
// Some pages have double-escaped quotes inside __html (a literal \" remains)
// This function tries to JSON-parse the __html value to recover
function tryParseJsonLd(rsc) {
  // Find __html with a still-escaped inner JSON
  const htmlKeyPos = rsc.indexOf('"__html":"{');
  if (htmlKeyPos === -1) return null;
  
  const jsonStart = htmlKeyPos + '"__html":"{'.length;
  
  // Find the end: look for the closing "}}  (after __html's JSON object ends)
  // Strategy: find the pattern where the __html JSON ends
  // The JSON inside __html ends with ...}},"  (closing of inner JSON, then closing of __html value)
  // We look for "}}," after the last "}" of the inner JSON
  
  // Search for the last "}}" in the JSON content (before next entry like 1d:)
  const nextEntry = rsc.indexOf('1d:', htmlKeyPos);
  const searchEnd = nextEntry !== -1 ? nextEntry : rsc.length;
  const searchSlice = rsc.substring(jsonStart, searchEnd);
  
  // Find all occurrences of }}" and use the last one
  let lastEnd = -1;
  let pos = searchSlice.indexOf('}}"');
  while (pos !== -1) {
    lastEnd = pos;
    pos = searchSlice.indexOf('}}"', pos + 2);
  }
  
  if (lastEnd === -1) return null;
  
  // lastEnd is the position of the FIRST " in '}}"'
  // The JSON content ends at lastEnd + 1 (the closing } of the inner JSON)
  const rawInner = searchSlice.substring(0, lastEnd + 1);
  
  // Try direct JSON.parse (in case it's already unescaped)
  try { return JSON.parse(rawInner); } catch(e) {}
  
  // Try unescaping remaining \"  
  try { return JSON.parse(rawInner.replace(/\\"/g, '"')); } catch(e) {}
  
  // Try multi-pass unescape
  let s = rawInner;
  for (let i = 0; i < 5; i++) { s = s.replace(/\\"/g, '"'); }
  try { return JSON.parse(s); } catch(e) {}
  
  return null;
}

// ── Extract prompt ─────────────────────────────────────────
function extractPrompt(rsc, slug) {
  const result = {
    title: '', slug,
    chinesePrompt: '', englishPrompt: '',
    tags: [], model: 'Seedance 2.0',
    coverImage: '', videoUrl: '', sourceUrl: '',
    promptId: null,
  };

  // ── Find entry 17 via $L1c marker ────────────────────
  const markerPos = rsc.indexOf('"$L1c"');
  if (markerPos === -1) return result;
  const beforeMarker = rsc.substring(0, markerPos);
  const id17Pos = beforeMarker.lastIndexOf('17:');
  if (id17Pos === -1) return result;

  const next18Pos = rsc.indexOf('18:', id17Pos + 4);
  const entry17 = rsc.substring(id17Pos + 4, next18Pos !== -1 ? next18Pos : rsc.length);

  // promptId
  const idMatch = entry17.match(/"promptId"\s*:\s*(\d+)/);
  if (idMatch) result.promptId = parseInt(idMatch[1]);

  // ── Chinese prompt ─────────────────────────────────────
  // Actual field order: "text", "type", "label"
  // Pattern: "text":"...chinese...","type":"zh","label":"中文提示词"
  const zhEndMarker = ',"type":"zh","label":"中文提示词"';
  const zhEndPos = entry17.indexOf(zhEndMarker);
  if (zhEndPos !== -1) {
    const zhTextStart = entry17.lastIndexOf('"text":"', zhEndPos);
    if (zhTextStart !== -1) {
      result.chinesePrompt = entry17.substring(zhTextStart + 8, zhEndPos)
        .replace(/\\n/g, '\n').replace(/\\r/g, '\r').replace(/\\\\/g, '\\').trim();
    }
  }

  // ── English prompt ─────────────────────────────────────
  // Pattern: "text":"$1d","type":"en","label":"英文提示词"  (reference)
  // or:       "text":"...english...","type":"en","label":"英文提示词"  (inline)
  const enEndMarker = ',"type":"en","label":"英文提示词"';
  const enEndPos = entry17.indexOf(enEndMarker);
  if (enEndPos !== -1) {
    const enTextStart = entry17.lastIndexOf('"text":"', enEndPos);
    if (enTextStart !== -1) {
      const enText = entry17.substring(enTextStart + 8, enEndPos);
      if (enText.startsWith('$')) {
        // Reference to entry 1d
        result._enRef = enText;
      } else {
        result.englishPrompt = enText.replace(/\\n/g, '\n').replace(/\\r/g, '\r').replace(/\\\\/g, '\\').trim();
      }
    }
  }

  // ── Resolve English reference from entry 1d ────────────
  if (result._enRef) {
    const id1dPos = rsc.indexOf('1d:');
    if (id1dPos !== -1) {
      const next17Pos = rsc.indexOf('17:', id1dPos + 3);
      const end = next17Pos !== -1 ? next17Pos : rsc.length;
      const entry1d = rsc.substring(id1dPos + 3, end).trim();
      // Strip leading ref ID like T549,
      result.englishPrompt = entry1d.replace(/^T\d+,/, '')
        .replace(/\\n/g, '\n').replace(/\\r/g, '\r').replace(/\\\\/g, '\\').trim();
    }
  }

  // ── JSON-LD via tryParseJsonLd ────────────────────────────
  const jsonLd = tryParseJsonLd(rsc);
  if (jsonLd) {
    result.title = jsonLd.name || '';
    result.coverImage = jsonLd.image || '';
    result.sourceUrl = jsonLd.url || '';
    result.tags = jsonLd.keywords
      ? jsonLd.keywords.split(/[,，\s]+/).filter((t) =>
          t.length > 1 && t.length < 30 &&
          !t.includes('提示词') && !t.includes('prompt') &&
          !t.includes('Image Prompt') && !t.includes('Seedance') && !t.includes('AI图片'))
      : [];
  }

  // ── Model detection ─────────────────────────────────────
  if ((result.tags.join(' ') + ' ' + result.chinesePrompt).includes('Nano Banana Pro')) {
    result.model = 'Nano Banana Pro';
  }

  return result;
}

// ── Map platform ───────────────────────────────────────────
function mapPlatform(tags) {
  const text = tags.join(' ').toLowerCase();
  if (text.includes('小红书') || text.includes('rednote')) return 'xiaohongshu_cover_v';
  if (text.includes('抖音') || text.includes('douyin')) return 'douyin_cover';
  if (text.includes('淘宝') || text.includes('taobao')) return 'taobao_main';
  if (text.includes('京东')) return 'jd_main';
  if (text.includes('拼多多')) return 'pdd_main';
  if (text.includes('公众号')) return 'gzh_cover';
  return 'xiaohongshu_cover_v';
}

// ── Download cover ─────────────────────────────────────────
async function downloadCover(imageUrl, slug) {
  if (!imageUrl || !imageUrl.startsWith('http') || imageUrl.includes('/pthumbs/')) return '';
  const ext = (imageUrl.match(/\.(jpg|jpeg|png|webp|gif)$/i)?.[0]) || '.jpg';
  const filename = `${slug.replace(/[^a-zA-Z0-9-_]/g, '-')}-cover${ext}`;
  const localPath = path.join(UPLOADS_DIR, filename);
  try {
    await downloadFile(imageUrl, localPath);
    return `/uploads/opennana/${filename}`;
  } catch(e) { return ''; }
}

// ── Sitemap ────────────────────────────────────────────────
async function getPromptUrls() {
  const body = await httpGet('https://opennana.com/sitemap.xml');
  return (body.match(/<loc>(.*?)<\/loc>/g) || [])
    .map(u => u.replace(/<\/?loc>/g, ''))
    .filter(u => u.includes('/awesome-prompt-gallery/') && !u.endsWith('/awesome-prompt-gallery'));
}

// ── Scrape single ─────────────────────────────────────────
async function scrapePrompt(url) {
  const slug = url.replace('https://opennana.com/awesome-prompt-gallery/', '');
  try {
    const body = await httpGet(url);
    const rsc = parseRsc(body);
    if (rsc.length < 1000) return null;
    const result = extractPrompt(rsc, slug);
    
    // Extract JSON-LD directly from HTML (it's not escaped in the HTML source)
    const ldJsonMatch = body.match(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/i);
    if (ldJsonMatch && ldJsonMatch[1]) {
      try {
        const jsonLd = JSON.parse(ldJsonMatch[1]);
        result.title = result.title || jsonLd.name || '';
        result.coverImage = result.coverImage || jsonLd.image || '';
        result.sourceUrl = result.sourceUrl || jsonLd.url || '';
        if (jsonLd.keywords && !result.tags.length) {
          result.tags = jsonLd.keywords.split(/[,，\s]+/).filter((t) =>
            t.length > 1 && t.length < 30 &&
            !t.includes('提示词') && !t.includes('prompt') &&
            !t.includes('Image Prompt') && !t.includes('Seedance') && !t.includes('AI图片'));
        }
      } catch(e) {}
    }
    
    return result;
  } catch(e) { return null; }
}

// ── Seed ───────────────────────────────────────────────────
async function seedPrompt(data) {
  if (!data || !data.title || (!data.chinesePrompt && !data.englishPrompt)) return 'skip-empty';
  const promptText = data.englishPrompt || data.chinesePrompt;
  if (promptText.length < 20) return 'skip-short';

  // Check duplicate by title
  if (scrapedData.some(d => d.title === data.title)) return 'skip-dup';

  let localImage = '';
  if (data.coverImage) localImage = await downloadCover(data.coverImage, data.slug);

  scrapedData.push({
    title: data.title,
    content: promptText,
    contentZh: data.chinesePrompt || null,
    category: data.model,
    imageUrl: localImage || null,
    coverImageUrl: data.coverImage || null,
    sourceUrl: data.sourceUrl || '',
    isPublic: true,
    useCount: Math.floor(Math.random() * 300) + 20,
    tags: [...new Set(['opennana', ...data.tags.filter(t => t.length > 1 && t.length < 20)])].slice(0, 10),
    source: 'opennana',
  });
  return 'seeded';
}

// ── Main ──────────────────────────────────────────────────
async function main() {
  if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });
  const urls = await getPromptUrls();
  console.log(`Found ${urls.length} prompt URLs\n`);
  let seeded = 0, skipped = 0, errors = 0;
  for (let i = 0; i < urls.length; i++) {
    const url = urls[i];
    const slug = url.replace('https://opennana.com/awesome-prompt-gallery/', '');
    process.stdout.write(`[${i + 1}/${urls.length}] ${slug}... `);
    const data = await scrapePrompt(url);
    const result = await seedPrompt(data);
    if (result === 'seeded') { console.log(`✅ ${data.title} (${data.model})`); seeded++; }
    else if (result === 'skip-dup') { console.log(`⏭ duplicate`); skipped++; }
    else if (result === 'skip-empty' || result === 'skip-short') { console.log(`⚠ ${result}`); skipped++; }
    else { console.log(`❌ ${result}`); errors++; }
    if (i % 5 === 4) await new Promise(r => setTimeout(r, 500));
    else await new Promise(r => setTimeout(r, 200));
  }

  // Write all scraped data to JSON file
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(scrapedData, null, 2), 'utf8');

  console.log(`\n\n✅ Done! Seeded: ${seeded} | Skipped: ${skipped} | Errors: ${errors}`);
  console.log(`📁 Data written to: ${OUTPUT_FILE}`);
  process.exit(0);
}

main().catch((e) => { console.error('Fatal:', e.message); process.exit(1); });
