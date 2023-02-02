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
    if (ts.isFunctionLike(node) || ts.isVariableDeclaration(node)) {
      const symbol = node.name && checker.getSymbolAtLocation(node.name)
      if (!symbol) return

      const doc = ts
        .displayPartsToString(symbol.getDocumentationComment(checker))
        .split('\n')[0]
      if (!doc) return

      const parsedAnnotation = scanAnnotation(doc)
      if (!parsedAnnotation) return

      // detect if this node is normal function
      const isFunction = node.kind === ts.SyntaxKind.FunctionDeclaration
      // detect if this node is an anonymous function
      const isAnonFunction =
        node.kind === ts.SyntaxKind.VariableDeclaration &&
        ts.isFunctionLike(node.initializer)

      if (isFunction || isAnonFunction)
        output.push(serializeFunction(symbol, node, parsedAnnotation))
    } else if (
      // iterate through namespaces and variables
      ts.isModuleDeclaration(node) ||
      ts.isVariableStatement(node) ||
      ts.isVariableDeclarationList(node)
    ) {
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

  // TODO: serialize call expressions

  program
    .getSourceFiles()
    .map(
      (sourceFile) =>
        !sourceFile.isDeclarationFile && ts.forEachChild(sourceFile, visit)
    )

  return output
}
