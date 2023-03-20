import ts from 'typescript'
import { emitFile, emitServerlessConfig } from './emit'
import { isTopLevelNode } from './node'
import type { AwsFunctionHandler } from 'serverless/aws'
import { scanAnnotation } from './scan'
import { transformFixedFunction } from './transform'

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

  const checker = program.getTypeChecker()
  const printer = ts.createPrinter({ newLine: ts.NewLineKind.LineFeed })
  const functionDetails = new Map<string, AwsFunctionHandler>()

  const transformer: ts.TransformerFactory<ts.SourceFile> = (context) => {
    return (sourceFile) => {
      const visitor: ts.Visitor = (node) => {
        const fixedResult = transformFixedFunction(
          node,
          checker,
          context,
          sourceFile,
          functionDetails
        )

        // if the transformation was successful, return the new node
        if (fixedResult) return fixedResult

        if (isTopLevelNode(node)) {
          const comment: string | undefined = (node as any)?.jsDoc?.at(
            -1
          )?.comment

          if (comment) {
            const parsedAnnotation = scanAnnotation(comment, undefined, node)
            if (parsedAnnotation?.name === 'Ignored') return
          }

          return node
        }

        // ...otherwise, keep traversing the AST
        return ts.visitEachChild(node, visitor, context)
      }

      return ts.visitNode(sourceFile, visitor)
    }
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

  program.getSourceFiles().forEach((sourceFile) => {
    if (!sourceFile.isDeclarationFile) {
      const { transformed: transformedSourceFiles } = ts.transform(sourceFile, [
        transformer,
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
