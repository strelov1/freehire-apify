import { describe, expect, test } from 'vitest';

import { buildSearchParams, planPages, HARD_MAX_ITEMS, PAGE_SIZE } from './query.js';

describe('buildSearchParams', () => {
    test('maps input fields to their upstream parameter names', () => {
        const params = buildSearchParams({ workMode: ['remote'], postedWithinDays: 7 });

        expect(params.get('work_mode')).toBe('remote');
        expect(params.get('posted_within_days')).toBe('7');
    });

    test('repeats a parameter for each value in a list', () => {
        const params = buildSearchParams({ countries: ['de', 'pl'] });

        expect(params.getAll('countries')).toEqual(['de', 'pl']);
    });

    test('sends the text query as q', () => {
        expect(buildSearchParams({ query: 'senior backend' }).get('q')).toBe('senior backend');
    });

    test('never sends maxItems upstream', () => {
        expect(buildSearchParams({ maxItems: 500 }).has('maxItems')).toBe(false);
    });

    test('omits a list that ended up empty', () => {
        expect(buildSearchParams({ countries: [] }).has('countries')).toBe(false);
    });

    test('orders an unfiltered browse by freshest first', () => {
        const params = buildSearchParams({});

        expect(params.get('sort')).toBe('posted_at');
        expect(params.get('order')).toBe('desc');
    });

    test('keeps relevance order when a text query is present', () => {
        expect(buildSearchParams({ query: 'go' }).has('sort')).toBe(false);
    });
});

describe('planPages', () => {
    test('clamps the requested count to the hard ceiling', () => {
        const plan = planPages(50000);

        expect(plan.total).toBe(HARD_MAX_ITEMS);
        expect(plan.pages).toHaveLength(HARD_MAX_ITEMS / PAGE_SIZE);
    });

    test('defaults to the ceiling when no count is given', () => {
        expect(planPages(undefined).total).toBe(HARD_MAX_ITEMS);
    });

    test('asks for a full page when the request is smaller than one page', () => {
        const plan = planPages(30);

        expect(plan.total).toBe(30);
        expect(plan.pages).toEqual([{ limit: 30, offset: 0 }]);
    });

    test('splits a request across pages with increasing offsets', () => {
        const plan = planPages(250);

        expect(plan.pages).toEqual([
            { limit: 100, offset: 0 },
            { limit: 100, offset: 100 },
            { limit: 50, offset: 200 },
        ]);
    });
});
