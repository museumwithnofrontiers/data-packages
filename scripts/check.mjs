// Validates package folders. CI runs it on every pull request with the base
// branch as argument, so only the packages the pull request touches are
// checked, and their versions against the base and the registry. Without an
// argument it checks the layout of every package and skips the version rules.
//
//   node scripts/check.mjs [<base-ref>]
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import {
  PACKAGES_DIR, SCOPE, ROOT, compareVersions, filesUnder, latestOf, packageFolders, parseVersion,
  pretty, publishedVersions, readJson, repositoryFor, run,
} from './lib.mjs'

const base = process.argv[2]
const errors = []
const fail = (folder, message) => errors.push(`packages/${folder}: ${message}`)

// The files npm would publish, plus the two every package carries. Anything
// else — the exporters' .gz companions above all — has no place here.
const ALLOWED = /^(package\.json|README\.md|LICENSE\.md|[^/]+\.json|translations\/[^/]+\.json)$/

function git(...args) {
  const result = run('git', args, { cwd: ROOT })
  if (result.status !== 0) throw new Error(`git ${args.join(' ')} failed:\n${result.stderr}`)
  return result.stdout
}

function changedFolders() {
  const names = git('diff', '--name-only', `${base}...HEAD`, '--', 'packages/').split('\n').filter(Boolean)
  return [...new Set(names.map((name) => name.split('/')[1]))].sort()
}

function baseVersion(folder) {
  const result = run('git', ['show', `${base}:packages/${folder}/package.json`], { cwd: ROOT })
  return result.status === 0 ? JSON.parse(result.stdout).version : null
}

function checkLayout(folder, dir) {
  const files = filesUnder(dir)
  for (const required of ['package.json', 'README.md', 'LICENSE.md', 'manifest.json']) {
    if (!files.includes(required)) fail(folder, `${required} is missing`)
  }
  for (const file of files) {
    if (!ALLOWED.test(file)) {
      fail(folder, `${file} does not belong in a package`)
      continue
    }
    if (!file.endsWith('.json')) continue
    const text = readFileSync(join(dir, file), 'utf-8')
    let value
    try {
      value = JSON.parse(text)
    } catch (error) {
      fail(folder, `${file} is not valid JSON: ${error.message}`)
      continue
    }
    if (text !== pretty(value)) fail(folder, `${file} is not in the committed layout (two-space indentation, final newline)`)
    if (file === 'manifest.json' && 'generatedAt' in value) {
      fail(folder, 'manifest.json carries generatedAt; the release workflow sets it from the commit time')
    }
  }
}

function checkPackageJson(folder, pkg) {
  if (pkg.name !== `${SCOPE}/${folder}`) fail(folder, `package.json names ${pkg.name}, expected ${SCOPE}/${folder}`)
  if (!parseVersion(pkg.version)) fail(folder, `package.json version ${pkg.version} is not X.Y.Z`)
  if (JSON.stringify(pkg.repository) !== JSON.stringify(repositoryFor(folder))) {
    fail(folder, `package.json repository must be ${JSON.stringify(repositoryFor(folder))}`)
  }
}

// A changed package needs a version the registry has never seen, or the
// release would skip it and leave the commit and the published package apart.
// A new folder may instead hold the registry's latest version unchanged:
// that is how a package is seeded from what is already published.
function checkVersion(folder, pkg) {
  if (!parseVersion(pkg.version)) return
  const published = publishedVersions(pkg.name)
  if (published === null) {
    fail(folder, `${pkg.name} has never been published; its first version is published by hand (trusted publishing cannot create a package)`)
    return
  }
  const latest = latestOf(published)
  const before = baseVersion(folder)
  if (before === null) {
    if (pkg.version !== latest && published.includes(pkg.version)) {
      fail(folder, `version ${pkg.version} is already published and is not the latest (${latest})`)
    } else if (compareVersions(pkg.version, latest) < 0) {
      fail(folder, `version ${pkg.version} is behind the registry's latest ${latest}`)
    }
    return
  }
  if (compareVersions(pkg.version, before) <= 0) {
    fail(folder, `the package changed but its version ${pkg.version} is not above ${before} on the base branch`)
  } else if (published.includes(pkg.version)) {
    fail(folder, `version ${pkg.version} is already published`)
  } else if (compareVersions(pkg.version, latest) < 0) {
    fail(folder, `version ${pkg.version} is behind the registry's latest ${latest}`)
  }
}

const folders = base ? changedFolders() : packageFolders()
for (const folder of folders) {
  const dir = join(PACKAGES_DIR, folder)
  if (!existsSync(dir)) {
    fail(folder, 'removing a package is not done here: deprecate it on npmjs by hand')
    continue
  }
  if (!existsSync(join(dir, 'package.json'))) {
    fail(folder, 'package.json is missing')
    continue
  }
  const pkg = readJson(join(dir, 'package.json'))
  checkPackageJson(folder, pkg)
  checkLayout(folder, dir)
  if (base) checkVersion(folder, pkg)
  if (!errors.some((e) => e.startsWith(`packages/${folder}:`))) console.log(`ok  ${pkg.name}@${pkg.version}`)
}

if (folders.length === 0) console.log('No package changed.')
if (errors.length > 0) {
  console.error(errors.map((e) => `::error::${e}`).join('\n'))
  process.exit(1)
}
