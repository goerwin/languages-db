import { describe, expect, it } from 'vitest';

import {
  validateConnectors,
  validateEntries,
  validateMdEntries,
} from './utils.ts';

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
      validateMdEntries(input, [{ name: 'lvl', unique: true }])
    ).toThrow(/Duplicate title header "Same"/);
  });

  it('throws if content appears before first header', () => {
    const input = `
lvl: beg
# First
lvl: mid
`;

    expect(() =>
      validateMdEntries(input, [{ name: 'lvl', unique: true }])
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
      ])
    ).toThrow(/missing required prefix "lvl"/);
  });

  it('throws when a unique prefix is duplicated in one entry', () => {
    const input = `
# First
lvl: beg
lvl: mid
`;

    expect(() =>
      validateMdEntries(input, [{ name: 'lvl', unique: true, required: true }])
    ).toThrow(/Duplicate unique prefix "lvl"/);
  });

  it('throws for unknown prefixes', () => {
    const input = `
# First
lvl: beg
bad: value
`;

    expect(() =>
      validateMdEntries(input, [{ name: 'lvl', unique: true, required: true }])
    ).toThrow(/Unknown prefix\/value "bad"/);
  });
});

describe('validateEntries', () => {
  it('accepts valid entries', () => {
    const result = validateEntries(
      [
        { title: 'One', lvl: 'beg', eg: ['x'] },
        { title: 'Two', lvl: 'mid', eg: ['y', 'z'] },
      ],
      [
        { name: 'lvl', unique: true, required: true },
        { name: 'eg', unique: false, required: true },
      ]
    );

    expect(result).toBe(true);
  });

  it('throws for duplicate titles', () => {
    expect(() =>
      validateEntries(
        [
          { title: 'One', lvl: 'beg', eg: ['x'] },
          { title: 'One', lvl: 'mid', eg: ['y'] },
        ],
        [
          { name: 'lvl', unique: true, required: true },
          { name: 'eg', unique: false, required: true },
        ]
      )
    ).toThrow(/Duplicate title "One"/);
  });

  it('throws when unique field is an array', () => {
    expect(() =>
      validateEntries(
        [{ title: 'One', lvl: ['beg'], eg: ['x'] }],
        [
          { name: 'lvl', unique: true, required: true },
          { name: 'eg', unique: false, required: true },
        ]
      )
    ).toThrow(/prefix "lvl" should be unique but is an array/);
  });

  it('throws when non-unique field is not an array', () => {
    expect(() =>
      validateEntries(
        [{ title: 'One', lvl: 'beg', eg: 'x' }],
        [
          { name: 'lvl', unique: true, required: true },
          { name: 'eg', unique: false, required: true },
        ]
      )
    ).toThrow(/prefix "eg" should be an array/);
  });

  it('throws for unknown entry keys', () => {
    expect(() =>
      validateEntries(
        [{ title: 'One', lvl: 'beg', eg: ['x'], nope: 'bad' }],
        [
          { name: 'lvl', unique: true, required: true },
          { name: 'eg', unique: false, required: true },
        ]
      )
    ).toThrow(/contains unknown prefix "nope"/);
  });
});

describe('validateConnectors', () => {
  it('accepts valid connector markdown', () => {
    const input = `---
title: Connectors
---

# however
cat: contrastive
subcat: concessive
lvl: beg
pos: start
eg: However, this works.
syn: nonetheless
tip: Formal tone
`;

    const result = validateConnectors(input);

    expect(result.frontMatter).toContain('title: Connectors');
    expect(result.entries[0]).toMatchObject({
      title: 'however',
      cat: 'contrastive',
      subcat: 'concessive',
      lvl: 'beg',
      pos: 'start',
      tip: 'Formal tone',
      syn: ['nonetheless'],
    });
  });

  it('throws for invalid level', () => {
    const input = `# xx
cat: additive
lvl: expert
pos: start
eg: example
`;

    expect(() => validateConnectors(input)).toThrow(/invalid lvl "expert"/);
  });

  it('throws for invalid position', () => {
    const input = `# xx
cat: additive
lvl: beg
pos: anywhere
eg: example
`;

    expect(() => validateConnectors(input)).toThrow(/invalid pos "anywhere"/);
  });

  it('throws for unknown category', () => {
    const input = `# xx
cat: invalid
lvl: beg
pos: start
eg: example
`;

    expect(() => validateConnectors(input)).toThrow(
      /unknown category "invalid"/
    );
  });

  it('throws for subcategory outside category', () => {
    const input = `# xx
cat: comparison
subcat: concessive
lvl: beg
pos: start
eg: example
`;

    expect(() => validateConnectors(input)).toThrow(
      /subcat "concessive" not valid for category "comparison"/
    );
  });
});
