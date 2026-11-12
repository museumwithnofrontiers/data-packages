# @museumwnf/publications-data

Static data export — projects: publications.

## Installation

```bash
npm install @museumwnf/publications-data
```

## Usage

```javascript
import manifest from '@museumwnf/publications-data/manifest.json' assert { type: 'json' }
import publications from '@museumwnf/publications-data/publications.json' assert { type: 'json' }

// Lazy-load translations for a language
const { default: translations } = await import(`@museumwnf/publications-data/translations/publications.${lang}.json`)
```

Available top-level JSON files: `manifest.json`, `publications.json`,
`editions.json`, `tags.json`, `references.json`, `trails.json`,
`countries.json`, `languages.json`. The publications' and the countries'
texts are under `translations/{entity}.{lang}.json`. A reference is an item
another site shows, never a copy of its sheet.

## Terms of use

This data is Content of the MWNF Website under the
[MWNF legal notice](https://www.museumwnf.org/about/legal-notice), which
governs its use (non-commercial, personal, educational and scientific use is
permitted, with attribution and mandatory reporting — see the notice for the
full terms). The notice text also ships in this package as `LICENSE.md`.
