// ── Crawl status ──────────────────────────────────────────
export interface CrawlStatus {
  running: boolean;
  startedAt?: Date;
  completedAt?: Date;
  total: number;
  seeded: number;
  skipped: number;
  errors: number;
  current?: string;
  logs: string[];
}

let status: CrawlStatus = {
  running: false,
  total: 0,
  seeded: 0,
  skipped: 0,
  errors: 0,
  logs: [],
};

export function getCrawlStatus(): CrawlStatus {
  return status;
}

export function setCrawlStatus(s: Partial<CrawlStatus>): void {
  status = { ...status, ...s };
}
