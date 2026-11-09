import fs from 'node:fs/promises';
import path from 'node:path';

export const contentDirectory = path.resolve(
  import.meta.dirname,
  '../../content',
);

/** Lists files under `directory` as sorted relative paths, skipping dotfiles. */
export async function listFiles(directory: string): Promise<string[]> {
  const entries = await fs.readdir(directory, {
    recursive: true,
    withFileTypes: true,
  });

  return entries
    .filter((entry) => entry.isFile() && !entry.name.startsWith('.'))
    .map((entry) =>
      path.relative(directory, path.join(entry.parentPath, entry.name)),
    )
    .sort();
}

/** Lists every Markdown file in the content folder, as absolute paths. */
export async function listMarkdownFiles(): Promise<string[]> {
  return (await listFiles(contentDirectory))
    .filter((file) => file.endsWith('.md'))
    .map((file) => path.join(contentDirectory, file));
}
