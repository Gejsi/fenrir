import ts from 'typescript'
import { emitFile, emitServerlessConfig } from './emit'
import { isNodeExported, isTopLevelNode } from './node'
import { scanAnnotation } from './scan'
import { visitAnonymousFunction, visitFunction } from './visit'
import type { AwsFunctionHandler } from 'serverless/aws'
import { parse as parseFileName } from 'path'

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
        // Only consider exported nodes for 'Fixed' functions
        if (isNodeExported(node)) {
          // `isFunctionLike()` doesn't detect anonymous functions
          // so variables must be visited as well
          if (ts.isFunctionLike(node) || ts.isVariableStatement(node)) {
            const currentNode =
              node.kind === ts.SyntaxKind.VariableStatement
                ? node.declarationList.declarations[0]
                : node
            if (!currentNode) return

            const symbol =
              currentNode.name && checker.getSymbolAtLocation(currentNode.name)
            if (!symbol) return

            functionDetails.set(symbol.getName(), {
              handler:
                parseFileName(sourceFile.fileName).name +
                '.' +
                symbol.getName(),
            })

            const comment = ts
              .displayPartsToString(symbol.getDocumentationComment(checker))
              .split('\n')[0]
            if (!comment) return

            const parsedAnnotation = scanAnnotation(
              comment,
              symbol.getName(),
              currentNode
            )
            if (!parsedAnnotation || parsedAnnotation.name === 'Ignored') return

            // detect if this node is a normal function
            const isFunction =
              currentNode.kind === ts.SyntaxKind.FunctionDeclaration
            // detect if this variable is an anonymous function
            const isAnonFunction =
              currentNode.kind === ts.SyntaxKind.VariableDeclaration &&
              ts.isFunctionLike(currentNode.initializer) &&
              node.kind === ts.SyntaxKind.VariableStatement

            if (isFunction) return visitFunction(currentNode, context)
            else if (isAnonFunction)
              return visitAnonymousFunction(node, currentNode, context)
          }
        }

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

  emitServerlessConfig(serverlessConfigPath, outputDirectory, functionDetails)

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
}
