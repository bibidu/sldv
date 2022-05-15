import fs from 'fs'
import path from 'path'
import * as lockResolver from '@yarnpkg/lockfile'

export function resolveConfig(lockpath: string) {
  const packageJSONPath = path.resolve(path.dirname(lockpath), 'package.json')

  const lockJSON = lockResolver.parse(fs.readFileSync(lockpath, 'utf8')).object
  const packageJSON = JSON.parse(fs.readFileSync(packageJSONPath, 'utf8'))

  const projectNodeModulesDir = path.join(
    path.dirname(lockpath),
    'node_modules'
  )

  return {
    lockJSON,
    packageJSON,
    projectPath: path.dirname(lockpath),
    projectNodeModulesDir
  }
}
