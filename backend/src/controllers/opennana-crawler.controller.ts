import { Request, Response } from 'express';
import { crawlOpennana } from '../services/opennana-crawler.service';
import { getCrawlStatus } from '../services/crawl-status.service';

// POST /api/v1/admin/crawl/opennana
export const startCrawl = async (_req: Request, res: Response) => {
  const status = getCrawlStatus();
  if (status.running) {
    return res.status(409).json({ message: 'Crawler is already running', status: 'running' });
  }

  // Run crawler in background (don't await)
  crawlOpennana().catch((err) => {
    console.error('Crawler error:', err);
  });

  return res.json({ message: 'OpenNana crawler started', status: 'started' });
};

// GET /api/v1/admin/crawl/opennana/status
export const getStatus = (_req: Request, res: Response) => {
  return res.json(getCrawlStatus());
};
