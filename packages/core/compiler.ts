import ts from 'typescript'

type Annotation = Partial<{
  name: string
  annotation: string
  fileName: string
  variables: Annotation[]
  parameters: Annotation[]
}>

const isNodeExported = (node: ts.Node): boolean => {
  return ts.getCombinedModifierFlags(node as ts.Declaration) !== 0
}

// Generate documentation for all annotated nodes
export function extractAnnotations(
  fileNames: string[] | string,
  options: ts.CompilerOptions = { allowJs: true }
): Annotation[] {
  const files = Array.isArray(fileNames)
    ? fileNames
    : ts.sys.readDirectory(fileNames)

  const program = ts.createProgram(files, options)
  const checker = program.getTypeChecker()
  const output: Annotation[] = []

  // Visit nodes finding exported annotated nodes
  const visit = (node: ts.Node) => {
    // Only consider exported nodes
    if (!isNodeExported(node)) return

    if (ts.isFunctionLike(node)) {
      // This is a top level function, get its symbol
      let symbol = node.name && checker.getSymbolAtLocation(node.name)

      if (symbol) output.push(serializeFunction(symbol, node))
    } else if (ts.isModuleDeclaration(node)) {
      // This is a namespace, visit its children
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

    details.variables = symbolType
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
