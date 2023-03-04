import ts from 'typescript'

export const isNodeExported = (node: ts.Node) => {
  const modifierFlags = ts.getCombinedModifierFlags(node as ts.Declaration)

  return (modifierFlags & ts.ModifierFlags.Export) !== 0
}

export const buildEventStatementList = (
  parameters: ts.ParameterDeclaration[]
) => {
  return parameters.map((parameter) => {
    return ts.factory.createVariableStatement(
      undefined,
      ts.factory.createVariableDeclarationList(
        [
          ts.factory.createVariableDeclaration(
            ts.factory.createIdentifier(parameter.name.getText()), // name
            undefined, // exclamation token
            parameter.type, // type
            ts.factory.createPropertyAccessExpression(
              ts.factory.createIdentifier('event'), // expression
              ts.factory.createIdentifier(parameter.name.getText()) // memberName
            ) // initializer
          ),
        ],
        ts.NodeFlags.Const
      )
    )
  })
}

const buildJsonExpression = (expression: ts.Expression): ts.Expression => {
  return ts.factory.createCallExpression(
    ts.factory.createPropertyAccessExpression(
      ts.factory.createIdentifier('JSON'),
      ts.factory.createIdentifier('stringify')
    ),
    undefined,
    [expression]
  )
}

export const buildReturnExpression = (node: ts.ReturnStatement) => {
  const statusCode = ts.factory.createPropertyAssignment(
    'statusCode',
    ts.factory.createNumericLiteral(200)
  )

  const body =
    node.expression &&
    ts.factory.createPropertyAssignment(
      'body',
      buildJsonExpression(node.expression)
    )

  const properties: ts.ObjectLiteralElementLike[] = []
  properties.push(statusCode)
  body && properties.push(body)

  return ts.factory.createObjectLiteralExpression(properties, true)
}
