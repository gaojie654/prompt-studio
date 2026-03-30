import { Request, Response } from 'express';
import { crawlOpennana } from '../services/opennana-crawler.service';
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
