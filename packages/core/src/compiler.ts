import ts from 'typescript'
import { isNodeExported } from './node'
import { AnnotationData, scanAnnotation } from './scanner'

type Data = Partial<{
  name: string
  annotation: AnnotationData
  fileName: string
  kind: 'Function' | 'CallExpression'
}>

// Generate documentation for all annotated nodes
export function extractAnnotations(
  fileNames: string[] | string,
  options: ts.CompilerOptions = { allowJs: true }
): Data[] {
  console.log('Extracting annotations')

  const files = Array.isArray(fileNames)
    ? fileNames
    : ts.sys.readDirectory(fileNames)

  const program = ts.createProgram(files, options)
  const checker = program.getTypeChecker()
  const output: Data[] = []

  const visit = (node: ts.Node) => {
    // Only consider exported nodes
    if (!isNodeExported(node)) return

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

      const doc = ts
        .displayPartsToString(symbol.getDocumentationComment(checker))
        .split('\n')[0]
      if (!doc) return

      const parsedAnnotation = scanAnnotation(
        doc,
        symbol.getName(),
        currentNode
      )
      if (!parsedAnnotation) return

      // detect if this node is a normal function
      const isFunction = currentNode.kind === ts.SyntaxKind.FunctionDeclaration
      // detect if this variable is an anonymous function
      const isAnonFunction =
        currentNode.kind === ts.SyntaxKind.VariableDeclaration &&
        ts.isFunctionLike(currentNode.initializer)
      // detect if this variable is a call expression
      const isCall =
        currentNode.kind === ts.SyntaxKind.VariableDeclaration &&
        currentNode.initializer &&
        ts.isCallExpression(currentNode.initializer)

      if (isFunction || isAnonFunction)
        output.push(serializeFunction(symbol, currentNode, parsedAnnotation))
      else if (isCall) {
        output.push(
          serializeCallExpression(symbol, currentNode, parsedAnnotation)
        )
      }
    } else if (ts.isModuleDeclaration(node)) {
      // iterate through namespaces
      ts.forEachChild(node, visit)
    }
  }

  const serializeSymbol = (
    symbol: ts.Symbol,
    node: ts.Node,
    annotation: AnnotationData
  ): Data => {
    return {
      name: symbol.getName(),
      annotation,
      fileName: node.getSourceFile().fileName,
    }
  }

  // Serialize function-like nodes
  const serializeFunction = (
    symbol: ts.Symbol,
    node: ts.Node,
    annotation: AnnotationData
  ): Data => {
    let details = serializeSymbol(symbol, node, annotation)
    details.kind = 'Function'
    return details
  }

  // Serialize call-like nodes
  const serializeCallExpression = (
    symbol: ts.Symbol,
    node: ts.Node,
    annotation: AnnotationData
  ): Data => {
    let details = serializeSymbol(symbol, node, annotation)
    details.kind = 'CallExpression'
    return details
  }

  program
    .getSourceFiles()
    .map(
      (sourceFile) =>
        !sourceFile.isDeclarationFile && ts.forEachChild(sourceFile, visit)
    )

  return output
}
