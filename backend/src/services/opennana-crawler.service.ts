import * as https from 'https';
import * as http from 'http';
import * as fs from 'fs';
import * as path from 'path';
import prisma from '../utils/prisma';
import { getCrawlStatus, setCrawlStatus } from './crawl-status.service';

const UPLOADS_DIR = path.join(process.cwd(), 'uploads', 'opennana');

// ── Types ────────────────────────────────────────────────
export interface ExtractedPrompt {
  title: string;
  slug: string;
  chinesePrompt: string;
  englishPrompt: string;
  tags: string[];
  model: string;
  coverImage: string;
  sourceUrl: string;
  _enRef?: string;
}

// ── HTTP helper ────────────────────────────────────────────
function httpGet(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const lib = url.startsWith('https') ? https : http;
    lib.get(
      url,
      { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' } },
      (res) => {
        const chunks: Buffer[] = [];
        res.on('data', (c: Buffer) => chunks.push(c));
        res.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
      }
    )
      .on('error', reject)
      .setTimeout(20000, function () {
        reject(new Error('timeout'));
      });
  });
}

// ── Download file ────────────────────────────────────────────
function downloadFile(url: string, destPath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const lib = url.startsWith('https') ? https : http;
    if (fs.existsSync(destPath)) {
      resolve();
      return;
    }
    const dir = path.dirname(destPath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    const file = fs.createWriteStream(destPath);
    lib.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        file.close();
        downloadFile(res.headers.location || url, destPath)
          .then(resolve)
          .catch(reject);
        return;
      }
      res.pipe(file);
      file.on('finish', () => {
        file.close();
        resolve();
      });
    }).on('error', (err) => {
      try { fs.unlinkSync(destPath); } catch (e) { /* ignore */ }
      reject(err);
    });
  });
}

