import { describe, expect, test } from 'vitest';

import { runSummary } from './report.js';

const params = new URLSearchParams({ countries: 'de', skills: 'go' });

describe('runSummary', () => {
    test('invites the user to the API when the ceiling was reached', () => {
        const summary = runSummary({
            collected: 1000,
            matched: 4312,
            ceiling: 1000,
            stoppedEarly: false,
            params,
        });

        expect(summary.message).toContain('1000');
        expect(summary.message).toContain('4312');
        expect(summary.message).toContain('https://freehire.me/api');
        expect(summary.status).toBe('ceiling-reached');
    });

    test('does not mention the API when everything matching was collected', () => {
        const summary = runSummary({
            collected: 42,
            matched: 42,
            ceiling: 1000,
            stoppedEarly: false,
            params,
        });

        expect(summary.status).toBe('complete');
        expect(summary.message).not.toContain('https://freehire.me/api');
    });

    test('does not claim completeness when maxItems cut the run short', () => {
        const summary = runSummary({
            collected: 20,
            matched: 153,
            ceiling: 1000,
            stoppedEarly: false,
            params,
        });

        expect(summary.status).not.toBe('complete');
        expect(summary.message).toContain('20');
        expect(summary.message).toContain('153');
    });

    test('reports an empty result with the parameters that were sent', () => {
        const summary = runSummary({
            collected: 0,
            matched: 0,
            ceiling: 1000,
            stoppedEarly: false,
            params,
        });

        expect(summary.status).toBe('empty');
        expect(summary.message).toContain('countries=de');
        expect(summary.message).toContain('skills=go');
    });

    test('records an upstream failure while still reporting what was kept', () => {
        const summary = runSummary({
            collected: 100,
            matched: 4312,
            ceiling: 1000,
            stoppedEarly: true,
            error: 'upstream 503',
            params,
        });

        expect(summary.status).toBe('partial');
        expect(summary.message).toContain('100');
        expect(summary.message).toContain('upstream 503');
    });
});
