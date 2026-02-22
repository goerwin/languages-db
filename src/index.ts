import fs from 'node:fs/promises';
import path from 'node:path';
import { validateConnectors, validateMdEntries } from './english/utils.ts';

(
  [
    [
      path.resolve(import.meta.dirname, './english/adjectives.md'),
      validateMdEntries,
      [
        { name: 'pho', unique: true, required: true },
        { name: 'def', unique: true, required: true },
        { name: 'eg', unique: false, required: true },
      ],
    ],
    [
      path.resolve(import.meta.dirname, './english/common-idioms.md'),
      validateMdEntries,
      [
        { name: 'def', unique: true, required: true },
        { name: 'eg', unique: false, required: true },
      ],
    ],
    [
      path.resolve(import.meta.dirname, './english/connectors.md'),
      validateConnectors,
    ],
  ] as const
).forEach(async ([filePath, validator, args]) =>
  validator(await fs.readFile(filePath, 'utf-8'), args)
);
