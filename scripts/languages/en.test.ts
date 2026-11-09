import { describe, expect, it } from 'vitest';

import { englishRules, validateConnectors } from './en.ts';

describe('englishRules', () => {
  it('requires pronunciation for single words', () => {
    const validator = englishRules.markdownValidator('vocabulary/nouns.md');

    expect(() =>
      validator?.('# Table\ndef: A piece of furniture\neg: Set the table'),
    ).toThrow(/missing required prefix "pho"/);
  });

  it('allows English acronyms in titles', () => {
    const validator = englishRules.markdownValidator('vocabulary/nouns.md');

    expect(
      validator?.(
        '# AI model\npho: /eɪ aɪ/\ndef: A trained system\neg: The AI model helps',
      ).entries,
    ).toHaveLength(1);
  });

  it('has no validator for unknown files', () => {
    expect(englishRules.markdownValidator('vocabulary/unknown.md')).toBe(
      undefined,
    );
  });
});

describe('validateConnectors', () => {
  it('accepts valid connector markdown', () => {
    const input = `---
title: Connectors
---

# However
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
      title: 'However',
      cat: 'contrastive',
      subcat: 'concessive',
      lvl: 'beg',
      pos: 'start',
      tip: 'Formal tone',
      syn: ['nonetheless'],
    });
  });

  it('throws for invalid level', () => {
    const input = `# Xx
cat: additive
lvl: expert
pos: start
eg: example
`;

    expect(() => validateConnectors(input)).toThrow(/invalid lvl "expert"/);
  });

  it('throws for invalid position', () => {
    const input = `# Xx
cat: additive
lvl: beg
pos: anywhere
eg: example
`;

    expect(() => validateConnectors(input)).toThrow(/invalid pos "anywhere"/);
  });

  it('throws for unknown category', () => {
    const input = `# Xx
cat: invalid
lvl: beg
pos: start
eg: example
`;

    expect(() => validateConnectors(input)).toThrow(
      /unknown category "invalid"/,
    );
  });

  it('throws for subcategory outside category', () => {
    const input = `# Xx
cat: comparison
subcat: concessive
lvl: beg
pos: start
eg: example
`;

    expect(() => validateConnectors(input)).toThrow(
      /subcat "concessive" not valid for category "comparison"/,
    );
  });
});
