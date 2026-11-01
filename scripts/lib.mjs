// What the check, the release and the seed scripts share: where packages live,
// the one JSON layout the repository accepts, and what the registry holds.
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

export const ROOT = fileURLToPath(new URL('..', import.meta.url))
export const PACKAGES_DIR = join(ROOT, 'packages')
export const SCOPE = '@museumwnf'

// npm provenance refuses a publish whose package.json names another repository
// than the one the workflow runs in, so every package carries this one.
export const REPOSITORY_URL = 'git+https://github.com/museumwithnofrontiers/data-packages.git'

export function repositoryFor(folder) {
  return { type: 'git', url: REPOSITORY_URL, directory: `packages/${folder}` }
}

/** The committed layout: two-space indentation and a final newline, so diffs are line by line. */
export function pretty(value) {
  return JSON.stringify(value, null, 2) + '\n'
}

/** The published layout: compact, exactly as the exporters wrote it before this repository existed. */
export function compact(value) {
  return JSON.stringify(value)
}

export function readJson(path) {
  return JSON.parse(readFileSync(path, 'utf-8'))
}

export function packageFolders() {
  return readdirSync(PACKAGES_DIR)
    .filter((name) => statSync(join(PACKAGES_DIR, name)).isDirectory())
    .sort()
}

/** Every file under dir, as paths relative to dir with forward slashes. */
export function filesUnder(dir) {
  const out = []
  const walk = (current) => {
    for (const name of readdirSync(current).sort()) {
      const path = join(current, name)
      if (statSync(path).isDirectory()) walk(path)
      else out.push(relative(dir, path).split('\\').join('/'))
    }
  }
  walk(dir)
  return out
}

export function run(command, args, options = {}) {
  const result = spawnSync(command, args, { encoding: 'utf-8', ...options })
  if (result.error) throw result.error
  return result
}

/**
 * The versions the registry holds for a package, or null when it has never
 * been published. Any other registry failure throws: a guess here could
 * publish a version twice or skip one.
 */
export function publishedVersions(name) {
  const result = run('npm', ['view', name, 'versions', '--json'])
  if (result.status !== 0) {
    if (/E404/.test(result.stderr + result.stdout)) return null
    throw new Error(`npm view ${name} failed:\n${result.stderr}`)
  }
  const parsed = JSON.parse(result.stdout)
  return Array.isArray(parsed) ? parsed : [parsed]
}

export function parseVersion(version) {
  const match = /^(\d+)\.(\d+)\.(\d+)$/.exec(version ?? '')
  return match ? match.slice(1).map(Number) : null
}

/** Negative, zero or positive, as a is before, equal to or after b. */
export function compareVersions(a, b) {
  const [x, y] = [parseVersion(a), parseVersion(b)]
  for (let i = 0; i < 3; i++) if (x[i] !== y[i]) return x[i] - y[i]
  return 0
}

export function latestOf(versions) {
  return versions.filter(parseVersion).sort(compareVersions).at(-1) ?? null
}
