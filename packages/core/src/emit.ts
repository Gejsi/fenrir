import ts from 'typescript'
import { basename } from 'path'
import { parse as parseYaml, stringify as stringifyYaml } from 'yaml'
import type { Serverless as ServerlessConfig } from 'serverless/aws'
import { ServerlessConfigFunctions } from './transpile'

export const emitFile = (
  outputDirectory: string,
  sourceFile: ts.SourceFile,
  sourceCode: string
) => {
  if (!ts.sys.directoryExists(outputDirectory)) {
    console.log(
      `The output directory has been created at:\n${ts.sys.resolvePath(
        outputDirectory
      )}`
    )
    ts.sys.createDirectory(outputDirectory)
  }

  const fileName = basename(sourceFile.fileName)

  ts.sys.writeFile(`${outputDirectory}/${fileName}`, sourceCode)
}

export const emitServerlessConfig = (
  path: string,
  outputDirectory: string,
  functionDetails: ServerlessConfigFunctions | undefined
) => {
  const slsConfig = ts.sys.readFile(path)

  if (!slsConfig) {
    console.log('Failed to read the `serverless.yml` configuration file.')
    process.exit(1)
  }

  const parsedConfig: ServerlessConfig = parseYaml(slsConfig)

  parsedConfig.functions = {
    ...parsedConfig.functions,
    ...(functionDetails && Object.fromEntries(functionDetails)),
  }

  const transformedConfig = stringifyYaml(parsedConfig)

  ts.sys.writeFile(`${outputDirectory}/serverless.yml`, transformedConfig)
}
