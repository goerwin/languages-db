import fs from 'node:fs/promises';
import path from 'node:path';
import { languageRules } from './languages/index.ts';
import { validateConversationFile } from './lib/conversations.ts';
import { contentDirectory, listFiles } from './lib/files.ts';
import { validateLanguageIndex, validateLanguageList } from './lib/indexes.ts';
import { expectUniqueIDs } from './lib/json.ts';
import { validateExamples } from './lib/markdown.ts';

async function readText(relativePath: string) {
  return fs.readFile(path.join(contentDirectory, relativePath), 'utf-8');
}

async function readJSON(relativePath: string): Promise<unknown> {
  return JSON.parse(await readText(relativePath));
}

async function withContext<T>(where: string, run: () => Promise<T>) {
  try {
    return await run();
  } catch (error) {
    throw new Error(`${where}: ${(error as Error).message}`, { cause: error });
  }
}

async function validateLanguage(id: string) {
  const rules = languageRules[id];
  if (!rules)
    throw new Error(`Language "${id}" has no rules in scripts/languages`);

  const files = await listFiles(path.join(contentDirectory, id));
  const index = validateLanguageIndex(
    await readJSON(`${id}/index.json`),
    `${id}/index.json`,
  );

  for (const item of [...index.vocabulary, ...index.conversations]) {
    if (!files.includes(item.file))
      throw new Error(`${id}/index.json: "${item.file}" doesn't exist`);
  }

  const sceneIDs: string[] = [];

  for (const file of files) {
    if (file === 'index.json') continue;
    const where = `${id}/${file}`;

    if (file.endsWith('.md')) {
      if (rules.unvalidatedFiles?.has(file)) continue;

      const validator = rules.markdownValidator(file);
      if (!validator)
        throw new Error(`${where}: no validator in scripts/languages/${id}.ts`);

      await withContext(where, async () => {
        validateExamples(validator(await readText(where)).entries);
      });
    } else if (file.startsWith('conversations/') && file.endsWith('.json')) {
      sceneIDs.push(...validateConversationFile(await readJSON(where), where));
    } else {
      throw new Error(`${where}: unexpected file`);
    }
  }

  expectUniqueIDs(sceneIDs, `${id} conversation scenes`);
  return files.length;
}

const languages = validateLanguageList(await readJSON('index.json'));
const folders = (await fs.readdir(contentDirectory, { withFileTypes: true }))
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name);

for (const folder of folders) {
  if (!languages.some((language) => language.id === folder))
    throw new Error(`content/${folder} isn't listed in content/index.json`);
}

for (const language of languages) {
  if (!folders.includes(language.id))
    throw new Error(`content/${language.id} doesn't exist`);

  const fileCount = await validateLanguage(language.id);
  console.log(`✓ ${language.id}: ${fileCount} files`);
}
