import { describe, expect, it } from 'vitest';

import {
  validateExampleCapitalization,
  validateExamples,
  validateMdEntries,
  validateTitleCapitalization,
} from './markdown.ts';

describe('validateTitleCapitalization', () => {
  it('returns true for properly capitalized titles', () => {
    expect(validateTitleCapitalization('Abandon')).toBe(true);
    expect(validateTitleCapitalization('Bite the bullet')).toBe(true);
    expect(validateTitleCapitalization('Back up')).toBe(true);
    expect(validateTitleCapitalization('Accept / except')).toBe(true);
    expect(validateTitleCapitalization('Present simple')).toBe(true);
  });

  it('returns false for lowercase titles', () => {
    expect(validateTitleCapitalization('abandon')).toBe(false);
    expect(validateTitleCapitalization('bite the bullet')).toBe(false);
  });

  it('returns false for title case titles', () => {
    expect(validateTitleCapitalization('Bite The Bullet')).toBe(false);
    expect(validateTitleCapitalization('Back Up')).toBe(false);
  });

  it('returns false for all uppercase titles', () => {
    expect(validateTitleCapitalization('ABANDON')).toBe(false);
    expect(validateTitleCapitalization('BITE THE BULLET')).toBe(false);
  });

  it('keeps the given acronyms uppercase', () => {
    expect(validateTitleCapitalization('AI tools')).toBe(false);
    expect(validateTitleCapitalization('AI tools', new Set(['AI']))).toBe(true);
  });

  it('handles accented letters', () => {
    expect(validateTitleCapitalization('Cálido')).toBe(true);
    expect(validateTitleCapitalization('Ñandú')).toBe(true);
    expect(validateTitleCapitalization('CÁLIDO')).toBe(false);
  });

  it('throws for empty string', () => {
    expect(() => validateTitleCapitalization('')).toThrow(
      /Invalid first letter/,
    );
  });
});

describe('validateMdEntries', () => {
  it('parses front matter and prefixed fields', () => {
    const input = `---
title: Demo
---

# First
lvl: beg
eg: one
eg: two
`;

    const result = validateMdEntries(input, [
      { name: 'lvl', unique: true, required: true },
      { name: 'eg', unique: false, required: true },
    ]);

    expect(result.frontMatter).toContain('title: Demo');
    expect(result.entries).toEqual([
      { title: 'First', lvl: 'beg', eg: ['one', 'two'] },
    ]);
  });

  it('throws for duplicate headers', () => {
    const input = `
# Same
lvl: beg

# Same
lvl: mid
`;

    expect(() =>
      validateMdEntries(input, [{ name: 'lvl', unique: true }]),
    ).toThrow(/Duplicate title header "Same"/);
  });

  it('throws if content appears before first header', () => {
    const input = `
lvl: beg
# First
lvl: mid
`;

    expect(() =>
      validateMdEntries(input, [{ name: 'lvl', unique: true }]),
    ).toThrow(/Line before any header/);
  });

  it('throws when required prefix is missing', () => {
    const input = `
# First
eg: example
`;

    expect(() =>
      validateMdEntries(input, [
        { name: 'lvl', unique: true, required: true },
        { name: 'eg', unique: false, required: true },
      ]),
    ).toThrow(/missing required prefix "lvl"/);
  });

  it('throws when a unique prefix is duplicated in one entry', () => {
    const input = `
# First
lvl: beg
lvl: mid
`;

    expect(() =>
      validateMdEntries(input, [{ name: 'lvl', unique: true, required: true }]),
    ).toThrow(/Duplicate unique prefix "lvl"/);
  });

  it('throws for unknown prefixes', () => {
    const input = `
# First
lvl: beg
bad: value
`;

    expect(() =>
      validateMdEntries(input, [{ name: 'lvl', unique: true, required: true }]),
    ).toThrow(/Unknown prefix\/value "bad"/);
  });

  it('throws for non-capitalized titles', () => {
    const input = `
# first
lvl: beg
`;

    expect(() =>
      validateMdEntries(input, [{ name: 'lvl', unique: true, required: true }]),
    ).toThrow(/Title "first" is not properly capitalized/);
  });

  it('throws for title case titles', () => {
    const input = `
# First Thing
lvl: beg
`;

    expect(() =>
      validateMdEntries(input, [{ name: 'lvl', unique: true, required: true }]),
    ).toThrow(/Title "First Thing" is not properly capitalized/);
  });
});

describe('validateExampleCapitalization', () => {
  it('returns true for examples starting with a capital letter', () => {
    expect(
      validateExampleCapitalization('The house was abandoned after the storm'),
    ).toBe(true);
    expect(
      validateExampleCapitalization('She goes to the gym every morning'),
    ).toBe(true);
    expect(
      validateExampleCapitalization(
        'Wrong: She asked where did I live. Correct: She asked where I lived.',
      ),
    ).toBe(true);
  });

  it('returns false for examples starting with a lowercase letter', () => {
    expect(
      validateExampleCapitalization('say: She said (that) she was leaving.'),
    ).toBe(false);
    expect(validateExampleCapitalization('the house was abandoned')).toBe(
      false,
    );
  });

  it('skips opening punctuation', () => {
    expect(validateExampleCapitalization('¿Dónde está la estación?')).toBe(
      true,
    );
    expect(validateExampleCapitalization('¡Qué sorpresa!')).toBe(true);
    expect(validateExampleCapitalization('¿dónde está la estación?')).toBe(
      false,
    );
    expect(validateExampleCapitalization('"hello," she said')).toBe(false);
  });

  it('throws for empty string', () => {
    expect(() => validateExampleCapitalization('')).toThrow(
      /Invalid first letter/,
    );
  });
});

describe('validateExamples', () => {
  it('throws for a lowercase example', () => {
    expect(() =>
      validateExamples([{ title: 'Calm', eg: ['Stay calm', 'keep going'] }]),
    ).toThrow(/Example in "Calm" does not start with a capital letter/);
  });

  it('accepts entries without examples', () => {
    expect(() => validateExamples([{ title: 'Calm' }])).not.toThrow();
  });
});
