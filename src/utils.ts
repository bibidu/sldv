import fs from 'fs'
import path from 'path'

export interface PackageJSON {
  name: string;
  version: string;
  dependencies?: {
    [key: string]: string
  }
}

export function getInstallVersion(lockJSON, lib, version) {
  return lockJSON[`${lib}@${version}`].version
}

export function isDirectory(unknown: string): boolean {
  try {
    const stat = fs.statSync(unknown)
    return stat.isDirectory()
  } catch (error) {
    return false
  }
}

export function isFile(unknown: string): boolean {
  try {
    const stat = fs.statSync(unknown)
    return stat.isFile()
  } catch (error) {
    return false
  }
}

export function findLib(possiblePath: string, lib: string, version: string): PackageJSON {
  const pj = p => path.join(p, lib, 'package.json')
  // console.log('')
  // console.log('try findLib ', lib, version)
  const dirs = [possiblePath, ...getLibraryDirs(possiblePath)]
  // console.log('dirs', dirs)
  for (const dir of dirs) {
    // console.log(`pj(dir) ${pj(dir)}`)
    const pkg = tryRequire(pj(dir))
    if (pkg && pkg.name === lib && pkg.version === version) {
      return pkg
    }
  }
  const message = `[error] Cannot find lib "${lib}@${version}".`
  console.error(message)
  throw new Error(message)
}

export function getLibraryDirs(rootNodeModulesDir) {
  const dirs = []
  const possibleDirs = fs.readdirSync(rootNodeModulesDir)
  for (const dir of possibleDirs) {
    const stack = [dir]
    do {
      const current = stack.shift()
      const valid = isFile(path.join(rootNodeModulesDir, current, 'package.json'))
      if (valid) {
        dirs.push(path.join(rootNodeModulesDir, current, 'node_modules'))
      } else {
        const childDir = path.join(rootNodeModulesDir, current)
        if (isDirectory(childDir)) {
          const nextDirs = fs.readdirSync(childDir)
          stack.push(...nextDirs.map(nd => path.join(current, nd)))
        }
      }

      if (!stack.length) break
    } while (true)
  }

  return dirs
}

export function resolveName(fullName: string): [name: string, version: string] {
  const [_, name, version] = /^(.+)@(.+)/.exec(fullName)

  return [name, version]
}

export function tryRequire(filepath: string) {
  try {
    return require(filepath)
  } catch (error) {
    return null
  }
}