import ts from 'typescript'
import { emitFile } from './emit'
import { isNodeExported } from './node'
import { scanAnnotation } from './scan'
import { visitCallExpression, visitFunction } from './visit'

export function transpile(fileNames: string[] | string) {
  const files = Array.isArray(fileNames)
    ? fileNames
    : ts.sys.readDirectory(fileNames)

  const program = ts.createProgram(files, { allowJs: true })
  const checker = program.getTypeChecker()
  const printer = ts.createPrinter({ newLine: ts.NewLineKind.LineFeed })

  const transformer: ts.TransformerFactory<ts.SourceFile> = (context) => {
    return (sourceFile) => {
      const visitor: ts.Visitor = (node) => {
        // Only consider exported nodes
        if (isNodeExported(node)) {
          // `isFunctionLike()` doesn't detect anonymous functions
          // so variables must be visited as well
          if (ts.isFunctionLike(node) || ts.isVariableDeclaration(node)) {
            const symbol = node.name && checker.getSymbolAtLocation(node.name)
            if (!symbol) return

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
            // detect if this variable is a call expression
            const isCall =
              node.kind === ts.SyntaxKind.VariableDeclaration &&
              node.initializer &&
              ts.isCallExpression(node.initializer)

            if (isFunction || isAnonFunction)
              return visitFunction(checker, symbol, node, context)
            else if (isCall) visitCallExpression(node)
          }
        }

        return ts.visitEachChild(node, visitor, context)
      }

      return ts.visitNode(sourceFile, visitor)
    }
  }

  program.getSourceFiles().forEach((sourceFile) => {
    if (!sourceFile.isDeclarationFile) {
      const { transformed: transformedSourceFileList } = ts.transform(
        sourceFile,
        [transformer]
      )
      const transformedSourceFile = transformedSourceFileList[0]

      if (transformedSourceFile) {
        const sourceCode = printer.printFile(transformedSourceFile)
        emitFile(transformedSourceFile, sourceCode)
      }
    }
  })
}
