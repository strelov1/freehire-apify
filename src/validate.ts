/**
 * Input validation for the freehire jobs actor.
 *
 * This exists because the upstream search endpoint ignores query parameters it does not
 * recognise. A misspelled filter does not error there — it widens the query to the whole
 * catalogue, so the run looks successful and returns a page of unfiltered jobs. Failing
 * closed here, before any request, is the only place that mistake can be caught.
 */

type FieldSpec =
    | { kind: 'list'; param: string }
    | { kind: 'text'; param: string }
    | { kind: 'number'; param: string | null; min: number; describe: string };

/**
 * Every accepted input field, in one table: how to validate it and which query parameter it
 * becomes upstream. A `param` of null means the field stays local to the actor and is never
 * sent. One table so a new field cannot be half-added — validated but never forwarded.
 */
export const FIELDS = {
    query: { kind: 'text', param: 'q' },
    countries: { kind: 'list', param: 'countries' },
    skills: { kind: 'list', param: 'skills' },
    seniority: { kind: 'list', param: 'seniority' },
    category: { kind: 'list', param: 'category' },
    workMode: { kind: 'list', param: 'work_mode' },
    postedWithinDays: {
        kind: 'number',
        param: 'posted_within_days',
        min: 1,
        describe: 'a positive integer number of days',
    },
    salaryMin: {
        kind: 'number',
        param: 'salary_min',
        min: 0,
        describe: 'a non-negative integer',
    },
    maxItems: { kind: 'number', param: null, min: 1, describe: 'a positive integer' },
} as const satisfies Record<string, FieldSpec>;

export type InputField = keyof typeof FIELDS;

export type ValidatedInput = {
    -readonly [K in InputField]?: (typeof FIELDS)[K]['kind'] extends 'list'
        ? string[]
        : (typeof FIELDS)[K]['kind'] extends 'text'
          ? string
          : number;
};

/**
 * Validates and normalises the run input. Throws on the first problem, naming the offending
 * field, so the message says what to fix rather than that something was wrong.
 */
export function validateInput(input: Record<string, unknown>): ValidatedInput {
    const known = Object.keys(FIELDS);

    for (const key of Object.keys(input)) {
        if (!(key in FIELDS)) {
            throw new Error(
                `Unknown input field "${key}". Accepted fields: ${known.sort().join(', ')}.`,
            );
        }
    }

    const out: Record<string, unknown> = {};

    for (const [field, spec] of Object.entries(FIELDS) as [InputField, FieldSpec][]) {
        const raw = input[field];
        if (raw === undefined || raw === null) continue;

        if (spec.kind === 'list') {
            out[field] = toList(field, raw);
        } else if (spec.kind === 'text') {
            const text = toText(field, raw);
            if (text !== '') out[field] = text;
        } else {
            out[field] = toNumber(field, raw, spec.min, spec.describe);
        }
    }

    return out as ValidatedInput;
}

/** Accepts a bare string where a list is expected, and drops blank entries. */
function toList(field: string, raw: unknown): string[] {
    const values = Array.isArray(raw) ? raw : [raw];
    const out: string[] = [];

    for (const value of values) {
        if (typeof value !== 'string') {
            throw new Error(
                `Field "${field}" accepts strings, received ${typeName(value)} in the list.`,
            );
        }
        const trimmed = value.trim();
        if (trimmed !== '') out.push(trimmed);
    }

    return out;
}

function toText(field: string, raw: unknown): string {
    if (typeof raw !== 'string') {
        throw new Error(`Field "${field}" accepts a string, received ${typeName(raw)}.`);
    }
    return raw.trim();
}

function toNumber(field: string, raw: unknown, min: number, describe: string): number {
    if (typeof raw !== 'number' || !Number.isInteger(raw) || raw < min) {
        throw new Error(
            `Field "${field}" accepts ${describe}, received ${JSON.stringify(raw)}.`,
        );
    }
    return raw;
}

function typeName(value: unknown): string {
    return Array.isArray(value) ? 'an array' : `a ${typeof value}`;
}
