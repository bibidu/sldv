import path from 'path'
import { isDirectory } from './utils'

export function normalizeNodeModulesPath(entry: string): string {
  const nm = filepath => path.join(filepath, 'node_modules')
  let normalized = entry
  do {
    if (isDirectory(nm(normalized))) {
      return nm(normalized)
    } else {
      if (path.dirname(normalized) === normalized) {
        throw new Error('!!!!!!')
      }
      normalized = path.dirname(normalized)
    }
  } while (true)
}
