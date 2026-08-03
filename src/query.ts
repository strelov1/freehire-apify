import { FIELDS, type InputField, type ValidatedInput } from './validate.js';

/** The search endpoint caps a page at 100 however large a limit is requested. */
export const PAGE_SIZE = 100;

/**
 * Ceiling on one run. Ten requests per run keeps a popular listing from becoming load on
 * an endpoint that has no rate limiter, and hitting it is the moment we point people at
 * the API for the full catalogue.
 */
export const HARD_MAX_ITEMS = 1000;

export interface PagePlan {
    total: number;
    pages: { limit: number; offset: number }[];
}

/**
 * Turns validated input into the upstream query string. Field-to-parameter mapping comes
 * from the same table the validator uses, so the two cannot drift.
 */
export function buildSearchParams(input: ValidatedInput): URLSearchParams {
    const params = new URLSearchParams();

    for (const [field, spec] of Object.entries(FIELDS)) {
        if (spec.param === null) continue;

        const value = input[field as InputField];
        if (value === undefined) continue;

        if (Array.isArray(value)) {
            // A list appends one parameter per value. A list that validation emptied appends
            // nothing, which is what we want — `countries=` would filter on an empty string.
            for (const entry of value) params.append(spec.param, entry);
        } else {
            params.set(spec.param, String(value));
        }
    }

    // Relevance is meaningless without a text query, so a bare browse gets freshest-first
    // instead. With a query, leave ordering to the search engine.
    if (!input.query) {
        params.set('sort', 'posted_at');
        params.set('order', 'desc');
    }

    return params;
}

/** Splits the requested item count into pages, clamped to the hard ceiling. */
export function planPages(requested: number | undefined): PagePlan {
    const total = Math.min(requested ?? HARD_MAX_ITEMS, HARD_MAX_ITEMS);
    const pages: PagePlan['pages'] = [];

    for (let offset = 0; offset < total; offset += PAGE_SIZE) {
        pages.push({ limit: Math.min(PAGE_SIZE, total - offset), offset });
    }

    return { total, pages };
}
