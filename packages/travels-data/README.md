# @museumwnf/travels-data

Static data export — projects: travels.

## Installation

```bash
npm install @museumwnf/travels-data
```

## Usage

```javascript
import manifest from '@museumwnf/travels-data/manifest.json' assert { type: 'json' }
import items    from '@museumwnf/travels-data/items.json'    assert { type: 'json' }

// Lazy-load translations for a language
const { default: translations } = await import(`@museumwnf/travels-data/translations/items.${lang}.json`)
```

Available top-level JSON files: `manifest.json`, `items.json`, `partners.json`,
`collections.json`, `references.json`, `countries.json`, `glossary.json`,
`languages.json`. An exhibition trail's entries are references
(`references.json`): items another site shows, never copies of their sheets.

Each has a per-language translation file under `translations/{entity}.{lang}.json`.

## Terms of use

This data is Content of the MWNF Website under the
[MWNF legal notice](https://www.museumwnf.org/about/legal-notice), which
governs its use (non-commercial, personal, educational and scientific use is
permitted, with attribution and mandatory reporting — see the notice for the
full terms). The notice text also ships in this package as `LICENSE.md`.
