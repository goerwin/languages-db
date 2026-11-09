import fs from 'node:fs/promises';
import path from 'node:path';
import { languageRules } from './languages/index.ts';
import { contentDirectory, listMarkdownFiles } from './lib/files.ts';
import { validateTitleCapitalization } from './lib/markdown.ts';

async function fixFile(filePath: string) {
  const relativePath = path.relative(contentDirectory, filePath);
  const language = relativePath.split(path.sep)[0] ?? '';
  const acronyms = languageRules[language]?.titleAcronyms;
  const content = await fs.readFile(filePath, 'utf-8');
  const lines = content.split('\n');
  let changed = false;

  for (let i = 0; i < lines.length; i++) {
    const match = lines[i]?.match(/^# (.+)$/);
    if (match) {
      const title = match[1];

      if (typeof title !== 'string') throw new Error('Invalid title');

      if (!validateTitleCapitalization(title, acronyms)) {
        const fixed = title[0]?.toUpperCase() + title.slice(1).toLowerCase();
        lines[i] = `# ${fixed}`;
        changed = true;
        console.log(`Fixed: "${title}" -> "${fixed}" in ${relativePath}`);
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
