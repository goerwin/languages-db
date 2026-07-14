import fs from 'node:fs/promises';
import path from 'node:path';
import { validateExampleCapitalization } from '../src/english/utils.ts';

const assetsDir = path.resolve(import.meta.dirname, '../src/english/assets');
const grammarDir = path.join(assetsDir, 'grammar');

async function fixFile(filePath: string) {
  const content = await fs.readFile(filePath, 'utf-8');
  const lines = content.split('\n');
  let changed = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!line) continue;
    const match = line.match(/^eg: (.+)$/);
    if (match) {
      const example = match[1] as string;

      if (!validateExampleCapitalization(example)) {
        const first = example[0] as string;
        const fixed = first.toUpperCase() + example.slice(1);
        lines[i] = `eg: ${fixed}`;
        changed = true;
        console.log(
          `Fixed: "${example}" -> "${fixed}" in ${path.relative(assetsDir, filePath)}`,
        );
      }
    }
  }

  if (changed) {
    await fs.writeFile(filePath, lines.join('\n'));
  }
}

const files = [
  ...(await fs.readdir(assetsDir))
    .filter((f) => f.endsWith('.md'))
    .map((f) => path.join(assetsDir, f)),
  ...(await fs.readdir(grammarDir))
    .filter((f) => f.endsWith('.md'))
    .map((f) => path.join(grammarDir, f)),
];

for (const file of files) {
  await fixFile(file);
}

console.log('\nDone!');
