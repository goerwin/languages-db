# Language Database

A structured, markdown-based language database for building learning apps. Each entry uses simple prefixes for definitions, pronunciation, examples, and more.

## Data format

Entries follow a consistent markdown structure:

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

Example sentences are capitalized, but terminal punctuation is not required.

Some vocabulary collections may overlap while representing different learning
goals or metadata. Avoid merging them unless downstream consumers can preserve
the distinctions.

## Scripts

```sh
npm run build
npm run lint
npm run typecheck
npm run test
```

The validation script checks the vocabulary formats and custom grammar
structures.
