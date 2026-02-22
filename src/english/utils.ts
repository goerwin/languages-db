import fs from 'node:fs/promises';

const adjectivesMd = await fs.readFile('../english-adjectives.md', 'utf-8');
const adjectives = parseMdDictionary(adjectivesMd, [
  { name: 'pho', unique: true, required: true },
  { name: 'def', unique: true, required: true },
  { name: 'eg', unique: false, required: true },
]);

const commonIdiomsMd = await fs.readFile(
  '../english-common-idioms.md',
  'utf-8'
);
const commonIdioms = parseMdDictionary(commonIdiomsMd, [
  { name: 'def', unique: true, required: true },
  { name: 'eg', unique: false, required: true },
]);

const connectorsMd = await fs.readFile('../english-connectors.md', 'utf-8');
const connectors = validateConnectors(connectorsMd);

interface Entry {
  title: string;
  [x: string]: string | string[];
}

interface EntryPrefix {
  name: string;
  unique?: boolean;
  required?: boolean;
}

/**
 * Parses markdown content and converts it to an array of entries
 *
 * @param mdContent - the markdown content
 * @param prefixes - prefixes allowed for each entry
 * @returns an array of entries
 */
function parseMdDictionary(
  mdContent: string,
  prefixes: EntryPrefix[] = []
): { frontMatter?: string; entries: Entry[] } {
  const frontMatterMatch = mdContent.match(/^---\s*([\s\S]*?)\s*---/);
  const frontMatterEndIndex = frontMatterMatch?.[0].length ?? 0;
  const frontMatter = frontMatterMatch?.[1];

  const content = mdContent.slice(frontMatterEndIndex).trimStart();
  const lines = content.split('\n');
  const entries: Entry[] = [];
  const seenTitles = new Set<string>();
  let currentEntry: Entry | null = null;

  for (const [idx, rawLine] of lines.entries()) {
    const line = rawLine.trim();
    if (!line) continue;

    // Header line
    const header = line.match(/^# (.+\S)$/);

    if (header) {
      const title = header[1];

      if (seenTitles.has(title))
        throw new Error(`Duplicate title header "${title}", at line ${idx}`);

      seenTitles.add(title);

      // Validate previous title required prefixes
      if (currentEntry)
        prefixes.forEach(({ name, required }) => {
          if (required && !currentEntry?.[name]) {
            throw new Error(
              `Title "${currentEntry?.title}" missing required prefix "${name}" at line ${idx}`
            );
          }
        });

      currentEntry = { title };
      entries.push(currentEntry);
      continue;
    }

    if (!currentEntry)
      throw new Error(`Line before any header: "${line}", at line ${idx}`);

    // Prefixed content line
    const match = line.match(/^(\w+): (.+)$/);
    if (!match)
      throw new Error(`Invalid line format: "${line}", at line ${idx}`);

    const [, prefix, value] = match;
    const config = prefixes.find((p) => p.name === prefix);

    if (!config)
      throw new Error(
        `Unknown prefix "${prefix}" in title "${currentEntry.title}", at line ${idx}`
      );

    if (config.unique) {
      if (currentEntry[prefix])
        throw new Error(
          `Duplicate unique prefix "${prefix}" in title "${currentEntry.title}", at line ${idx}`
        );

      currentEntry[prefix] = value;
    } else {
      if (!currentEntry[prefix]) currentEntry[prefix] = [];
      (currentEntry[prefix] as string[]).push(value);
    }
  }

  // Validate last title required prefixes
  if (currentEntry) {
    prefixes.forEach(({ name, required }) => {
      if (required && !currentEntry?.[name])
        throw new Error(
          `Title "${currentEntry?.title}" missing required prefix "${name}"`
        );
    });
  }

  return { frontMatter, entries };
}

/**
 * validates an array of entries with uniqueness of title and prefix validations
 *
 * @param entries
 * @param prefixes
 * @returns true if the entries array is valid
 * @throws if the entries array is invalid
 */
function validateEntries(entries: Entry[], prefixes: EntryPrefix[]): true {
  const seenTitles = new Set<string>();

  entries.forEach((entry, idx) => {
    if (!entry.title) throw new Error(`Entry at idx ${idx} is missing a title`);

    if (seenTitles.has(entry.title))
      throw new Error(`Duplicate title "${entry.title}" at idx ${idx}`);

    seenTitles.add(entry.title);

    prefixes.forEach(({ name, unique, required }) => {
      const value = entry[name];

      // Required check
      if (
        required &&
        (value === undefined ||
          value === null ||
          (Array.isArray(value) && value.length === 0))
      )
        throw new Error(
          `Entry "${entry.title}" missing required prefix "${name}" at idx ${idx}`
        );

      // Unique check
      if (unique && Array.isArray(value))
        throw new Error(
          `Entry "${entry.title}" prefix "${name}" should be unique but is an array at idx ${idx}`
        );

      // Non-unique must be an array
      if (!unique && value !== undefined && !Array.isArray(value))
        throw new Error(
          `Entry "${entry.title}" prefix "${name}" should be an array at idx ${idx}`
        );
    });

    // Optional: check for unknown prefixes
    Object.keys(entry).forEach((key) => {
      if (key === 'title') return;
      if (!prefixes.some((p) => p.name === key)) {
        throw new Error(
          `Entry "${entry.title}" contains unknown prefix "${key}"`
        );
      }
    });
  });

  return true;
}

export type Level = 'beg' | 'mid' | 'adv';
export type CategoryId =
  | 'additive'
  | 'contrastive'
  | 'consequential'
  | 'sequential'
  | 'clarification'
  | 'comparison'
  | 'apposition'
  | 'summative';

export interface Connector {
  word: string;
  lvl: Level;
  subcategory?: string;
  example: string;
  tip?: string;
  syn?: string[];
  position: 'start' | 'middle' | 'end' | 'flexible';
}

export interface Category {
  id: CategoryId;
  name: string;
  description: string;
  /** What question does this category answer? */
  question: string;
  subcategories?: string[];
  connectors: Connector[];
}

/**
 * validate connectors with their unique restricions
 *
 * @param content - markdown content
 * @returns valid connectors
 * @throws if content is invalid
 */
function validateConnectors(content: string): Entry[] {
  const connectorsConfig = {
    levels: ['beg', 'mid', 'adv'],
    positions: ['start', 'middle', 'end', 'flexible'],
    categories: [
      { id: 'additive', subcategories: ['equative', 'reinforcing'] },
      {
        id: 'contrastive',
        subcategories: ['antithetic', 'concessive', 'replacive'],
      },
      {
        id: 'consequential',
        subcategories: ['causative', 'resultive', 'conditional'],
      },
      {
        id: 'sequential',
        subcategories: ['ordering', 'timing', 'transitional'],
      },
      {
        id: 'clarification',
        subcategories: ['emphasizing', 'corroborative', 'generalization'],
      },
      { id: 'comparison' },
      { id: 'apposition', subcategories: ['exemplification', 'restatement'] },
      { id: 'summative' },
    ],
  };

  const { entries } = parseMdDictionary(content, [
    { name: 'cat', unique: true, required: true },
    { name: 'subcat', unique: true },
    { name: 'lvl', unique: true, required: true },
    { name: 'pos', unique: true, required: true },
    { name: 'tip', unique: true },
    { name: 'eg', unique: false, required: true },
    { name: 'syn', unique: false },
  ]);

  entries.forEach((entry) => {
    const { cat, subcat, lvl, pos, title } = entry;

    // Validate level
    if (!connectorsConfig.levels.includes(lvl as string))
      throw new Error(`Entry "${title}": invalid lvl "${lvl}"`);

    // Validate position
    if (!connectorsConfig.positions.includes(pos as string))
      throw new Error(`Entry "${title}": invalid pos "${pos}"`);

    // Validate category
    const category = connectorsConfig.categories.find((c) => c.id === cat);
    if (!category)
      throw new Error(`Entry "${title}": unknown category "${cat}"`);

    // Validate subcategory
    if (subcat) {
      if (
        !category.subcategories ||
        !category.subcategories.includes(subcat as string)
      )
        throw new Error(
          `Entry "${title}": subcat "${subcat}" not valid for category "${cat}"`
        );
    }
  });

  return entries;
}
