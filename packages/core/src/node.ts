import ts from 'typescript'

export const isNodeExported = (node: ts.Node): boolean => {
  const modifierFlags = ts.getCombinedModifierFlags(node as ts.Declaration)
  return (modifierFlags & ts.ModifierFlags.Export) !== 0
}

export const isFunctionAsync = (node: ts.FunctionDeclaration): boolean => {
  const modifierFlags = ts.getCombinedModifierFlags(node)
  return (modifierFlags & ts.ModifierFlags.Async) !== 0
}

/** Checks if the node is really present in the AST */
export const isNodeReal = (node: ts.Node | undefined): boolean => {
  return node ? node.pos !== -1 : false
}

export function findFunctionInFile(
  node: ts.SourceFile,
  nodeName: string
): ts.FunctionDeclaration | undefined {
  return node.statements.find((statement) => {
    return (
      ts.isFunctionDeclaration(statement) &&
      statement.name?.getText() === nodeName
    )
  }) as ts.FunctionDeclaration | undefined
}
