import type { LanguageRules } from '../lib/language-rules.ts';
import { englishRules } from './en.ts';
import { spanishRules } from './es.ts';

export const languageRules: Record<string, LanguageRules> = {
  en: englishRules,
  es: spanishRules,
};
