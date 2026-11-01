// Seeds package folders from what the registry already holds: the latest
// published version, in the committed layout, with generatedAt dropped and the
// repository set to this one. Run once per package when it moves here.
//
//   node scripts/seed.mjs <package-name-without-scope>...
import { cpSync, mkdtempSync, readdirSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { PACKAGES_DIR, SCOPE, filesUnder, latestOf, pretty, publishedVersions, readJson, repositoryFor, run } from './lib.mjs'

const folders = process.argv.slice(2)
if (folders.length === 0) {
  console.error('usage: node scripts/seed.mjs <package-name-without-scope>...')
  process.exit(2)
}

for (const folder of folders) {
  const name = `${SCOPE}/${folder}`
  const versions = publishedVersions(name)
  if (versions === null) throw new Error(`${name} has never been published`)
  const version = latestOf(versions)

  const work = mkdtempSync(join(tmpdir(), `seed-${folder}-`))
  try {
    const pack = run('npm', ['pack', `${name}@${version}`, '--silent'], { cwd: work })
    if (pack.status !== 0) throw new Error(`npm pack ${name}@${version} failed:\n${pack.stderr}`)
    const tarball = readdirSync(work).find((file) => file.endsWith('.tgz'))
    const untar = run('tar', ['-xzf', tarball], { cwd: work })
    if (untar.status !== 0) throw new Error(`tar failed for ${tarball}:\n${untar.stderr}`)

    const target = join(PACKAGES_DIR, folder)
    rmSync(target, { recursive: true, force: true })
    cpSync(join(work, 'package'), target, { recursive: true })

    for (const file of filesUnder(target)) {
      if (!file.endsWith('.json')) continue
      const path = join(target, file)
      const value = readJson(path)
      if (file === 'manifest.json') delete value.generatedAt
      if (file === 'package.json') value.repository = repositoryFor(folder)
      writeFileSync(path, pretty(value), 'utf-8')
    }
    console.log(`seeded packages/${folder} from ${name}@${version}`)
  } finally {
    rmSync(work, { recursive: true, force: true })
  }
}
