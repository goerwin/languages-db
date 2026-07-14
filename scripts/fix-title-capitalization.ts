import fs from 'node:fs/promises';
import path from 'node:path';
import { validateTitleCapitalization } from '../src/english/utils.ts';

const assetsDir = path.resolve(import.meta.dirname, '../src/english/assets');
const grammarDir = path.join(assetsDir, 'grammar');

async function fixFile(filePath: string) {
  const content = await fs.readFile(filePath, 'utf-8');
  const lines = content.split('\n');
  let changed = false;

  for (let i = 0; i < lines.length; i++) {
    const match = lines[i]?.match(/^# (.+)$/);
    if (match) {
      const title = match[1];

      if (typeof title !== 'string') throw new Error('Invalid title');

      if (!validateTitleCapitalization(title)) {
        const fixed = title[0]?.toUpperCase() + title.slice(1).toLowerCase();
        lines[i] = `# ${fixed}`;
        changed = true;
        console.log(
          `Fixed: "${title}" -> "${fixed}" in ${path.relative(assetsDir, filePath)}`,
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
