export const FREEHIRE_API_URL = 'https://freehire.me/api';

export type RunStatus = 'complete' | 'ceiling-reached' | 'capped-by-input' | 'partial' | 'empty';

export interface RunSummary {
    status: RunStatus;
    message: string;
    collected: number;
    matched: number;
}

/**
 * Builds the one line a user reads when the run ends.
 *
 * Hitting the ceiling is not a failure and must not read like one — it is the moment to
 * point at the API, which is the whole reason this actor exists. An empty result echoes the
 * parameters that were actually sent, so a filter that matched nothing can be told apart
 * from a filter that was not applied.
 */
export function runSummary(input: {
    collected: number;
    matched: number;
    ceiling: number;
    stoppedEarly: boolean;
    error?: string;
    params: URLSearchParams;
}): RunSummary {
    const { collected, matched, ceiling, stoppedEarly, error, params } = input;
    const base = { collected, matched };

    if (stoppedEarly) {
        return {
            ...base,
            status: 'partial',
            message:
                `Collected ${collected} jobs before the freehire API stopped responding ` +
                `(${error ?? 'unknown error'}). The items gathered so far are in the dataset.`,
        };
    }

    if (collected === 0) {
        return {
            ...base,
            status: 'empty',
            message:
                'No jobs matched. These are the filters that were sent: ' +
                `${describeParams(params)}. Try widening them.`,
        };
    }

    if (matched > collected) {
        // Two different reasons to stop short, and they call for different advice: our
        // ceiling is ours to explain and points at the API; a smaller maxItems was the
        // user's own choice and only needs stating.
        return collected >= ceiling
            ? {
                  ...base,
                  status: 'ceiling-reached',
                  message:
                      `Collected ${collected} of ${matched} matching jobs — this actor ` +
                      `returns at most ${ceiling} per run. The full catalogue is available ` +
                      `via the freehire API: ${FREEHIRE_API_URL}`,
              }
            : {
                  ...base,
                  status: 'capped-by-input',
                  message:
                      `Collected ${collected} of ${matched} matching jobs, as requested by ` +
                      `maxItems. Raise it to collect more, up to ${ceiling} per run.`,
              };
    }

    return {
        ...base,
        status: 'complete',
        message: `Collected ${collected} jobs, everything that matched.`,
    };
}

function describeParams(params: URLSearchParams): string {
    const parts = [...params.entries()]
        .filter(([key]) => key !== 'sort' && key !== 'order')
        .map(([key, value]) => `${key}=${value}`);

    return parts.length > 0 ? parts.join(', ') : '(no filters)';
}
