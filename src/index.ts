import fs from 'fs'
import path from 'path'
import { resolveConfig } from './resolveConfig'
import { Lib } from './lib'
import { getInstallVersion, isDirectory, findLib, PackageJSON, resolveName } from './utils'
import { createObject } from '@xzzs/utils'
import { normalizeNodeModulesPath } from './normalize'

export interface ConfigMap {
  [key: string]: {
    version: string;
    resolved: string;
    integrity: string;
    dependencies: {
      [key: string]: string
    }
  }
}

export interface LibModules {
  [lib: string]: {
    [version: string]: string[];
  };
}

export function start(lockpath: string) {
  const { lockJSON, packageJSON, projectPath, projectNodeModulesDir } =
    resolveConfig(lockpath)

  const multiVersionLibs = createLibModules(lockJSON, packageJSON.dependencies)

  const productionDependencies = resolveDependencies(
    projectPath,
    packageJSON.dependencies,
    lockJSON
  )
  const multiVersionProdLibs = Object.entries(multiVersionLibs).reduce((map, [lib, verMap]) => {
    const isProd = productionDependencies[lib]
    return isProd ? {
      ...map, [lib]: Object.entries(verMap).reduce((map, [version, fullNames]) => {
        return {
          ...map,
          [version]: fullNames.map(fullName => resolveCallChain(fullName, lockJSON, packageJSON.dependencies))
        }
      }, {})
    } : map
  }, {})

  console.log('multiVersionLibs', multiVersionLibs)
  console.log('productionDependencies', productionDependencies)
  console.log('multiVersionProdLibs', JSON.stringify(multiVersionProdLibs, null, 2))

}


function createLibModules(lockJSON: ConfigMap, entryConfig: ConfigMap['dependencies']): LibModules {
  const { set: setLibModule, get: getLibModule } = createObject<LibModules>()
  const libModules = getLibModule()

  Object.entries(lockJSON).forEach(([fullName, config]) => {
    const [name, version] = resolveName(fullName)
    const isRootDependency =
      entryConfig[name] && entryConfig[name] === version
    const lib = new Lib(fullName, {
      ...config,
      isRootDependency,
    })

    if (!libModules[lib.name]) libModules[lib.name] = {}
    if (!libModules[lib.name][lib.installVersion]) libModules[lib.name][lib.installVersion] = []
    libModules[lib.name][lib.installVersion].push(fullName)
  })

  for (const name of Object.keys(libModules)) {
    if (Object.keys(libModules[name]).length <= 1) {
      delete libModules[name]
    }
  }
  return libModules
}

function transformInstallVersions(dependencies: PackageJSON['dependencies'], lockJSON: ConfigMap): PackageJSON['dependencies'] {
  return Object.entries(dependencies || {}).reduce((deps, [lib, version]) => {
    const installVersion = getInstallVersion(lockJSON, lib, version)
    return {
      ...deps,
      [lib]: installVersion,
    }
  }, {} as PackageJSON['dependencies'])
}

function resolveDependencies(entry: string, entryConfig: PackageJSON['dependencies'], lockJSON: ConfigMap) {
  const { set: setDependencies, get: getDependencies } = createObject<LibModules>()
  const nodeModulesPath = normalizeNodeModulesPath(entry)

  const transformedEntry = transformInstallVersions(entryConfig, lockJSON)
  const stack: [PackageJSON['dependencies'], string][] = [[transformedEntry, nodeModulesPath]]

  while (true) {
    if (!stack.length) return getDependencies()

    const [current, entryPath] = stack.shift()
    for (const [lib, version] of Object.entries(current)) {
      setDependencies(lib, version, true)

      const pkg = findLib(entryPath, lib, version)
      if (!pkg) {
        throw new Error('未找到' + lib + version)
      }
      const subDeps = transformInstallVersions(pkg.dependencies, lockJSON)

      stack.push([subDeps, entryPath])
    }
  }
}

function resolveCallChain(fullName: string, lockJSON: ConfigMap, packageDependencies: PackageJSON['dependencies']): string[][] {
  const result = []
  const stack = [[fullName]]

  while (stack.length) {
    const current = stack.shift()

    const [name, version] = resolveName(current[0])
    let toEnd = true
    for (const [nameInJSON, configInJSON] of Object.entries(lockJSON)) {
      const deps = configInJSON.dependencies || {}

      if (deps?.[name] === version) {
        stack.push([nameInJSON, ...current])
        toEnd = false
        continue
      }
    }
    if (toEnd) {
      if (current.length > 1) {
        const called = current[current.length - 1]
        const [lib, ver] = resolveName(called)
        if (packageDependencies[lib] === ver) {
          result.push(['$root', called])
        }
      }
      result.push(['$root', ...current])
    }
  }

  const config = {
    chains: [],
    map: {}
  }

  return result.reduce((config, chain) => {
    const key = chain.length === 1
      ? chain[0]
      : chain[1] + chain[chain.length - 1]

    if (!config.map[key]) {
      config.chains.push(chain)
      config.map[key] = true
    }

    return config
  }, config).chains
}

interface DefaultFilterReduceParams {
  chains: string[];
  map: { [key: string]: boolean }
}