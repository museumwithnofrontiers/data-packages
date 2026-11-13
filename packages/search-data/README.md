# @museumwnf/search-data

The search payload of the Museum With No Frontiers inventory, schema
`mwnf.search/1` (inventory-app ADR 005): one document per item that a site
shows, with its reference numbers, the sites that show it and its texts in
every language it has. The global search loads a pinned version of it into
its index; the search site reads `sites.json` from it.

## Files

- `manifest.json`: the schema, the counts per type and language, and the
  SHA-256 of every shard.
- `sites.json`: every site, by slug, with its name, kind, parent, origin and
  item route. A site's page is `<origin>/#<path>`. It is the only list of
  slugs the search site accepts and of addresses it links to.
- `documents/<0-f>.ndjson`: one document per line, sorted by id, split by
  the first character of the id.

```javascript
import sites from '@museumwnf/search-data/sites.json' with { type: 'json' }
```

## Terms of use

This data is Content of the MWNF Website under the
[MWNF legal notice](https://www.museumwnf.org/about/legal-notice), which
governs its use (non-commercial, personal, educational and scientific use is
permitted, with attribution and mandatory reporting — see the notice for the
full terms). The notice text also ships in this package as `LICENSE.md`.
