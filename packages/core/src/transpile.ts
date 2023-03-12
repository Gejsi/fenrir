import ts from 'typescript'
import { emitFile, emitServerlessConfig } from './emit'
import { isNodeExported, isTopLevelNode } from './node'
import { scanAnnotation } from './scan'
import { visitFunction } from './visit'
import type { AwsFunctionHandler } from 'serverless/aws'

type Options = {
  files: string[] | string
  serverlessConfig: string
  outputDirectory: string
}

export function transpile({
  files,
  serverlessConfig,
  outputDirectory,
}: Options) {
  const rootFiles = Array.isArray(files)
    ? files.filter(ts.sys.fileExists)
    : ts.sys.readDirectory(files)

  const program = ts.createProgram(rootFiles, { allowJs: true })
  const checker = program.getTypeChecker()
  const printer = ts.createPrinter({ newLine: ts.NewLineKind.LineFeed })
  const functionDetails = new Map<string, AwsFunctionHandler>()

  const transformer: ts.TransformerFactory<ts.SourceFile> = (context) => {
    return (sourceFile) => {
      const visitor: ts.Visitor = (node) => {
        // Only consider exported nodes for 'Fixed' functions
        if (isNodeExported(node)) {
          // `isFunctionLike()` doesn't detect anonymous functions
          // so variables must be visited as well
          if (ts.isFunctionLike(node) || ts.isVariableDeclaration(node)) {
            const symbol = node.name && checker.getSymbolAtLocation(node.name)
            if (!symbol) return

            functionDetails.set(symbol.getName(), { handler: 'temp' })

            const doc = ts
              .displayPartsToString(symbol.getDocumentationComment(checker))
              .split('\n')[0]
            if (!doc) return

            const parsedAnnotation = scanAnnotation(doc, symbol.getName(), node)
            if (!parsedAnnotation) return

            // detect if this node is a normal function
            const isFunction = node.kind === ts.SyntaxKind.FunctionDeclaration
            // detect if this variable is an anonymous function
            const isAnonFunction =
              node.kind === ts.SyntaxKind.VariableDeclaration &&
              ts.isFunctionLike(node.initializer)

            if (isFunction || isAnonFunction)
              return visitFunction(node, context)
          }
        }

        if (isTopLevelNode(node) && !ts.isVariableStatement(node)) {
          const doc: string | undefined = (node as any)?.jsDoc?.at(-1)?.comment

          if (doc) {
            const parsedAnnotation = scanAnnotation(doc, undefined, node)
            if (parsedAnnotation?.name === 'Ignored') return undefined
          }

          return node
        }

        return ts.visitEachChild(node, visitor, context)
      }

      return ts.visitNode(sourceFile, visitor)
    }
  }

  if (!program.getSourceFiles().length) {
    console.log('Input files have not been provided to the transpiler.')
    return
  }

  if (!ts.sys.fileExists(serverlessConfig)) {
    console.log(
      '`serverless.yml` configuration file has not been provided to the transpiler.'
    )
    return
  }

  program.getSourceFiles().forEach((sourceFile) => {
    if (!sourceFile.isDeclarationFile) {
      const { transformed: transformedSourceFileList } = ts.transform(
        sourceFile,
        [transformer]
      )
      const transformedSourceFile = transformedSourceFileList[0]

      if (transformedSourceFile) {
        const transformedSourceCode = printer.printFile(transformedSourceFile)
        emitFile(outputDirectory, transformedSourceFile, transformedSourceCode)
      }
    }
  })

  emitServerlessConfig(serverlessConfig, outputDirectory, functionDetails)
}
