import type { LanguageRules } from '../lib/language-rules.ts';
import { type EntryPrefix, validateMdEntries } from '../lib/markdown.ts';

const wordPrefixes: EntryPrefix[] = [
  { name: 'def', unique: false, required: true },
  { name: 'pho', unique: true },
  { name: 'eg', unique: false, required: true },
];

const vocabularyPrefixes: Record<string, EntryPrefix[]> = {
  'vocabulary/adjectives.md': wordPrefixes,
};

export const spanishRules: LanguageRules = {
  markdownValidator(relativePath) {
    const prefixes = vocabularyPrefixes[relativePath];
    return prefixes
      ? (content) => validateMdEntries(content, prefixes)
      : undefined;
  },
};
