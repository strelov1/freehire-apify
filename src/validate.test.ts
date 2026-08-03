import { describe, expect, test } from 'vitest';

import { validateInput } from './validate.js';

describe('unknown keys', () => {
    test('rejects a misspelled filter and names it', () => {
        expect(() => validateInput({ seniorty: ['senior'] })).toThrowError(/seniorty/);
    });

    test('accepts every documented field', () => {
        expect(() =>
            validateInput({
                query: 'backend',
                countries: ['de'],
                skills: ['go'],
                seniority: ['senior'],
                category: ['backend'],
                workMode: ['remote'],
                postedWithinDays: 7,
                salaryMin: 80000,
                maxItems: 100,
            }),
        ).not.toThrow();
    });
});

describe('type and range checks', () => {
    test('rejects a non-numeric postedWithinDays, naming the field', () => {
        expect(() => validateInput({ postedWithinDays: 'last week' })).toThrowError(
            /postedWithinDays/,
        );
    });

    test('rejects a negative salaryMin, naming the field', () => {
        expect(() => validateInput({ salaryMin: -1 })).toThrowError(/salaryMin/);
    });

    test('rejects a zero or negative postedWithinDays', () => {
        expect(() => validateInput({ postedWithinDays: 0 })).toThrowError(/postedWithinDays/);
    });
});

describe('list coercion', () => {
    test('accepts a bare string where a list is expected', () => {
        expect(validateInput({ countries: 'de' }).countries).toEqual(['de']);
    });

    test('leaves a list untouched', () => {
        expect(validateInput({ skills: ['go', 'rust'] }).skills).toEqual(['go', 'rust']);
    });

    test('drops empty values from a list', () => {
        expect(validateInput({ countries: ['de', '', '  '] }).countries).toEqual(['de']);
    });
});
