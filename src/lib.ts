export class Lib {
  name: string;
  version: string;
  installVersion: string;
  fullName: string;
  isRootDependency: boolean;
  dependencies: string[];

  constructor(fullName, config) {
    const [_, name, version] = /^(.+)@(.+)/.exec(fullName)
    this.name = name
    this.version = version
    this.installVersion = config.version
    this.fullName = fullName
    this.isRootDependency = config.isRootDependency
    this.dependencies = config.dependencies || {}
  }
}
