import ts from 'typescript'
import { emitFile, emitServerlessConfig } from './emit'
import type { AwsFunctionHandler } from 'serverless/aws'
import { superTransformer } from './transformers'
import { reportDiagnostics } from './report'

export type ServerlessConfigFunctions = Map<string, AwsFunctionHandler>

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
  /** Function details that will be used for emitting `serverless.yml` */
  const functionDetails: ServerlessConfigFunctions = new Map()

  const globalTransformer = superTransformer(checker, functionDetails)

  for (const sourceFile of program.getSourceFiles()) {
    if (!sourceFile.isDeclarationFile) {
      const { transformed: transformedSourceFiles, diagnostics } = ts.transform(
        sourceFile,
        [globalTransformer]
      )
      const transformedSourceFile = transformedSourceFiles[0]

      if (transformedSourceFile) {
        // TODO: prettify output code
        const transformedSourceCode = printer.printFile(transformedSourceFile)
        emitFile(outputDirectory, transformedSourceFile, transformedSourceCode)
      }

      if (diagnostics?.length) reportDiagnostics(diagnostics)
    }
  }

  emitServerlessConfig(serverlessConfigPath, outputDirectory, functionDetails)
}
