import {
  expectArray,
  expectObject,
  expectString,
  expectUniqueIDs,
} from './json.ts';

export const indexVersion = 1;

export interface Language {
  id: string;
  name: string;
  nativeName: string;
  speechLocale: string;
}

export interface ContentItem {
  id: string;
  name: string;
  icon: string;
  file: string;
}

export interface LanguageModule {
  id: string;
  vocabulary: string[];
  conversations: string[];
}

export interface LanguageIndex {
  modules: LanguageModule[];
  vocabulary: ContentItem[];
  conversations: ContentItem[];
}

const contentKinds = {
  vocabulary: { folder: 'vocabulary/', extension: '.md' },
  conversations: { folder: 'conversations/', extension: '.json' },
} as const;

type ContentKind = keyof typeof contentKinds;

function expectVersion(value: unknown, where: string) {
  if (value !== indexVersion)
    throw new Error(`${where}: "version" must be ${indexVersion}`);
}

/**
 * Validates the top-level `index.json` that lists the languages.
 *
 * @throws if the list is invalid
 */
export function validateLanguageList(json: unknown): Language[] {
  const root = expectObject(json, 'index.json', {
    required: ['version', 'languages'],
  });
  expectVersion(root.version, 'index.json');

  const languages = expectArray(root.languages, 'index.json languages').map(
    (value, idx) => {
      const where = `index.json languages[${idx}]`;
      const language = expectObject(value, where, {
        required: ['id', 'name', 'nativeName', 'speechLocale'],
      });
      const id = expectString(language.id, `${where}.id`);
      const speechLocale = expectString(
        language.speechLocale,
        `${where}.speechLocale`,
      );

      if (!/^[a-z]{2,3}$/.test(id))
        throw new Error(`${where}.id: "${id}" must be a language code`);
      if (!new RegExp(`^${id}-[A-Z]{2}$`).test(speechLocale))
        throw new Error(
          `${where}.speechLocale: "${speechLocale}" must look like "${id}-US"`,
        );

      return {
        id,
        name: expectString(language.name, `${where}.name`),
        nativeName: expectString(language.nativeName, `${where}.nativeName`),
        speechLocale,
      };
    },
  );

  expectUniqueIDs(
    languages.map((language) => language.id),
    'index.json languages',
  );
  return languages;
}

function validateContentItems(
  value: unknown,
  kind: ContentKind,
  where: string,
): ContentItem[] {
  if (value === undefined) return [];

  const { folder, extension } = contentKinds[kind];
  const items = expectArray(value, `${where} ${kind}`).map((itemValue, idx) => {
    const itemWhere = `${where} ${kind}[${idx}]`;
    const item = expectObject(itemValue, itemWhere, {
      required: ['id', 'name', 'icon', 'file'],
    });
    const file = expectString(item.file, `${itemWhere}.file`);

    if (!file.startsWith(folder) || !file.endsWith(extension))
      throw new Error(
        `${itemWhere}.file: "${file}" must be a ${extension} file in ${folder}`,
      );

    return {
      id: expectString(item.id, `${itemWhere}.id`),
      name: expectString(item.name, `${itemWhere}.name`),
      icon: expectString(item.icon, `${itemWhere}.icon`),
      file,
    };
  });

  expectUniqueIDs(
    items.map((item) => item.id),
    `${where} ${kind}`,
  );
  return items;
}

function validateReferences(
  value: unknown,
  available: readonly ContentItem[],
  where: string,
): string[] {
  if (value === undefined) return [];

  const ids = expectArray(value, where).map((id, idx) =>
    expectString(id, `${where}[${idx}]`),
  );
  expectUniqueIDs(ids, where);

  for (const id of ids) {
    if (!available.some((item) => item.id === id))
      throw new Error(`${where}: unknown id "${id}"`);
  }
  return ids;
}

/**
 * Validates a language's `index.json`: its modules and the content they use.
 * File existence is checked separately.
 *
 * @throws if the index is invalid
 */
export function validateLanguageIndex(
  json: unknown,
  where: string,
): LanguageIndex {
  const root = expectObject(json, where, {
    required: ['version', 'modules'],
    optional: ['vocabulary', 'conversations'],
  });
  expectVersion(root.version, where);

  const vocabulary = validateContentItems(root.vocabulary, 'vocabulary', where);
  const conversations = validateContentItems(
    root.conversations,
    'conversations',
    where,
  );

  const modules = expectArray(root.modules, `${where} modules`).map(
    (value, idx) => {
      const moduleWhere = `${where} modules[${idx}]`;
      const module = expectObject(value, moduleWhere, {
        required: ['id'],
        optional: ['vocabulary', 'conversations'],
      });
      const result = {
        id: expectString(module.id, `${moduleWhere}.id`),
        vocabulary: validateReferences(
          module.vocabulary,
          vocabulary,
          `${moduleWhere}.vocabulary`,
        ),
        conversations: validateReferences(
          module.conversations,
          conversations,
          `${moduleWhere}.conversations`,
        ),
      };

      if (result.vocabulary.length + result.conversations.length === 0)
        throw new Error(`${moduleWhere}: uses no content`);
      return result;
    },
  );

  expectUniqueIDs(
    modules.map((module) => module.id),
    `${where} modules`,
  );
  return { modules, vocabulary, conversations };
}
