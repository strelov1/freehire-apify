import { describe, expect, test } from 'vitest';

import { collectJobs, toDatasetItem, type PageFetcher } from './collect.js';

const job = (slug: string) => ({
    public_slug: slug,
    title: 'Backend Engineer',
    company: 'Acme',
    url: 'https://boards.example.com/acme/1',
    countries: ['de'],
    skills: ['go'],
    posted_at: '2026-08-01T00:00:00Z',
    source: 'greenhouse',
});

/** A fetcher serving a fixed catalogue, recording the pages it was asked for. */
function servePages(total: number, calls: { limit: number; offset: number }[] = []): PageFetcher {
    return async ({ limit, offset }) => {
        calls.push({ limit, offset });
        const slice = Array.from({ length: Math.max(0, Math.min(limit, total - offset)) }, (_, i) =>
            job(`job-${offset + i}`),
        );
        return { data: slice, total };
    };
}

describe('toDatasetItem', () => {
    test('keeps upstream field names and adds a link back to freehire', () => {
        const item = toDatasetItem(job('acme-backend-engineer-ab12'));

        expect(item.public_slug).toBe('acme-backend-engineer-ab12');
        expect(item.title).toBe('Backend Engineer');
        expect(item.source).toBe('greenhouse');
        expect(item.freehire_url).toBe(
            'https://freehire.me/jobs/acme-backend-engineer-ab12?utm_source=apify&utm_medium=actor',
        );
    });
});

describe('collectJobs', () => {
    test('stops once the planned total is collected', async () => {
        const calls: { limit: number; offset: number }[] = [];
        const result = await collectJobs({
            pages: [
                { limit: 100, offset: 0 },
                { limit: 100, offset: 100 },
            ],
            fetchPage: servePages(5000, calls),
            sleep: async () => {},
        });

        expect(result.items).toHaveLength(200);
        expect(calls).toHaveLength(2);
        expect(result.matched).toBe(5000);
        expect(result.stoppedEarly).toBe(false);
    });

    test('stops early when the catalogue runs out', async () => {
        const calls: { limit: number; offset: number }[] = [];
        const result = await collectJobs({
            pages: [
                { limit: 100, offset: 0 },
                { limit: 100, offset: 100 },
                { limit: 100, offset: 200 },
            ],
            fetchPage: servePages(150, calls),
            sleep: async () => {},
        });

        expect(result.items).toHaveLength(150);
        expect(calls).toHaveLength(2);
    });

    test('pauses between pages', async () => {
        let pauses = 0;
        await collectJobs({
            pages: [
                { limit: 100, offset: 0 },
                { limit: 100, offset: 100 },
            ],
            fetchPage: servePages(5000),
            sleep: async () => {
                pauses += 1;
            },
        });

        expect(pauses).toBe(1);
    });

    test('retries a failing page once and continues', async () => {
        let attempts = 0;
        const result = await collectJobs({
            pages: [{ limit: 100, offset: 0 }],
            fetchPage: async (page) => {
                attempts += 1;
                if (attempts === 1) throw new Error('upstream 503');
                return servePages(5000)(page);
            },
            sleep: async () => {},
        });

        expect(attempts).toBe(2);
        expect(result.items).toHaveLength(100);
        expect(result.stoppedEarly).toBe(false);
    });

    test('keeps what it collected when a page fails twice', async () => {
        let attempts = 0;
        const result = await collectJobs({
            pages: [
                { limit: 100, offset: 0 },
                { limit: 100, offset: 100 },
            ],
            fetchPage: async (page) => {
                attempts += 1;
                if (page.offset === 100) throw new Error('upstream 503');
                return servePages(5000)(page);
            },
            sleep: async () => {},
        });

        expect(result.items).toHaveLength(100);
        expect(result.stoppedEarly).toBe(true);
        expect(result.error).toMatch(/upstream 503/);
    });

    test('reports an empty result without failing', async () => {
        const result = await collectJobs({
            pages: [{ limit: 100, offset: 0 }],
            fetchPage: servePages(0),
            sleep: async () => {},
        });

        expect(result.items).toEqual([]);
        expect(result.matched).toBe(0);
        expect(result.stoppedEarly).toBe(false);
    });
});
