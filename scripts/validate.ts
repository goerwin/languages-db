import fs from 'node:fs/promises';
import path from 'node:path';
import { validateConnectors, validateMdEntries } from '../src/english/utils.ts';

function getPath(itemPath: string) {
  return path.resolve(import.meta.dirname, '../src/', itemPath);
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
).forEach(async ([filePath, validator, args]) =>
  validator(await fs.readFile(filePath, 'utf-8'), args)
);
