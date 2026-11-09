import { describe, expect, it } from 'vitest';

import { validateLanguageIndex, validateLanguageList } from './indexes.ts';

const english = {
  id: 'en',
  name: 'English',
  nativeName: 'English',
  speechLocale: 'en-US',
};

const adjectives = {
  id: 'adjective',
  name: 'Adjectives',
  icon: 'text.book.closed',
  file: 'vocabulary/adjectives.md',
};

const foodMeals = {
  id: 'food-meals',
  name: 'Food & Meals',
  icon: 'fork.knife',
  file: 'conversations/food-meals.json',
};

describe('validateLanguageList', () => {
  it('returns the languages in order', () => {
    const spanish = {
      id: 'es',
      name: 'Spanish',
      nativeName: 'Español',
      speechLocale: 'es-MX',
    };

    expect(
      validateLanguageList({ version: 1, languages: [english, spanish] }),
    ).toEqual([english, spanish]);
  });

  it('throws for an unknown version', () => {
    expect(() =>
      validateLanguageList({ version: 2, languages: [english] }),
    ).toThrow(/"version" must be 1/);
  });

  it('throws for duplicate languages', () => {
    expect(() =>
      validateLanguageList({ version: 1, languages: [english, english] }),
    ).toThrow(/duplicate id "en"/);
  });

  it('throws when the speech locale is for another language', () => {
    expect(() =>
      validateLanguageList({
        version: 1,
        languages: [{ ...english, speechLocale: 'es-MX' }],
      }),
    ).toThrow(/must look like "en-US"/);
  });

  it('throws for unknown keys', () => {
    expect(() =>
      validateLanguageList({
        version: 1,
        languages: [{ ...english, flag: '🇺🇸' }],
      }),
    ).toThrow(/unknown key "flag"/);
  });
});

describe('validateLanguageIndex', () => {
  it('returns modules and their content', () => {
    const index = validateLanguageIndex(
      {
        version: 1,
        modules: [
          { id: 'wordDefinition', vocabulary: ['adjective'] },
          { id: 'everydayChats', conversations: ['food-meals'] },
        ],
        vocabulary: [adjectives],
        conversations: [foodMeals],
      },
      'en/index.json',
    );

    expect(index).toEqual({
      modules: [
        { id: 'wordDefinition', vocabulary: ['adjective'], conversations: [] },
        {
          id: 'everydayChats',
          vocabulary: [],
          conversations: ['food-meals'],
        },
      ],
      vocabulary: [adjectives],
      conversations: [foodMeals],
    });
  });

  it('throws when a module uses content that is not listed', () => {
    expect(() =>
      validateLanguageIndex(
        {
          version: 1,
          modules: [{ id: 'wordDefinition', vocabulary: ['noun'] }],
          vocabulary: [adjectives],
        },
        'en/index.json',
      ),
    ).toThrow(/vocabulary: unknown id "noun"/);
  });

  it('throws when a module uses no content', () => {
    expect(() =>
      validateLanguageIndex(
        { version: 1, modules: [{ id: 'wordDefinition' }] },
        'en/index.json',
      ),
    ).toThrow(/uses no content/);
  });

  it('throws for duplicate modules', () => {
    const module = { id: 'wordDefinition', vocabulary: ['adjective'] };

    expect(() =>
      validateLanguageIndex(
        { version: 1, modules: [module, module], vocabulary: [adjectives] },
        'en/index.json',
      ),
    ).toThrow(/duplicate id "wordDefinition"/);
  });

  it('throws when a file is in the wrong folder', () => {
    expect(() =>
      validateLanguageIndex(
        {
          version: 1,
          modules: [{ id: 'wordDefinition', vocabulary: ['adjective'] }],
          vocabulary: [{ ...adjectives, file: 'adjectives.md' }],
        },
        'en/index.json',
      ),
    ).toThrow(/must be a \.md file in vocabulary\//);
  });
});
