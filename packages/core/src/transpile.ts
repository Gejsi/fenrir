import ts from 'typescript'
import { extname } from 'path'
import { emitFile, emitServerlessConfig } from './emit'
import { superTransformer } from './transformers'
import { reportDiagnostics, reportMissingServerlessConfig } from './report'
import type { AwsFunctionHandler } from 'serverless/aws'

export type ServerlessConfigFunctions = Map<string, AwsFunctionHandler>
export type SourceFileImports = Set<string>
export type Locals = Map<string, ts.Symbol>

declare module 'typescript' {
  interface TransformationContext {
    /** Metadata function details that will be used for emitting `serverless.yml`. */
    slsFunctionDetails: ServerlessConfigFunctions
    /** Imports needed for a source file. */
    imports: SourceFileImports
    /**
     * Function nodes dependencies such as parameters and local variables
     * (also needed for evaluation to check annotations correctness).
     */
    locals: Locals
    /** The default typechecker of TypeScript. Useful for working with symbols. */
    typeChecker: ts.TypeChecker
    /**
     * Function nodes parent source file.
     * (used for pipelining transformers).
     */
    sourceFile: ts.SourceFile
  }
}

type TranspilerOptions = {
  files: string[] | string
  serverlessConfigPath?: string
  outputDirectory?: string
}

export function transpile(configPath: string) {
  const configSource = ts.sys.readFile(configPath)

  if (!configSource) {
    console.error(
      'No configuration file was provided. Please, create a file like `fenrir.config.json`'
    )
    return
  }

  let { files, serverlessConfigPath, outputDirectory }: TranspilerOptions =
    JSON.parse(configSource)

  const rootFiles = Array.isArray(files)
    ? files.filter(ts.sys.fileExists)
    : ts.sys.readDirectory(files)

  const program = ts.createProgram(rootFiles, { allowJs: true })

  if (!program.getSourceFiles().length) {
    console.error('Input files have not been provided to the transpiler.')
    return
  }

  if (!serverlessConfigPath) {
    if (Array.isArray(files)) {
      reportMissingServerlessConfig(
        'Since you are providing a list of files, a `serverless.yml` must \nbe provided to the transpiler to generate the needed metadata.'
      )
      return
    }

    // in this case `files` is a directory
    serverlessConfigPath = files + '/serverless.yml'
  }

  if (!outputDirectory) outputDirectory = 'functions'

  const printer = ts.createPrinter({ newLine: ts.NewLineKind.LineFeed })
  const checker = program.getTypeChecker()
  const functionDetails: ServerlessConfigFunctions = new Map()

  for (const sourceFile of program.getSourceFiles()) {
    if (sourceFile.isDeclarationFile) continue

    const { transformed: transformedSourceFiles, diagnostics } = ts.transform(
      sourceFile,
      [superTransformer(checker, functionDetails)]
    )
    const transformedSourceFile = transformedSourceFiles[0]

    if (transformedSourceFile) {
      const transformedSourceCode = printer.printFile(transformedSourceFile)
      emitFile(outputDirectory, transformedSourceFile, transformedSourceCode)
    }

    if (diagnostics?.length) reportDiagnostics(diagnostics)
  }

  emitServerlessConfig(serverlessConfigPath, outputDirectory, functionDetails)
}
