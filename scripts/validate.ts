import fs from 'node:fs/promises';
import path from 'node:path';
import {
  validateConnectors,
  validateExampleCapitalization,
  validateMdEntries,
} from '../src/english/utils.ts';

function getPath(itemPath: string) {
  return path.resolve(import.meta.dirname, '../src/', itemPath);
}

function validateExamples(
  entries: { title: string; [x: string]: string | string[] }[],
) {
  for (const entry of entries) {
    const examples = entry.eg;
    if (Array.isArray(examples)) {
      for (const example of examples) {
        if (!validateExampleCapitalization(example)) {
          throw new Error(
            `Example in "${entry.title}" does not start with a capital letter: "${example}"`,
          );
        }
      }
    }
  }
}

(
  [
    [
      getPath('english/assets/adjectives.md'),
      validateMdEntries,
      [
        { name: 'def', unique: false, required: true },
        { name: 'pho', unique: true, required: true },
        { name: 'eg', unique: false, required: true },
      ],
    ],
    [
      getPath('english/assets/adverbs.md'),
      validateMdEntries,
      [
        { name: 'def', unique: false, required: true },
        { name: 'pho', unique: true, required: true },
        { name: 'eg', unique: false, required: true },
      ],
    ],
    [
      getPath('english/assets/collocations.md'),
      validateMdEntries,
      [
        { name: 'def', unique: false, required: true },
        { name: 'eg', unique: false, required: true },
      ],
    ],
    [
      getPath('english/assets/common-idioms.md'),
      validateMdEntries,
      [
        { name: 'def', unique: false, required: true },
        { name: 'eg', unique: false, required: true },
      ],
    ],
    // TODO: This requires a better handling
    // [
    //   getPath('english/assets/commonly-confused-words.md'),
    //   validateMdEntries,
    //   [
    //     { name: 'def', unique: false, required: true },
    //     { name: 'pho', unique: true, required: true },
    //     { name: 'eg', unique: false, required: true },
    //   ],
    // ],
    [getPath('english/assets/connectors.md'), validateConnectors],
    [
      getPath('english/assets/nouns.md'),
      validateMdEntries,
      [
        { name: 'def', unique: false, required: true },
        { name: 'pho', unique: true, required: true },
        { name: 'eg', unique: false, required: true },
      ],
    ],

    [
      getPath('english/assets/phrasal-verbs.md'),
      validateMdEntries,
      [
        { name: 'def', unique: false, required: true },
        { name: 'eg', unique: false, required: true },
      ],
    ],
    [
      getPath('english/assets/preposition-combinations.md'),
      validateMdEntries,
      [
        { name: 'def', unique: false, required: true },
        { name: 'cat', unique: true, required: true },
        { name: 'eg', unique: false, required: true },
      ],
    ],
    [
      getPath('english/assets/transition-words.md'),
      validateMdEntries,
      [
        { name: 'def', unique: false, required: true },
        { name: 'cat', unique: true, required: true },
        { name: 'eg', unique: false, required: true },
        { name: 'pos', unique: true, required: true },
      ],
    ],
    [
      getPath('english/assets/verbs.md'),
      validateMdEntries,
      [
        { name: 'def', unique: false, required: true },
        { name: 'pho', unique: true, required: true },
        { name: 'eg', unique: false, required: true },
      ],
    ],
  ] as const
).forEach(async ([filePath, validator, args]) => {
  const { entries } = validator(await fs.readFile(filePath, 'utf-8'), args);
  validateExamples(entries);
});
