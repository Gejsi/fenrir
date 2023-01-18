import ts from 'typescript'

type Annotation = Partial<{
  name: string
  annotation: string
  fileName: string
  kind: ts.SyntaxKind
  innerAnnotations: Annotation[]
  parameters: Annotation[]
}>

const isNodeExported = (node: ts.Node): boolean => {
  const modifierFlags = ts.getCombinedModifierFlags(node as ts.Declaration)

  return (modifierFlags & ts.ModifierFlags.Export) !== 0
}

// Generate documentation for all annotated nodes
export function extractAnnotations(
  fileNames: string[] | string,
  options: ts.CompilerOptions = { allowJs: true }
): Annotation[] {
  console.log('Extracting annotations')

  const files = Array.isArray(fileNames)
    ? fileNames
    : ts.sys.readDirectory(fileNames)

  const program = ts.createProgram(files, options)
  const checker = program.getTypeChecker()
  const output: Annotation[] = []

  // Visit nodes to find exported annotated nodes
  const visit = (node: ts.Node) => {
    // Only consider exported nodes
    if (!isNodeExported(node)) return

    if (ts.isFunctionLike(node)) {
      // top level function
      const symbol = node.name && checker.getSymbolAtLocation(node.name)

      if (symbol) output.push(serializeFunction(symbol, node))
    } else if (ts.isVariableDeclaration(node)) {
      // top level variable
      const symbol = checker.getSymbolAtLocation(node.name)

      if (symbol) {
        // detect if this variable is an anonymous function
        if (ts.isFunctionLike(node.initializer))
          output.push(serializeFunction(symbol, node))
        else output.push(serializeSymbol(symbol, node))
      }
    } else if (
      // iterate through namespaces, variables
      ts.isModuleDeclaration(node) ||
      ts.isVariableStatement(node) ||
      ts.isVariableDeclarationList(node)
    ) {
      ts.forEachChild(node, visit)
    }
  }

  // Serialize a symbol
  const serializeSymbol = (symbol: ts.Symbol, node: ts.Node): Annotation => {
    return {
      name: symbol.getName(),
      annotation: ts.displayPartsToString(
        symbol.getDocumentationComment(checker)
      ),
      fileName: node.getSourceFile().fileName,
      kind: node.kind,
    }
  }

  // Serialize a signature
  const serializeSignature = (signature: ts.Signature, node: ts.Node) => {
    return {
      parameters: signature.parameters.map((symbol) =>
        serializeSymbol(symbol, node)
      ),
    }
  }

  // Serialize nodes symbol information
  const serializeFunction = (symbol: ts.Symbol, node: ts.Node): Annotation => {
    let details = serializeSymbol(symbol, node)

    let symbolType =
      symbol.valueDeclaration &&
      checker.getTypeOfSymbolAtLocation(symbol, symbol.valueDeclaration)

    details.innerAnnotations = symbolType
      ?.getCallSignatures()
      .map((signature) => serializeSignature(signature, node))

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
