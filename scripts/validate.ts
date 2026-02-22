import fs from 'node:fs/promises';
import path from 'node:path';
import { validateConnectors, validateMdEntries } from '../src/english/utils.ts';

(
  [
    [
      path.resolve(import.meta.dirname, '../src/english/assets/adjectives.md'),
      validateMdEntries,
      [
        { name: 'pho', unique: true, required: true },
        { name: 'def', unique: false, required: true },
        { name: 'eg', unique: false, required: true },
      ],
    ],
    [
      path.resolve(import.meta.dirname, '../src/english/assets/common-idioms.md'),
      validateMdEntries,
      [
        { name: 'def', unique: false, required: true },
        { name: 'eg', unique: false, required: true },
      ],
    ],
    [
      path.resolve(import.meta.dirname, '../src/english/assets/connectors.md'),
      validateConnectors,
    ],
  ] as const
).forEach(async ([filePath, validator, args]) =>
  validator(await fs.readFile(filePath, 'utf-8'), args)
);
