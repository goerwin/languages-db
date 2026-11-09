import type { ValidatorReturn } from './markdown.ts';

export type MarkdownValidator = (content: string) => ValidatorReturn;

export interface LanguageRules {
  /** Validator for a Markdown file, by its path inside the language folder. */
  markdownValidator(relativePath: string): MarkdownValidator | undefined;
  /** Known Markdown files whose format the validator can't parse yet. */
  unvalidatedFiles?: ReadonlySet<string>;
  /** Words allowed to stay uppercase in sentence-case titles. */
  titleAcronyms?: ReadonlySet<string>;
}
