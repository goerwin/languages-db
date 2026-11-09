export interface Entry {
  title: string;
  [x: string]: string | string[];
}

export interface EntryPrefix {
  name: string;
  unique?: boolean;
  required?: boolean;
}

export type ValidatorReturn = {
  frontMatter?: string | undefined;
  entries: Entry[];
};

export interface MarkdownOptions {
  allowExtraPrefixes?: boolean;
  titleAcronyms?: ReadonlySet<string>;
}

const openingPunctuation = /^[¿¡"'“‘«(]+/u;

/**
 * Checks for sentence-case titles while preserving the given uppercase acronyms.
 *
 * @param title - the title to check
 * @param acronyms - words allowed to stay uppercase
 * @returns true if the title is properly capitalized
 */
export function validateTitleCapitalization(
  title: string,
  acronyms: ReadonlySet<string> = new Set(),
): boolean {
  if (!title) throw new Error('Invalid first letter');

  const matchesSentenceCase = (value: string) => {
    let firstWord = true;
    const expected = value.replace(/\p{L}+/gu, (word) => {
      if (acronyms.has(word)) {
        firstWord = false;
        return word;
      }

      const lower = word.toLowerCase();
      const normalized = firstWord
        ? lower[0]?.toUpperCase() + lower.slice(1)
        : lower;
      firstWord = false;
      return normalized;
    });

    return value === expected;
  };

  const quotedPhrases = [...title.matchAll(/"([^"]+)"/g)];
  if (quotedPhrases.length > 0) {
    if (quotedPhrases.some(([, phrase]) => phrase !== phrase?.toLowerCase()))
      return false;

    const unquotedText = title.replace(/"[^"]+"/g, '');
    return (
      matchesSentenceCase(unquotedText) ||
      (title.startsWith('"') && unquotedText === unquotedText.toLowerCase())
    );
  }

  return matchesSentenceCase(title);
}

/**
 * Checks if an example sentence starts with a capital letter, skipping opening
 * punctuation like `¿`, `¡`, or quotes.
 *
 * @param example - the example sentence to check
 * @returns true if the example starts with a capital letter
 */
export function validateExampleCapitalization(example: string): boolean {
  const first = example.replace(openingPunctuation, '').at(0);

  if (typeof first !== 'string') throw new Error('Invalid first letter');
  return first === first.toUpperCase();
}

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
  prefixes: readonly EntryPrefix[] = [],
  opts: MarkdownOptions = {},
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

    // Header line (allow single-char titles like "# A")
    const header = line.match(/^# (.+)$/);
    if (header && !header[1]?.trim()) {
      throw new Error(`Empty title header at line ${idx}`);
    }

    if (header) {
      const title = header[1]?.trim();

      if (!title || seenTitles.has(title))
        throw new Error(`Duplicate title header "${title}", at line ${idx}`);

      if (!validateTitleCapitalization(title, opts.titleAcronyms))
        throw new Error(
          `Title "${title}" is not properly capitalized (sentence case), at line ${idx}`,
        );

      seenTitles.add(title);

      // Validate previous title required prefixes
      if (currentEntry)
        prefixes.forEach(({ name, required }) => {
          if (required && !currentEntry?.[name]) {
            throw new Error(
              `Title "${currentEntry?.title}" missing required prefix "${name}" at line ${idx}`,
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
    const match = line.match(
      opts.allowExtraPrefixes ? /^([^:]+): (.+)$/ : /^(\w+): (.+)$/,
    );
    if (!match)
      throw new Error(`Invalid line format: "${line}", at line ${idx}`);

    const [, rawPrefix, value] = match;
    const prefix = rawPrefix?.trim();

    const config = prefixes.find((p) => p.name === prefix);

    if (!config || !prefix || !value) {
      if (opts.allowExtraPrefixes && prefix && value) {
        // Collect unknown prefixes (e.g. verb-list lines like "admit: ...")
        // as non-unique arrays so grammar files with verb lists validate.
        if (!currentEntry[prefix]) currentEntry[prefix] = [];
        (currentEntry[prefix] as string[]).push(value);
        continue;
      }
      throw new Error(
        `Unknown prefix/value "${prefix}"/"${value}" in title "${currentEntry.title}", at line ${idx}`,
      );
    }

    if (config.unique) {
      if (currentEntry[prefix])
        throw new Error(
          `Duplicate unique prefix "${prefix}" in title "${currentEntry.title}", at line ${idx}`,
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
          `Title "${currentEntry?.title}" missing required prefix "${name}"`,
        );
    });
  }

  return { frontMatter, entries };
}

/**
 * @throws if any `eg:` example doesn't start with a capital letter
 */
export function validateExamples(entries: readonly Entry[]) {
  for (const entry of entries) {
    const examples = entry.eg;
    if (!Array.isArray(examples)) continue;

    for (const example of examples) {
      if (!validateExampleCapitalization(example)) {
        throw new Error(
          `Example in "${entry.title}" does not start with a capital letter: "${example}"`,
        );
      }
    }
  }
}
