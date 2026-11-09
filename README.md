# Language Database

A structured language database for building learning apps. Each language has its
own content and an index that says which app modules use it.

It's published with GitHub Pages at `https://goerwin.github.io/languages-db/`.
Every push to `main` validates, builds, and publishes it.

## Layout

```text
content/
  index.json            # list of languages
  en/
    index.json          # modules and content for English
    vocabulary/         # adjectives.md, nouns.md, common-idioms.md, ...
    grammar/
    conversations/      # food-meals.json, eating-out.json, ...
  es/
    index.json
    vocabulary/
scripts/                # build, validation, and their tests
docs/                   # notes and ideas
```

`content/` is published as is, so `content/en/vocabulary/adjectives.md` becomes
`https://goerwin.github.io/languages-db/en/vocabulary/adjectives.md`. Language
folders use short language codes (`en`, `es`).

## Indexes

`content/index.json` lists the languages in display order. `speechLocale` is the
default voice region.

```json
{
  "version": 1,
  "languages": [
    { "id": "en", "name": "English", "nativeName": "English", "speechLocale": "en-US" }
  ]
}
```

Each language's `index.json` lists its content once. Modules point to that
content by ID, so several modules can share the same files. Array order is
display order, and `icon` is an SF Symbol name.

```json
{
  "version": 1,
  "modules": [
    { "id": "wordDefinition", "vocabulary": ["adjective"] },
    { "id": "everydayChats", "conversations": ["food-meals"] }
  ],
  "vocabulary": [
    { "id": "adjective", "name": "Adjectives", "icon": "text.book.closed", "file": "vocabulary/adjectives.md" }
  ],
  "conversations": [
    { "id": "food-meals", "name": "Food & Meals", "icon": "fork.knife", "file": "conversations/food-meals.json" }
  ]
}
```

Bump `version` only for changes older apps can't read.

## Markdown format

Vocabulary and grammar entries follow a consistent markdown structure:

```md
# Word

pho: /wɜːrd/
def: A clear and concise definition of the word.
eg: An example sentence using the word in context.
```

Prefixes vary by category. Common ones:

| Prefix | Purpose | Example |
|--------|---------|---------|
| `def` | Definition | `def: A clear and concise definition.` |
| `eg` | Example sentence | `eg: The word used in a sentence` |
| `pho` | Phonetic pronunciation | `pho: /wɜːrd/` |
| `cat` | Category or type | `cat: additive` |
| `lvl` | Difficulty level | `lvl: beg` |
| `pos` | Position in a sentence | `pos: start` |
| `tip` | Usage tip | `tip: Usually followed by a noun.` |

Titles use sentence case. Example sentences start with a capital letter, after
any opening punctuation like `¿` or `¡`. Ending punctuation is not required.

Content is written in its own language: Spanish definitions and examples are in
Spanish. `pho` is optional for Spanish.

Some vocabulary collections may overlap while representing different learning
goals or metadata. Avoid merging them unless downstream consumers can preserve
the distinctions.

## Conversations format

Each conversation file is one topic, holding its scenes. The topic's name and
icon live in the language index.

```json
{
  "scenes": [
    {
      "id": "lunch-break",
      "title": "Lunch break",
      "summary": "A coworker invites you to lunch.",
      "partner": { "name": "Maya", "role": "Coworker", "avatar": "👩🏽‍💼" },
      "turns": [
        {
          "id": "invite",
          "message": "Want to grab lunch?",
          "hint": "Say yes",
          "reply": "Sure, I'd love to.",
          "wrongReplies": ["I am lunch.", "Lunch is a noun."],
          "note": "\"I'd love to\" is a warm way to accept."
        }
      ],
      "closing": "See you at noon!"
    }
  ]
}
```

`image` (`{ "url", "alt" }`) is optional on a turn. Scene IDs are unique within
a language.

## Adding a language

1. Add it to `content/index.json`.
2. Create `content/<id>/index.json` and its content files.
3. Add its rules in `scripts/languages/<id>.ts` and register them in
   `scripts/languages/index.ts`.

## Scripts

```sh
npm run build
npm run lint
npm run typecheck
npm run test
```

`npm run test` validates every index, Markdown file, and conversation file, then
runs the unit tests. The build fails if an index points to a missing file or
content ID, or if a file has no validator.