// ── RSC parser ─────────────────────────────────────────────
function parseRsc(html: string): string {
  const re = /self\.__next_f\.push\(\[\d+,\s*"((?:[^"\\]|\\.)*)"\]\)/g;
  const parts: string[] = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(html)) !== null) {
    try {
      const s = m[1]
        .replace(/\\n/g, '\n')
        .replace(/\\r/g, '\r')
        .replace(/\\'/g, "'")
        .replace(/\\\\/g, '\\')
        .replace(/\\"/g, '"');
      parts.push(s);
    } catch (e) {
      /* skip malformed chunk */
    }
  }
  return parts.join('');
}

// ── Extract JSON-LD from raw HTML ───────────────────────────
function extractJsonLdFromHtml(html: string): Record<string, any> | null {
  const match = html.match(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/i);
  if (!match || !match[1]) return null;
  try {
    return JSON.parse(match[1]);
  } catch {
    return null;
  }
}

// ── Try parse JSON-LD from RSC ─────────────────────────────
function tryParseJsonLd(rsc: string): Record<string, any> | null {
  const htmlKeyPos = rsc.indexOf('"__html":"{');
  if (htmlKeyPos === -1) return null;

  const jsonStart = htmlKeyPos + '"__html":"{'.length;
  const nextEntry = rsc.indexOf('1d:', htmlKeyPos);
  const searchEnd = nextEntry !== -1 ? nextEntry : rsc.length;
  const searchSlice = rsc.substring(jsonStart, searchEnd);

  let lastEnd = -1;
  let pos = searchSlice.indexOf('}}"');
  while (pos !== -1) {
    lastEnd = pos;
    pos = searchSlice.indexOf('}}"', pos + 2);
  }

  if (lastEnd === -1) return null;

  const rawInner = searchSlice.substring(0, lastEnd + 1);

  try { return JSON.parse(rawInner); } catch (e) { /* noop */ }
  try { return JSON.parse(rawInner.replace(/\\"/g, '"')); } catch (e) { /* noop */ }

  let s = rawInner;
  for (let i = 0; i < 5; i++) {
    s = s.replace(/\\"/g, '"');
  }
  try { return JSON.parse(s); } catch (e) { /* noop */ }

  return null;
}

// ── Extract prompt ─────────────────────────────────────────
function extractPrompt(rsc: string, slug: string): ExtractedPrompt {
  const result: ExtractedPrompt = {
    title: '',
    slug,
    chinesePrompt: '',
    englishPrompt: '',
    tags: [],
    model: 'Seedance 2.0',
    coverImage: '',
    sourceUrl: '',
  };

  // Find entry 17 via $L1c marker
  const markerPos = rsc.indexOf('"$L1c"');
  if (markerPos === -1) return result;
  const beforeMarker = rsc.substring(0, markerPos);
  const id17Pos = beforeMarker.lastIndexOf('17:');
  if (id17Pos === -1) return result;

  const next18Pos = rsc.indexOf('18:', id17Pos + 4);
  const entry17 = rsc.substring(
    id17Pos + 4,
    next18Pos !== -1 ? next18Pos : rsc.length
  );

  // Chinese prompt
  const zhEndMarker = ',"type":"zh","label":"中文提示词"';
  const zhEndPos = entry17.indexOf(zhEndMarker);
  if (zhEndPos !== -1) {
    const zhTextStart = entry17.lastIndexOf('"text":"', zhEndPos);
    if (zhTextStart !== -1) {
      result.chinesePrompt = entry17
        .substring(zhTextStart + 8, zhEndPos)
        .replace(/\\n/g, '\n')
        .replace(/\\r/g, '\r')
        .replace(/\\\\/g, '\\')
        .trim();
    }
  }

  // English prompt
  const enEndMarker = ',"type":"en","label":"英文提示词"';
  const enEndPos = entry17.indexOf(enEndMarker);
  if (enEndPos !== -1) {
    const enTextStart = entry17.lastIndexOf('"text":"', enEndPos);
    if (enTextStart !== -1) {
      const enText = entry17.substring(enTextStart + 8, enEndPos);
      if (enText.startsWith('$')) {
        result._enRef = enText;
      } else {
        result.englishPrompt = enText
          .replace(/\\n/g, '\n')
          .replace(/\\r/g, '\r')
          .replace(/\\\\/g, '\\')
          .trim();
      }
    }
  }

  // Resolve English reference from entry 1d
  if ((result as any)._enRef) {
    const id1dPos = rsc.indexOf('1d:');
    if (id1dPos !== -1) {
      const next17Pos = rsc.indexOf('17:', id1dPos + 3);
      const end = next17Pos !== -1 ? next17Pos : rsc.length;
      const entry1d = rsc.substring(id1dPos + 3, end).trim();
      result.englishPrompt = entry1d
        .replace(/^T\d+,/, '')
        .replace(/\\n/g, '\n')
        .replace(/\\r/g, '\r')
        .replace(/\\\\/g, '\\')
        .trim();
    }
  }

  // JSON-LD via tryParseJsonLd
  const jsonLd = tryParseJsonLd(rsc);
  if (jsonLd) {
    result.title = jsonLd.name || '';
    result.coverImage = jsonLd.image || '';
    result.sourceUrl = jsonLd.url || '';
    if (jsonLd.keywords) {
      result.tags = jsonLd.keywords
        .split(/[,，\s]+/)
        .filter(
          (t: string) =>
            t.length > 1 &&
            t.length < 30 &&
            !t.includes('提示词') &&
            !t.includes('prompt') &&
            !t.includes('Image Prompt') &&
            !t.includes('Seedance') &&
            !t.includes('AI图片')
        );
    }
  }

  // Model detection
  if ((result.tags.join(' ') + ' ' + result.chinesePrompt).includes('Nano Banana Pro')) {
    result.model = 'Nano Banana Pro';
  }

  return result;
}

// ── Download cover ─────────────────────────────────────────
async function downloadCover(imageUrl: string, slug: string): Promise<string> {
  if (!imageUrl || !imageUrl.startsWith('http') || imageUrl.includes('/pthumbs/')) {
    return '';
  }
  const ext = imageUrl.match(/\.(jpg|jpeg|png|webp|gif)$/i)?.[0] || '.jpg';
  const filename = `${slug.replace(/[^a-zA-Z0-9-_]/g, '-')}-cover${ext}`;
  const localPath = path.join(UPLOADS_DIR, filename);
  try {
    await downloadFile(imageUrl, localPath);
    return `/uploads/opennana/${filename}`;
  } catch (e) {
    return '';
  }
}

// ── Official OpenNana API (https://api.opennana.com) ────────
// List endpoint: GET /api/prompts?page=1&limit=20&sort=reviewed_at&order=DESC
// Detail endpoint: GET /api/prompts/{slug}

interface ApiPromptItem {
  id: number;
  slug: string;
  title: string;
  media_type: string;
  cover_image: string;
}

interface ApiListResponse {
  status: number;
  msg: string;
  data: {
    items: ApiPromptItem[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      total_pages: number;
      has_more: boolean;
    };
  };
}

interface ApiPromptDetail {
  id: number;
  slug: string;
  title: string;
  description: string;
  source_name: string | null;
  source_url: string | null;
  model: string;
  prompts: { text: string; type: string; label: string }[];
  images: string[];
  tags: string[];
  media_type: string;
  [key: string]: unknown;
}

// Fetch paginated list from official API
async function fetchPromptListPage(page: number): Promise<ApiListResponse | null> {
  const url = `https://api.opennana.com/api/prompts?page=${page}&limit=20&sort=reviewed_at&order=DESC`;
  try {
    const body = await httpGet(url);
    const parsed = JSON.parse(body);
    // Safety check: ensure items is always an array
    if (!Array.isArray(parsed?.data?.items)) {
      console.error(`[Crawler] Page ${page}: items is not an array, type=${typeof parsed?.data?.items}`);
      return { status: 0, msg: '', data: { items: [], pagination: { page, limit: 20, total: 0, total_pages: 0, has_more: false } } } as ApiListResponse;
    }
    return parsed as ApiListResponse;
  } catch (e: any) {
    console.error(`[Crawler] Page ${page} fetch error:`, e.message);
    return null;
  }
}

// Fetch individual prompt detail from official API
async function fetchPromptDetail(slug: string): Promise<ApiPromptDetail | null> {
  try {
    const body = await httpGet(`https://api.opennana.com/api/prompts/${slug}`);
    const res = JSON.parse(body) as { status: number; data: ApiPromptDetail };
    if (res.status === 200 && res.data) return res.data;
    return null;
  } catch {
    return null;
  }
}

// ── Get all slugs via official paginated API ───────────────
async function getAllPromptSlugsFromApi(): Promise<string[]> {
  const allSlugs: string[] = [];
  const seen = new Set<string>();

  // First, fetch page 1 to get total pages
  const first = await fetchPromptListPage(1);
  if (!first) throw new Error('Failed to fetch first page from OpenNana API');

  const pagination = first.data?.pagination;
  if (!pagination) {
    console.error('[Crawler] No pagination in first response');
    throw new Error('Invalid API response: no pagination');
  }

  const { total_pages } = pagination;
  const items: unknown[] = Array.isArray(first.data?.items) ? first.data.items : [];

  for (let i = 0; i < items.length; i++) {
    const item = items[i] as { slug?: string };
    if (item?.slug && !seen.has(item.slug)) {
      seen.add(item.slug);
      allSlugs.push(item.slug);
    }
  }

  // Fetch remaining pages
  for (let page = 2; page <= total_pages; page++) {
    const data = await fetchPromptListPage(page);
    const pageItems: unknown[] = Array.isArray(data?.data?.items) ? data.data.items : [];
    for (let i = 0; i < pageItems.length; i++) {
      const item = pageItems[i] as { slug?: string };
      if (item?.slug && !seen.has(item.slug)) {
        seen.add(item.slug);
        allSlugs.push(item.slug);
      }
    }
    setCrawlStatus({ ...getCrawlStatus(), total: allSlugs.length });
    // Small delay between pages
    await new Promise(r => setTimeout(r, 200));
  }

  return allSlugs;
}

// ── Scrape a single prompt via official API ────────────────
// Returns data compatible with the existing ExtractedPrompt interface
// so that seedPrompt() needs minimal changes.
export async function scrapePromptByApi(slug: string): Promise<ExtractedPrompt | null> {
  const detail = await fetchPromptDetail(slug);
  if (!detail) return null;

  // Extract English prompt (type === 'en')
  const enPrompt = detail.prompts?.find(p => p.type === 'en');
  const zhPrompt = detail.prompts?.find(p => p.type === 'zh');

  if (!enPrompt && !zhPrompt) return null;

  const rawContent = enPrompt?.text || zhPrompt?.text || '';
  if (rawContent.length < 20) return null;

  // Clean JSON if it's a JSON string
  let contentText = rawContent;
  try {
    const parsed = JSON.parse(rawContent);
    contentText = typeof parsed === 'string' ? parsed : JSON.stringify(parsed, null, 2);
  } catch { /* not JSON, use as-is */ }

  // Clean Chinese prompt
  let chinesePromptText = zhPrompt?.text || '';
  try {
    const parsed = JSON.parse(chinesePromptText);
    chinesePromptText = typeof parsed === 'string' ? parsed : JSON.stringify(parsed, null, 2);
  } catch { /* not JSON */ }

  // Build cover image URL
  let coverImage = '';
  const images = detail.images as unknown as string[];
  if (images && images.length > 0) {
    let img = String(images[0] || '');
    if (img.startsWith('pthumbs/')) img = 'https://img.opennana.com/' + img;
    coverImage = img;
  } else {
    const coverImg = (detail as unknown as { cover_image?: string }).cover_image;
    if (coverImg) {
      let cover = coverImg.startsWith('pthumbs/') ? 'https://img.opennana.com/' + coverImg : coverImg;
      coverImage = cover;
    }
  }

  return {
    title: detail.title || slug,
    slug,
    englishPrompt: contentText,
    chinesePrompt: chinesePromptText || '',
    tags: (detail.tags || []).filter((t: string) => t.length > 1 && t.length < 30),
    model: detail.model || '',
    coverImage,
    sourceUrl: detail.source_url || '',
  };
}

// ── Detect total pages from first API page ────────────────
async function detectTotalPages(): Promise<number> {
  const data = await fetchPromptListPage(1);
  return data?.data?.pagination?.total_pages || 166;
}

// ── Sitemap (legacy fallback) ──────────────────────────────
async function getPromptUrls(): Promise<string[]> {
  const body = await httpGet('https://opennana.com/sitemap.xml');
  return (body.match(/<loc>(.*?)<\/loc>/g) || [])
    .map((u) => u.replace(/<\/?loc>/g, ''))
    .filter(
      (u) => u.includes('/awesome-prompt-gallery/') && !u.endsWith('/awesome-prompt-gallery')
    );
}

// ── Get all prompt URLs (via official API, full 3000+) ───
async function getPromptUrlsFull(): Promise<string[]> {
  const addLog = (msg: string) => {
    const status = getCrawlStatus();
    status.logs = [...status.logs.slice(-19), `[${new Date().toISOString()}] ${msg}`];
    setCrawlStatus(status);
  };

  addLog('Fetching all slugs from OpenNana official API...');
  const slugs = await getAllPromptSlugsFromApi();
  addLog(`Found ${slugs.length} prompt slugs`);

  return slugs.map(slug => `https://opennana.com/awesome-prompt-gallery/${slug}`);
}

// ── Scrape single ─────────────────────────────────────────
async function scrapePrompt(url: string): Promise<ExtractedPrompt | null> {
  const slug = url.replace('https://opennana.com/awesome-prompt-gallery/', '');
  try {
    const body = await httpGet(url);
    const rsc = parseRsc(body);
    if (rsc.length < 1000) return null;
    const result = extractPrompt(rsc, slug);

    // Try JSON-LD directly from HTML first
    const htmlLd = extractJsonLdFromHtml(body);
    if (htmlLd) {
      result.title = result.title || htmlLd.name || '';
      result.coverImage = result.coverImage || htmlLd.image || '';
      result.sourceUrl = result.sourceUrl || htmlLd.url || '';
      if (htmlLd.keywords && !result.tags.length) {
        result.tags = htmlLd.keywords
          .split(/[,，\s]+/)
          .filter(
            (t: string) =>
              t.length > 1 &&
              t.length < 30 &&
              !t.includes('提示词') &&
              !t.includes('prompt') &&
              !t.includes('Image Prompt') &&
              !t.includes('Seedance') &&
              !t.includes('AI图片')
          );
      }
    }

    return result;
  } catch (e) {
    return null;
  }
}

const ADMIN_USER_ID = 'cmn8aznxx0000qkdgyf36e0sp';

// ── Seed prompt to DB ──────────────────────────────────────
async function seedPrompt(
  data: ExtractedPrompt | null,
  _logFn: (msg: string) => void
): Promise<'seeded' | 'skip-empty' | 'skip-short' | 'skip-dup' | 'skip-error'> {
  if (!data || !data.title || (!data.chinesePrompt && !data.englishPrompt)) {
    return 'skip-empty';
  }
  const promptText = data.englishPrompt || data.chinesePrompt;
  if (promptText.length < 20) return 'skip-short';

  // Check duplicate by title
  const existing = await prisma.prompt.findFirst({ where: { title: data.title } });
  if (existing) return 'skip-dup';

  let localImagePath = '';
  if (data.coverImage) {
    localImagePath = await downloadCover(data.coverImage, data.slug);
  }

  const tags = [
    'opennana',
    ...data.tags.filter((t) => t.length > 1 && t.length < 20),
  ];

  const prompt = await prisma.prompt.create({
    data: {
      title: data.title,
      content: promptText,
      contentZh: data.chinesePrompt || null,
      category: data.model,
      tags: Array.from(new Set(tags)).slice(0, 10),
      isPublic: true,
      useCount: Math.floor(Math.random() * 300) + 20,
      source: 'opennana',
      authorId: null,
    },
  });

  // Create Image record if cover was downloaded
  if (localImagePath) {
    await prisma.image.create({
      data: {
        url: localImagePath,
        userId: ADMIN_USER_ID,
        promptId: prompt.id,
      },
    });
  }

  return 'seeded';
}

// ── Main crawl loop ───────────────────────────────────────
export async function crawlOpennana(maxTotal?: number): Promise<void> {
  // Ensure uploads dir
  if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
  }


  setCrawlStatus({
    running: true,
    startedAt: new Date(),
    completedAt: undefined,
    total: 0,
    seeded: 0,
    skipped: 0,
    errors: 0,
    current: undefined,
    logs: [],
  });

  const addLog = (msg: string) => {
    const status = getCrawlStatus();
    status.logs = [...status.logs.slice(-19), `[${new Date().toISOString()}] ${msg}`];
    setCrawlStatus(status);
  };

  try {
    // Use paginated gallery fetch (3000+ prompts) instead of sitemap (45 prompts)
    const urls = await getPromptUrlsFull();
    if (maxTotal && maxTotal > 0) {
      urls.splice(maxTotal); // trim to maxTotal
      addLog(`Limiting to first ${maxTotal} URLs`);
    }
    addLog(`Total URLs to crawl: ${urls.length}`);

    setCrawlStatus({ ...getCrawlStatus(), total: urls.length });

    for (let i = 0; i < urls.length; i++) {
      const url = urls[i];
      const slug = url.replace('https://opennana.com/awesome-prompt-gallery/', '');
      setCrawlStatus({ ...getCrawlStatus(), current: slug });

      addLog(`[${i + 1}/${urls.length}] Crawling: ${slug}`);
      const data = await scrapePromptByApi(slug);
      const result = await seedPrompt(data, addLog);

      const status = getCrawlStatus();
      if (result === 'seeded') {
        setCrawlStatus({ ...status, seeded: status.seeded + 1 });
        addLog(`✅ Seeded: ${data!.title} (${data!.model})`);
      } else if (result === 'skip-dup') {
        setCrawlStatus({ ...status, skipped: status.skipped + 1 });
        addLog(`⏭ Duplicate: ${slug}`);
      } else if (result === 'skip-empty' || result === 'skip-short') {
        setCrawlStatus({ ...status, skipped: status.skipped + 1 });
        addLog(`⚠ Skipped [${result}]: ${slug}`);
      } else {
        setCrawlStatus({ ...status, errors: status.errors + 1 });
        addLog(`❌ Error: ${slug}`);
      }

      // Rate limit: pause every 5 items
      if (i % 5 === 4) {
        await new Promise((r) => setTimeout(r, 500));
      } else {
        await new Promise((r) => setTimeout(r, 200));
      }
    }

    const finalStatus = getCrawlStatus();
    setCrawlStatus({
      ...finalStatus,
      running: false,
      completedAt: new Date(),
      current: undefined,
    });
    addLog(`✅ Done! Seeded: ${finalStatus.seeded} | Skipped: ${finalStatus.skipped} | Errors: ${finalStatus.errors}`);
  } catch (err: any) {
    addLog(`❌ Fatal: ${err.message}`);
    setCrawlStatus({
      ...getCrawlStatus(),
      running: false,
      completedAt: new Date(),
    });
  }
}
