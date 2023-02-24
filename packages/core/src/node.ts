import ts from 'typescript'

export const isNodeExported = (node: ts.Node) => {
  const modifierFlags = ts.getCombinedModifierFlags(node as ts.Declaration)

  return (modifierFlags & ts.ModifierFlags.Export) !== 0
}

export const buildEventStatement = (
  checker: ts.TypeChecker,
  parameters: ts.ParameterDeclaration
) => {
  const parameterType = checker.typeToTypeNode(
    checker.getTypeAtLocation(parameters),
    undefined,
    undefined
  )

  return ts.factory.createVariableStatement(
    undefined,
    ts.factory.createVariableDeclarationList(
      [
        ts.factory.createVariableDeclaration(
          ts.factory.createIdentifier(parameters.name.getText()), // name
          undefined, // exclamation token
          parameterType, // type
          ts.factory.createPropertyAccessExpression(
            ts.factory.createIdentifier('event'), // expression
            ts.factory.createIdentifier(parameters.name.getText()) // memberName
          ) // initializer
        ),
      ],
      ts.NodeFlags.Const
    )
  )
}
