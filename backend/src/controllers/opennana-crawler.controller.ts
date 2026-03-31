import { Request, Response } from 'express';
import { crawlOpennana, scrapePromptByApi } from '../services/opennana-crawler.service';
import { getCrawlStatus } from '../services/crawl-status.service';

// POST /api/v1/admin/crawl/opennana
// Body: { total?: number } — 留空则爬完全部
export const startCrawl = async (req: Request, res: Response) => {
  const status = getCrawlStatus();
  if (status.running) {
    return res.status(409).json({ message: 'Crawler is already running', status: 'running' });
  }

  const rawTotal = req.body?.total;
  const total = typeof rawTotal === 'number' && !isNaN(rawTotal) && rawTotal > 0 ? Math.floor(rawTotal) : undefined;
  console.info('[Crawler] rawTotal:', rawTotal, '→ total:', total);

  // Run crawler in background (don't await)
  crawlOpennana(total).catch((err) => {
    console.error('Crawler error:', err);
  });

  return res.json({ message: 'OpenNana crawler started', status: 'started', total });
};

// GET /api/v1/admin/crawl/opennana/status
export const getStatus = (_req: Request, res: Response) => {
  return res.json(getCrawlStatus());
};

// GET /api/v1/admin/crawl/opennana/test?slug=xxx — debug test
export const testSlug = async (req: Request, res: Response) => {
  const { slug } = req.query;
  if (!slug || typeof slug !== 'string') {
    return res.status(400).json({ message: 'slug query param required' });
  }
  try {
    const result = await scrapePromptByApi(slug);
    return res.json({ slug, result });
  } catch (err: any) {
    return res.status(500).json({ slug, error: err.message });
  }
};
