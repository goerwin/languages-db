import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { validateConnectors, validateMdEntries } from './english/utils.ts';

const dirname = path.dirname(fileURLToPath(import.meta.url));

(
  [
    [
      path.resolve(dirname, './english/adjectives.md'),
      validateMdEntries,
      [
        { name: 'pho', unique: true, required: true },
        { name: 'def', unique: true, required: true },
        { name: 'eg', unique: false, required: true },
      ],
    ],
    [
      path.resolve(dirname, './english/common-idioms.md'),
      validateMdEntries,
      [
        { name: 'def', unique: true, required: true },
        { name: 'eg', unique: false, required: true },
      ],
    ],
    [path.resolve(dirname, './english/connectors.md'), validateConnectors],
  ] as const
).forEach(async ([filePath, validator, args]) =>
  validator(await fs.readFile(filePath, 'utf-8'), args)
);
