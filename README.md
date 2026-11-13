# MWNF data packages

The data of the Museum With No Frontiers websites, one folder per npm package
under [`packages/`](packages). Every site installs its package from npmjs as
`@museumwnf/<name>`; this repository is where each published version comes from.

## Licence

Everything in this repository is Content of the MWNF Website under the
[MWNF legal notice](https://www.museumwnf.org/about/legal-notice), which
governs its use: non-commercial, personal, educational and scientific use is
permitted, with attribution and mandatory reporting. See the notice for the
full terms. Its text is in [`LICENSE.md`](LICENSE.md), and every package
carries it as its own `LICENSE.md`.

It is not open-source software, and no open-source licence applies to any
part of it.

## Where the data comes from

The packages are exported from the MWNF inventory by the exporters in
[inventory-app](https://github.com/museumwithnofrontiers/inventory-app/tree/main/scripts/exporters).
An export writes its package folder here and opens a pull request. Nothing in
`packages/` is edited by hand.

The JSON is committed with two-space indentation, and the exporters write keys
and records in a stable order, so a pull request shows exactly what changed in
the data.

## How a version is published

1. An export opens a pull request that changes a package folder and raises the
   `version` in its `package.json`.
2. CI checks every changed package:
   - each JSON file parses and is in the committed layout;
   - `manifest.json` carries no `generatedAt`;
   - the version is new on npmjs;
   - the folder holds only what npm publishes.
3. Merging to `main` runs the release workflow. It publishes every package
   whose version npmjs does not hold yet, through npm trusted publishing. No
   npm token is stored anywhere. Running it again publishes nothing new.

Each package is published in the layout the sites have always installed:
compact JSON, and a `manifest.json` whose `generatedAt` is the time of the last
commit that changed the package.

## Scripts

All of them need Node 24 and run from the repository root.

| Script | What it does |
|---|---|
| `node scripts/check.mjs [<base-ref>]` | What CI runs. With a base ref, it checks the packages changed since it, versions included. Without one, it checks every package's layout. |
| `node scripts/publish.mjs [--dry-run]` | What the release workflow runs. |
| `node scripts/publish.mjs --first <folder> [--dry-run]` | Publishes a new package's first version by hand (see below). It refuses a package npmjs already has. |
| `node scripts/seed.mjs <name>...` | Creates a package folder from the latest version npmjs holds. It is used once per package, when the package moves here. |

## A new package

Trusted publishing cannot create a package on npmjs, so a new package's first
version is published by hand, by someone logged in to npm:

1. On a branch, the exporter stages the package's folder (`--publish`), and
   the folder is committed.
2. From that branch, its first version is published:
   `node scripts/publish.mjs --first <folder>`. It is published the way the
   workflow publishes, without provenance, which only a workflow can sign.
3. Its trusted publisher is set on npmjs, naming this repository and
   `release.yml`:

   ```bash
   npm trust github @museumwnf/<folder> --repository museumwithnofrontiers/data-packages --file release.yml --allow-publish
   ```

4. The branch goes through a pull request as usual. CI accepts a new folder
   whose version is the one npmjs holds, and the release run skips it.

Every version after the first is published by the release workflow.

A package that was published before this repository existed is seeded from
npmjs instead, with `scripts/seed.mjs`, once its trusted publisher is set.

## The search payload

`search-data` is the global search's payload (inventory-app M15, ADR 005), not
a site's. Besides `manifest.json` and `sites.json` it holds
`documents/<0-f>.ndjson`, one item per line; no other package may hold files
outside the usual layout. On top of the usual checks, CI runs
`scripts/search-data.mjs`, a copy of inventory-app's
`scripts/exporters/search/schema/validate.mjs` (change both together):

- every document matches `mwnf.search/1`, ids are unique and sorted, and every
  site a document names is in `sites.json`;
- every shard's SHA-256 and count match the manifest;
- a pull request may not drop more than 5% of the documents of the base
  branch's version unless it carries the label `search-shrink-ok`, so a broken
  export cannot empty the search.

Its versions are loaded by inventory-app's `deploy-search-ovh.yml` once the
pin in `scripts/search` is bumped (propagate does it after a publish).
