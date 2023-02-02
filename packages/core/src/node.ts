import ts from 'typescript'

export const isNodeExported = (node: ts.Node) => {
  const modifierFlags = ts.getCombinedModifierFlags(node as ts.Declaration)

  return (modifierFlags & ts.ModifierFlags.Export) !== 0
}

// TODO: check if the doc also contains the annotation
export const isNodeDocumented = (node: ts.Node) => {
  const docTag = ts.getJSDocTags(node)

  return docTag.map((c) => c.comment !== undefined)[0] || false
}
