import type { LanguageRules } from '../lib/language-rules.ts';
import {
  type EntryPrefix,
  type ValidatorReturn,
  validateMdEntries,
} from '../lib/markdown.ts';

const titleAcronyms = new Set([
  'AI',
  'CEO',
  'DM',
  'EU',
  'FAQ',
  'FOMO',
  'GPS',
  'QR',
  'SMS',
  'TV',
  'UK',
  'URL',
  'US',
  'USA',
  'WFH',
]);

const wordPrefixes: EntryPrefix[] = [
  { name: 'def', unique: false, required: true },
  { name: 'pho', unique: true, required: true },
  { name: 'eg', unique: false, required: true },
];

const phrasePrefixes: EntryPrefix[] = [
  { name: 'def', unique: false, required: true },
  { name: 'eg', unique: false, required: true },
];

const vocabularyPrefixes: Record<string, EntryPrefix[]> = {
  'vocabulary/adjectives.md': wordPrefixes,
  'vocabulary/adverbs.md': wordPrefixes,
  'vocabulary/nouns.md': wordPrefixes,
  'vocabulary/verbs.md': wordPrefixes,
  'vocabulary/collocations.md': phrasePrefixes,
  'vocabulary/common-idioms.md': phrasePrefixes,
  'vocabulary/phrasal-verbs.md': phrasePrefixes,
  'vocabulary/preposition-combinations.md': [
    ...phrasePrefixes,
    { name: 'cat', unique: true, required: true },
  ],
  'vocabulary/transition-words.md': [
    ...phrasePrefixes,
    { name: 'cat', unique: true, required: true },
    { name: 'pos', unique: true, required: true },
  ],
};

export const englishRules: LanguageRules = {
  markdownValidator(relativePath) {
    if (relativePath === 'vocabulary/connectors.md') return validateConnectors;
    if (relativePath.startsWith('grammar/')) return validateGrammar;

    const prefixes = vocabularyPrefixes[relativePath];
    return prefixes
      ? (content) => validateMdEntries(content, prefixes, { titleAcronyms })
      : undefined;
  },
  unvalidatedFiles: new Set(['vocabulary/commonly-confused-words.md']),
  titleAcronyms,
};

type CategoryId =
  | 'additive'
  | 'contrastive'
  | 'consequential'
  | 'sequential'
  | 'clarification'
  | 'comparison'
  | 'apposition'
  | 'summative';

interface Connector {
  word: string;
  lvl: 'beg' | 'mid' | 'adv';
  subcategory?: string;
  example: string;
  tip?: string;
  syn?: string[];
  position: 'start' | 'middle' | 'end' | 'flexible';
}

interface Category {
  id: CategoryId;
  name: string;
  description: string;
  /** What question does this category answer? */
  question: string;
  subcategories?: string[];
}

/**
 * validate connectors with their unique restricions
 *
 * @param content - markdown content
 * @returns valid connectors
 * @throws if content is invalid
 */
export function validateConnectors(content: string): ValidatorReturn {
  const connectorsConfig: {
    levels: Connector['lvl'][];
    positions: Connector['position'][];
    categories: Category[];
  } = {
    levels: ['beg', 'mid', 'adv'],
    positions: ['start', 'middle', 'end', 'flexible'],
    categories: [
      {
        id: 'additive',
        name: 'Additive',
        description: 'Used to add information or reinforce a point',
        question: 'What else? What more?',
        subcategories: ['equative', 'reinforcing'],
      },
      {
        id: 'contrastive',
        name: 'Contrastive',
        description: 'Used to show contrast, opposition, or unexpected results',
        question: "But what about? What's different? What's surprising?",
        subcategories: ['antithetic', 'concessive', 'replacive'],
      },
      {
        id: 'consequential',
        name: 'Consequential',
        description: 'Used to show cause, effect, reason, or condition',
        question: 'Why? So what? What happened as a result?',
        subcategories: ['causative', 'resultive', 'conditional'],
      },
      {
        id: 'sequential',
        name: 'Sequential',
        description: 'Used to organize ideas in time or logical order',
        question: "When? In what order? What's next?",
        subcategories: ['ordering', 'timing', 'transitional'],
      },
      {
        id: 'clarification',
        name: 'Clarification',
        description: 'Used to explain, emphasize, or strengthen arguments',
        question: 'What do you mean exactly? Is this important?',
        subcategories: ['emphasizing', 'corroborative', 'generalization'],
      },
      {
        id: 'comparison',
        name: 'Comparison',
        description: 'Used to show similarities between ideas',
        question: "How is this similar? What's the same?",
      },
      {
        id: 'apposition',
        name: 'Apposition',
        description: 'Used to give examples or restate in different words',
        question: 'Can you give an example? What do you mean?',
        subcategories: ['exemplification', 'restatement'],
      },
      {
        id: 'summative',
        name: 'Summative',
        description: 'Used to summarize, conclude, or wrap up ideas',
        question: "So what's the bottom line? To wrap up?",
      },
    ],
  };

  const { frontMatter, entries } = validateMdEntries(
    content,
    [
      { name: 'cat', unique: true, required: true },
      { name: 'subcat', unique: true },
      { name: 'lvl', unique: true, required: true },
      { name: 'pos', unique: true, required: true },
      { name: 'tip', unique: true },
      { name: 'eg', unique: false, required: true },
      { name: 'syn', unique: false },
    ],
    { titleAcronyms },
  );

  entries.forEach((entry) => {
    const { cat, subcat, lvl, pos, title } = entry;

    // Validate level
    if (!connectorsConfig.levels.some((level) => level === lvl))
      throw new Error(`Entry "${title}": invalid lvl "${lvl}"`);

    // Validate position
    if (!connectorsConfig.positions.some((position) => position === pos))
      throw new Error(`Entry "${title}": invalid pos "${pos}"`);

    // Validate category
    const category = connectorsConfig.categories.find((c) => c.id === cat);
    if (!category)
      throw new Error(`Entry "${title}": unknown category "${cat}"`);

    // Validate subcategory
    if (subcat) {
      if (!category.subcategories?.includes(subcat as string))
        throw new Error(
          `Entry "${title}": subcat "${subcat}" not valid for category "${cat}"`,
        );
    }
  });

  return { frontMatter, entries };
}

