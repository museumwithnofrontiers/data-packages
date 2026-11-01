# @museumwnf/explore-data

Static data export — projects: explore.

## Installation

```bash
npm install @museumwnf/explore-data
```

## Usage

```javascript
import manifest from '@museumwnf/explore-data/manifest.json' assert { type: 'json' }
import items    from '@museumwnf/explore-data/items.json'    assert { type: 'json' }

// Lazy-load translations for a language
const { default: translations } = await import(`@museumwnf/explore-data/translations/items.${lang}.json`)
```

Available top-level JSON files: `manifest.json`, `items.json`, `partners.json`,
`collections.json`, `countries.json`, `glossary.json`, `languages.json`.
Explore's site records (home banners, featured partnerships, travel information)
are in the Explore root's `extra` in `collections.json`.

Each has a per-language translation file under `translations/{entity}.{lang}.json`.

## Terms of use

This data is Content of the MWNF Website under the
[MWNF legal notice](https://www.museumwnf.org/about/legal-notice), which
governs its use (non-commercial, personal, educational and scientific use is
permitted, with attribution and mandatory reporting — see the notice for the
full terms). The notice text also ships in this package as `LICENSE.md`.
