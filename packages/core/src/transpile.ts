import ts from 'typescript'
import { emitFile, emitServerlessConfig } from './emit'
import type { AwsFunctionHandler } from 'serverless/aws'
import { superTransformer } from './transformers'

type Options = {
  files: string[] | string
  serverlessConfigPath?: string
  outputDirectory?: string
}

export function transpile({
  files,
  serverlessConfigPath,
  outputDirectory = 'functions',
}: Options) {
  const rootFiles = Array.isArray(files)
    ? files.filter(ts.sys.fileExists)
    : ts.sys.readDirectory(files)

  const program = ts.createProgram(rootFiles, { allowJs: true })

  if (!program.getSourceFiles().length) {
    console.log('Input files have not been provided to the transpiler.')
    return
  }

  if (!serverlessConfigPath) {
    if (Array.isArray(files)) {
      console.log(
        '`serverless.yml` configuration file has not been provided to the transpiler.'
      )
      return
    }

    // in this case `files` is a directory
    const configFilePath = files + '/serverless.yml'

    if (!configFilePath) {
      console.log('Failed to load the `serverless.yml` configuration file.')
      return
    }

    serverlessConfigPath = configFilePath
  }

  const printer = ts.createPrinter({ newLine: ts.NewLineKind.LineFeed })
  const checker = program.getTypeChecker()
  const functionDetails = new Map<string, AwsFunctionHandler>()
  const globalTransformer = superTransformer(checker)

  program.getSourceFiles().forEach((sourceFile) => {
    if (!sourceFile.isDeclarationFile) {
      const { transformed: transformedSourceFiles } = ts.transform(sourceFile, [
        globalTransformer,
      ])
      const transformedSourceFile = transformedSourceFiles[0]

      if (transformedSourceFile) {
        const transformedSourceCode = printer.printFile(transformedSourceFile)
        emitFile(outputDirectory, transformedSourceFile, transformedSourceCode)
      }
    }
  })

  emitServerlessConfig(serverlessConfigPath, outputDirectory, functionDetails)
}
