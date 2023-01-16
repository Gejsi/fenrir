import ts from 'typescript'

type Annotation = Partial<{
  name: string
  annotation: string
  fileName: string
  constructors: Annotation[]
  parameters: Annotation[]
}>

const isNodeExported = (node: ts.Node): boolean => {
  return (
    (ts.getCombinedModifierFlags(node as ts.Declaration) &
      ts.ModifierFlags.Export) !==
      0 ||
    (!!node.parent && node.parent.kind === ts.SyntaxKind.SourceFile)
  )
}

/** Generate documentation for all annotated nodes */
export function extractAnnotations(
  fileNames: string[],
  options: ts.CompilerOptions = { allowJs: true }
): Annotation[] {
  let program = ts.createProgram(fileNames, options)
  let checker = program.getTypeChecker()
  let output: Annotation[] = []

  // Visit nodes finding exported annotated nodes
  const visit = (node: ts.Node) => {
    // Only consider exported nodes
    if (!isNodeExported(node)) return

    if (ts.isFunctionLike(node)) {
      // This is a top level function, get its symbol
      let symbol = node.name && checker.getSymbolAtLocation(node.name)

      if (symbol) output.push(serializeFunction(symbol))
      // No need to walk any further, class expressions/inner declarations cannot be exported
    } else if (ts.isModuleDeclaration(node)) {
      // This is a namespace, visit its children
      ts.forEachChild(node, visit)
    }
  }

  // Serialize a symbol
  const serializeSymbol = (symbol: ts.Symbol): Annotation => {
    return {
      name: symbol.getName(),
      annotation: ts.displayPartsToString(
        symbol.getDocumentationComment(checker)
      ),
      fileName: fileNames[0],
    }
  }

  // Serialize a signature
  const serializeSignature = (signature: ts.Signature) => {
    return {
      parameters: signature.parameters.map(serializeSymbol),
    }
  }

  // Serialize nodes symbol information
  const serializeFunction = (symbol: ts.Symbol) => {
    let details = serializeSymbol(symbol)

    let signatureType =
      symbol.valueDeclaration &&
      checker.getTypeOfSymbolAtLocation(symbol, symbol.valueDeclaration)

    details.constructors = signatureType
      ?.getCallSignatures()
      .map(serializeSignature)

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