/**
 * Validates grammar/*.md files. Core schema per # entry:
 * form/neg/q/use/eg/tip/rule, plus verb-list lines (e.g. "admit: ...",
 * "remember + gerund: ...") and Wrong:/Correct: mistake examples.
 * Each entry needs at least one rule-like (use/form/rule) and one
 * example-like (eg/Wrong/Correct/verb-list).
 */
export function validateGrammar(content: string): ValidatorReturn {
  const { frontMatter, entries } = validateMdEntries(
    content,
    [
      { name: 'form', unique: false },
      { name: 'form (modal)', unique: false },
      { name: 'form (regular)', unique: false },
      { name: 'neg', unique: false },
      { name: 'q', unique: false },
      { name: 'use', unique: false },
      { name: 'eg', unique: false },
      { name: 'tip', unique: false },
      { name: 'rule', unique: false },
      { name: 'Wrong', unique: false },
      { name: 'Correct', unique: false },
      { name: 'active', unique: false },
      { name: 'passive', unique: false },
    ],
    { allowExtraPrefixes: true, titleAcronyms },
  );

  const verbListSections = new Set([
    'Verbs followed by gerund',
    'Verbs followed by infinitive',
    'Verbs followed by both (different meaning)',
  ]);

  for (const entry of entries) {
    const extraKeys = Object.keys(entry).filter(
      (key) =>
        ![
          'title',
          'form',
          'form (modal)',
          'form (regular)',
          'neg',
          'q',
          'use',
          'eg',
          'tip',
          'rule',
          'Wrong',
          'Correct',
          'active',
          'passive',
        ].includes(key),
    );
    const isVerbListSection = verbListSections.has(entry.title);

    for (const key of extraKeys) {
      if (
        !isVerbListSection ||
        !/^[A-Za-z]+(?:['’][A-Za-z]+)?(?: [A-Za-z]+)*(?: \+ (?:gerund|infinitive))?$/.test(
          key,
        )
      ) {
        throw new Error(
          `Entry "${entry.title}" contains unknown grammar prefix "${key}"`,
        );
      }
    }

    const isMistakeSection =
      entry.title === 'Common mistakes' ||
      entry.title.startsWith('Common mistakes with ');
    const hasRuleLike =
      entry.use !== undefined ||
      entry.form !== undefined ||
      entry['form (modal)'] !== undefined ||
      entry['form (regular)'] !== undefined ||
      entry.rule !== undefined ||
      entry.Wrong !== undefined ||
      entry.Correct !== undefined ||
      isVerbListSection ||
      isMistakeSection;
    const knownExample =
      entry.eg !== undefined ||
      entry.Wrong !== undefined ||
      entry.Correct !== undefined ||
      entry.active !== undefined ||
      entry.passive !== undefined;
    const hasExampleLike = knownExample || extraKeys.length > 0;

    if (!hasRuleLike)
      throw new Error(
        `Entry "${entry.title}": missing rule-like prefix (need use:/form:/rule:)`,
      );
    if (!hasExampleLike)
      throw new Error(
        `Entry "${entry.title}": missing example (need eg:/Wrong:/Correct:/verb-list:)`,
      );

    // Where strict use:/eg: pairing is used, each use needs an example.
    const useCount = Array.isArray(entry.use) ? entry.use.length : 0;
    const egCount = Array.isArray(entry.eg) ? entry.eg.length : 0;
    if (
      useCount > 0 &&
      extraKeys.length === 0 &&
      !entry.Wrong &&
      !entry.Correct
    ) {
      if (egCount < useCount)
        throw new Error(
          `Entry "${entry.title}": has ${useCount} use: but only ${egCount} eg: (each use needs an example)`,
        );
    }
  }

  return { frontMatter, entries };
}
