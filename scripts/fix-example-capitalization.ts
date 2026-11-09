import fs from 'node:fs/promises';
import path from 'node:path';
import { contentDirectory, listMarkdownFiles } from './lib/files.ts';
import { validateExampleCapitalization } from './lib/markdown.ts';

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
        const fixed = example.replace(/\p{Ll}/u, (letter) =>
          letter.toUpperCase(),
        );
        lines[i] = `eg: ${fixed}`;
        changed = true;
        console.log(
          `Fixed: "${example}" -> "${fixed}" in ${path.relative(contentDirectory, filePath)}`,
        );
      }
    }
  }

  if (changed) {
    await fs.writeFile(filePath, lines.join('\n'));
  }
}

for (const file of await listMarkdownFiles()) {
  await fixFile(file);
}

console.log('\nDone!');
