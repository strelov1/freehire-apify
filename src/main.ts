import { Actor, log } from 'apify';

import { collectJobs, type PageFetcher } from './collect.js';
import { buildSearchParams, HARD_MAX_ITEMS, planPages } from './query.js';
import { runSummary } from './report.js';
import { validateInput } from './validate.js';

const SEARCH_URL = 'https://freehire.me/api/v1/jobs/search';

await Actor.init();

const raw = (await Actor.getInput<Record<string, unknown>>()) ?? {};

// Validation throws on an unknown or malformed field. Failing the run here, before any
// request, is deliberate: the upstream endpoint ignores parameters it does not recognise,
// so a typo would otherwise return a page of unfiltered catalogue that looks like success.
const input = validateInput(raw);

const params = buildSearchParams(input);
const plan = planPages(input.maxItems);

const fetchPage: PageFetcher = async ({ limit, offset }) => {
    const url = new URL(SEARCH_URL);
    for (const [key, value] of params) url.searchParams.append(key, value);
    url.searchParams.set('limit', String(limit));
    url.searchParams.set('offset', String(offset));

    const response = await fetch(url, { headers: { accept: 'application/json' } });
    if (!response.ok) {
        throw new Error(`freehire API responded ${response.status} ${response.statusText}`);
    }

    const body = (await response.json()) as {
        data?: Record<string, unknown>[];
        meta?: { total?: number };
    };

    return { data: body.data ?? [], total: body.meta?.total ?? 0 };
};

const result = await collectJobs({
    pages: plan.pages,
    fetchPage,
    sleep: (ms) => new Promise((resolve) => setTimeout(resolve, ms)),
});

if (result.items.length > 0) await Actor.pushData(result.items);

const summary = runSummary({
    collected: result.items.length,
    matched: result.matched,
    ceiling: HARD_MAX_ITEMS,
    stoppedEarly: result.stoppedEarly,
    error: result.error,
    params,
});

log.info(summary.message);
await Actor.setValue('SUMMARY', summary);

await Actor.exit();
