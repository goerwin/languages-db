interface Entry {
  title: string;
  [x: string]: string | string[];
}

interface EntryPrefix {
  name: string;
  unique?: boolean;
  required?: boolean;
}

type ValidatorReturn = { frontMatter?: string | undefined; entries: Entry[] };

/**
 * Validates and parses markdown content and converts it to an array of entries.
 *
 * It ensures that:
 * - There's at most one frontMatter section, delimited by ---[frontMatter]---
 * - Resulting `Entry[]` array are unique by "title" property
 * - Prefixes options where `unique` is false or unset will be array of options
 * - Prefixes options where `unique` is true, will guarantee at most 1 of them exist
 * - Prefixes options where `required` is true, will ensure the entry contains that property
 *
 * @param mdContent - the markdown content
 * @param prefixes - prefixes allowed for each entry
 * @returns an array of entries
 * @throws if the content is invalid
 */
export function validateMdEntries(
  mdContent: string,
  prefixes: readonly EntryPrefix[] = []
): ValidatorReturn {
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

      if (!title || seenTitles.has(title))
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

    if (!config || !prefix || !value)
      throw new Error(
        `Unknown prefix/value "${prefix}"/"${value}" in title "${currentEntry.title}", at line ${idx}`
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
export function validateEntries(
  entries: Entry[],
  prefixes: EntryPrefix[]
): true {
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

  const { frontMatter, entries } = validateMdEntries(content, [
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
      if (
        !category.subcategories ||
        !category.subcategories.includes(subcat as string)
      )
        throw new Error(
          `Entry "${title}": subcat "${subcat}" not valid for category "${cat}"`
        );
    }
  });

  return { frontMatter, entries };
}
