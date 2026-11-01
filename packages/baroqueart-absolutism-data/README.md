# @museumwnf/baroqueart-absolutism-data

Static data export — projects: BAR.

## Installation

```bash
npm install @museumwnf/baroqueart-absolutism-data
```

## Usage

```javascript
import manifest from '@museumwnf/baroqueart-absolutism-data/manifest.json' assert { type: 'json' }
import items    from '@museumwnf/baroqueart-absolutism-data/items.json'    assert { type: 'json' }

// Lazy-load translations for a language
const { default: translations } = await import(`@museumwnf/baroqueart-absolutism-data/translations/items.${lang}.json`)
```

Available top-level JSON files: `manifest.json`, `items.json`, `partners.json`,
`collections.json`, `countries.json`, `glossary.json`, `languages.json`,
`timelines.json`, `timeline_events.json`. (No `dynasties.json` — dynasties are
a Discover Islamic Art concept and are absent from this dataset.)

Each has a per-language translation file under `translations/{entity}.{lang}.json`.

`items.json` contains objects and monuments only. Monument details (the
legacy "Special Features") are embedded as `details[]` on their parent
monument; a detail's texts live in `translations/items.{lang}.json` keyed by
the detail's `id`, alongside the item texts.

## Terms of use

This data is Content of the MWNF Website under the
[MWNF legal notice](https://www.museumwnf.org/about/legal-notice), which
governs its use (non-commercial, personal, educational and scientific use is
permitted, with attribution and mandatory reporting — see the notice for the
full terms). The notice text also ships in this package as `LICENSE.md`.
