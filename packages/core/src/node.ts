import ts from 'typescript'

export const isNodeExported = (node: ts.Node) => {
  const modifierFlags = ts.getCombinedModifierFlags(node as ts.Declaration)

  return (modifierFlags & ts.ModifierFlags.Export) !== 0
}
