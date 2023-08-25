import ts from 'typescript'
import { emitFile, emitServerlessConfig } from './emit'
import { superTransformer } from './transformers'
import { reportDiagnostics, reportMissingServerlessConfig } from './report'
import type { AwsFunctionHandler } from 'serverless/aws'

export type ServerlessConfigFunctions = Map<string, AwsFunctionHandler>

export type SourceFileImports = Set<string>

export type Locals = Map<string, ts.Symbol>

export type CustomTransformer<
  TName extends string = '',
  TArgs extends { [key: string]: unknown } = {}
> = (
  node: ts.FunctionDeclaration | undefined,
  context: ts.TransformationContext,
  annotation: {
    name: TName
    args: TArgs
  }
) => ts.SourceFile | ts.FunctionDeclaration | undefined | void

export type CustomAnnotations = Record<string, CustomTransformer>

declare module 'typescript' {
  interface TransformationContext {
    /** Metadata function details that will be used for emitting `serverless.yml`. */
    slsFunctionDetails: ServerlessConfigFunctions
    /** Metadata output directory that will be used for emitting `serverless.yml`. */
    outputDirectory: string
    /** Record containing all custom annotations with their associated transformers. */
    customAnnotations: CustomAnnotations
    /** Imports of a source file. */
    imports: SourceFileImports
    /** Function nodes dependencies such as parameters and local variables. */
    locals: Locals
    /** The default typechecker of TypeScript. Useful for working with symbols. */
    typeChecker: ts.TypeChecker
    /** Function nodes parent source file (used for pipelining transformers). */
    sourceFile: ts.SourceFile
    /** Starting position of the node in the AST (used for pipelining transformers). */
    nodeStartingPosition: number
  }
}

type TranspilerOptions = {
  files: string[] | string
  serverlessConfigPath?: string
  outputDirectory?: string
  annotations?: Record<string, string>
}

export async function transpile(configPath: string) {
  const configSource = ts.sys.readFile(configPath)

  if (!configSource) {
    console.error(
      'No configuration file was provided. Please, create a file like `fenrir.config.json`'
    )
    return
  }

  /* eslint-disable prefer-const */
  let {
    files,
    serverlessConfigPath,
    outputDirectory,
    annotations: customAnnotationsOption,
  }: TranspilerOptions = JSON.parse(configSource)
  /* eslint-enable */

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
        'Since you are providing a list of files, a `serverless.yml` must\nbe provided to the transpiler to generate the needed metadata.'
      )
      return
    }

    // in this case `files` is a directory
    serverlessConfigPath = files + '/serverless.yml'
  }

  if (!outputDirectory) outputDirectory = 'functions'

  const customAnnotations: CustomAnnotations = {}

  if (customAnnotationsOption && Object.keys(customAnnotationsOption).length) {
    for (const [annotationName, annotationSource] of Object.entries(
      customAnnotationsOption
    )) {
      try {
        const f = await import(ts.sys.resolvePath(annotationSource))
        customAnnotations[annotationName] = f.default
      } catch (error) {
        console.error(
          'Error while importing custom annotations.\nCheck if a transformer has been properly exported as `default`.'
        )
      }
    }
  }

  const printer = ts.createPrinter({ newLine: ts.NewLineKind.LineFeed })
  const checker = program.getTypeChecker()
  const functionDetails: ServerlessConfigFunctions = new Map()

  for (const sourceFile of program.getSourceFiles()) {
    if (
      sourceFile.isDeclarationFile ||
      !rootFiles.includes(sourceFile.fileName)
    )
      continue

    const { transformed: transformedSourceFiles, diagnostics } = ts.transform(
      sourceFile,
      [
        superTransformer(
          checker,
          functionDetails,
          outputDirectory,
          customAnnotations
        ),
      ]
    )
    const transformedSourceFile = transformedSourceFiles[0]

    if (transformedSourceFile) {
      const transformedSourceCode = printer.printFile(transformedSourceFile)
      emitFile(outputDirectory, transformedSourceFile, transformedSourceCode)
    }

    if (diagnostics?.length) reportDiagnostics(diagnostics)
  }

  emitServerlessConfig(serverlessConfigPath, functionDetails)
}
