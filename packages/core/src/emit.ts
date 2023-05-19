import ts from 'typescript'
import { basename } from 'path'
import { parse as parseYaml, stringify as stringifyYaml } from 'yaml'
import type { Serverless as ServerlessConfig } from 'serverless/aws'
import type { ServerlessConfigFunctions } from './transpile'
import { reportMissingServerlessConfig } from './report'

export const emitFile = (
  outputDirectory: string,
  sourceFile: ts.SourceFile,
  sourceCode: string
): void => {
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
  functionDetails: ServerlessConfigFunctions | undefined
): void => {
  const slsConfig = ts.sys.readFile(path)

  if (!slsConfig) {
    reportMissingServerlessConfig(
      "`serverless.yml` wasn't correctly found, so the needed metadata wasn't generated."
    )
    process.exit(1)
  }

  const parsedConfig: ServerlessConfig = parseYaml(slsConfig)

  parsedConfig.functions = {
    ...parsedConfig.functions,
    ...(functionDetails && Object.fromEntries(functionDetails)),
  }

  const transformedConfig = stringifyYaml(parsedConfig)

  ts.sys.writeFile(`serverless.yml`, transformedConfig)
}
