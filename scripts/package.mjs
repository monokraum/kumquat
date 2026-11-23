import { copyFile } from 'node:fs/promises'

const release = new URL('../release/kumquat-offline/', import.meta.url)
await Promise.all([
  copyFile(new URL('./launch.mjs', import.meta.url), new URL('launch.mjs', release)),
  copyFile(new URL('../README.md', import.meta.url), new URL('README.md', release)),
])
console.log('Livrable hors ligne disponible dans release/kumquat-offline/')
