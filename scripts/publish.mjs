// Publishes every package whose version the registry does not hold yet. The
// release workflow runs it on every push to main; running it again publishes
// nothing new.
//
// Each package is published from a copy, in the layout the exporters wrote
// before this repository existed: compact JSON, and a manifest whose
// generatedAt is the time of the last commit that changed the package.
//
//   node scripts/publish.mjs [--dry-run]
//
// A package npmjs has never seen cannot be published by the workflow: trusted
// publishing cannot create a package. Its first version is published by hand,
// by someone logged in to npm, from a branch where the folder is committed:
//
//   node scripts/publish.mjs --first <folder> [--dry-run]
import { cpSync, existsSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { PACKAGES_DIR, ROOT, compact, filesUnder, packageFolders, publishedVersions, readJson, run } from './lib.mjs'

const dryRun = process.argv.includes('--dry-run')
const firstIndex = process.argv.indexOf('--first')
const first = firstIndex >= 0 ? process.argv[firstIndex + 1] : null
if (firstIndex >= 0 && (!first || !existsSync(join(PACKAGES_DIR, first, 'package.json')))) {
  console.error(`--first needs the folder of a package under packages/, got ${JSON.stringify(first ?? '')}`)
  process.exit(2)
}
let failures = 0

function committedAt(folder) {
  const result = run('git', ['log', '-1', '--format=%cI', '--', `packages/${folder}`], { cwd: ROOT })
  const time = result.stdout.trim()
  if (result.status !== 0 || !time) throw new Error(`no commit found for packages/${folder}`)
  return new Date(time).toISOString()
}

function prepare(folder) {
  const dir = mkdtempSync(join(tmpdir(), `${folder}-`))
  cpSync(join(PACKAGES_DIR, folder), dir, { recursive: true })
  for (const file of filesUnder(dir)) {
    if (!file.endsWith('.json') || file === 'package.json') continue
    const path = join(dir, file)
    let value = readJson(path)
    if (file === 'manifest.json') value = { generatedAt: committedAt(folder), ...value }
    writeFileSync(path, compact(value), 'utf-8')
  }
  return dir
}

for (const folder of first ? [first] : packageFolders()) {
  const { name, version } = readJson(join(PACKAGES_DIR, folder, 'package.json'))
  const published = publishedVersions(name)
  if (first && published !== null) {
    console.log(`::error::${name} is already on npmjs; only the release workflow publishes its versions`)
    failures++
    continue
  }
  if (published?.includes(version)) {
    console.log(`skip ${name}@${version}: already published`)
    continue
  }
  if (published === null && !first) {
    console.log(`::error::${name} has never been published; its first version is published by hand (--first)`)
    failures++
    continue
  }
  const dir = prepare(folder)
  try {
    // Provenance needs the workflow's identity, which a hand publish lacks.
    const args = ['publish', '--access', 'public', ...(first ? [] : ['--provenance'])]
    if (dryRun) args.push('--dry-run')
    console.log(`publish ${name}@${version}${dryRun ? ' (dry run)' : ''}`)
    const result = run('npm', args, { cwd: dir, stdio: 'inherit' })
    if (result.status !== 0) {
      console.log(`::error::npm publish failed for ${name}@${version}`)
      failures++
    }
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
}

if (failures > 0) process.exit(1)
