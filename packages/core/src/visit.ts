import ts from 'typescript'

export const visitFunction = (
  node: ts.FunctionDeclaration | ts.VariableDeclaration
) => {
  if (ts.isFunctionDeclaration(node)) {
    // TODO: this is just an example transfomer to update functions
    return ts.createVariableDeclarationList(
      [
        ts.createVariableDeclaration(
          ts.createIdentifier(node.name.escapedText),
          undefined,
          ts.createArrowFunction(
            undefined,
            undefined,
            [],
            undefined,
            ts.createToken(ts.SyntaxKind.EqualsGreaterThanToken),
            ts.createBlock([], false)
          )
        ),
      ],
      ts.NodeFlags.Const
    )
  }
}

export const visitCallExpression = (node: ts.Node) => {
  console.log('visiting call')
}
