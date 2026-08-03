/** Pause between pages, so one run is a trickle rather than a burst. */
export const PAGE_DELAY_MS = 250;

/** Base for the single retry's backoff. */
const RETRY_DELAY_MS = 1000;

export const FREEHIRE_JOB_URL = 'https://freehire.me/jobs';

/**
 * Attribution on the back-link. Without it, visits arriving from a dataset are
 * indistinguishable from direct traffic, and the actor's whole purpose — bringing people to
 * freehire — cannot be measured.
 */
export const BACKLINK_UTM = 'utm_source=apify&utm_medium=actor';

export type Job = Record<string, unknown>;

export type PageFetcher = (page: { limit: number; offset: number }) => Promise<{
    data: Job[];
    total: number;
}>;

export interface CollectResult {
    items: Job[];
    /** How many jobs matched the filter upstream, for the "collected N of M" line. */
    matched: number;
    /** True when collection ended before the plan was exhausted because of a failure. */
    stoppedEarly: boolean;
    error?: string;
}

/**
 * Adds the one field that is not upstream's: a link back to the posting on freehire.
 * Everything else keeps its original name, so the dataset schema cannot drift from the API.
 */
export function toDatasetItem(job: Job): Job {
    const slug = String(job.public_slug);
    return { ...job, freehire_url: `${FREEHIRE_JOB_URL}/${slug}?${BACKLINK_UTM}` };
}

/**
 * Walks the page plan, pausing between pages and retrying a failed page once.
 *
 * A second failure ends collection with whatever was gathered rather than failing the run:
 * a partial dataset is more useful than a red run, and the summary records why it stopped.
 */
export async function collectJobs(opts: {
    pages: { limit: number; offset: number }[];
    fetchPage: PageFetcher;
    sleep: (ms: number) => Promise<void>;
}): Promise<CollectResult> {
    const { pages, fetchPage, sleep } = opts;
    const items: Job[] = [];
    let matched = 0;

    for (const [index, page] of pages.entries()) {
        if (index > 0) await sleep(PAGE_DELAY_MS);

        let batch: { data: Job[]; total: number };
        try {
            batch = await fetchPage(page);
        } catch (first) {
            await sleep(RETRY_DELAY_MS);
            try {
                batch = await fetchPage(page);
            } catch (second) {
                return {
                    items,
                    matched,
                    stoppedEarly: true,
                    error: second instanceof Error ? second.message : String(second),
                };
            }
        }

        matched = batch.total;
        items.push(...batch.data.map(toDatasetItem));

        // A short page means the catalogue ran out; further offsets would return nothing.
        if (batch.data.length < page.limit) break;
    }

    return { items, matched, stoppedEarly: false };
}
