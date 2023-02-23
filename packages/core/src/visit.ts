import ts from 'typescript'

export const visitFunction = (
  checker: ts.TypeChecker,
  node: ts.FunctionDeclaration | ts.VariableDeclaration
) => {
  if (ts.isFunctionDeclaration(node)) {
    const oldValues: {
      parameters?: ts.ParameterDeclaration
      block?: ts.Block
    } = {
      parameters: undefined,
      block: undefined,
    }

    ts.forEachChild(node, (currentNode) => {
      if (ts.isParameter(currentNode)) oldValues.parameters = currentNode
      else if (ts.isBlock(currentNode)) oldValues.block = currentNode
    })

    const newParameters = [
      ts.factory.createParameterDeclaration(undefined, undefined, 'event'),
      ts.factory.createParameterDeclaration(undefined, undefined, 'context'),
      ts.factory.createParameterDeclaration(undefined, undefined, 'callback'),
    ]

    let newBlock = oldValues.block

    // if there are parameters to the function,
    // they should be mapped to the `event` cloud function parameter
    if (oldValues.parameters?.getChildCount() && oldValues.block?.statements) {
      // TODO: extract this factory into an external function
      const parameterType = checker.typeToTypeNode(
        checker.getTypeAtLocation(oldValues.parameters),
        undefined,
        undefined
      )

      const eventStatement = ts.factory.createVariableStatement(
        undefined,
        ts.factory.createVariableDeclarationList(
          [
            ts.factory.createVariableDeclaration(
              ts.factory.createIdentifier(oldValues.parameters.name.getText()), // name
              undefined, // exclamation token
              parameterType, // type
              ts.factory.createPropertyAccessExpression(
                ts.factory.createIdentifier('event'), // expression
                ts.factory.createIdentifier(oldValues.parameters.name.getText()) // memberName
              ) // initializer
            ),
          ],
          ts.NodeFlags.Const
        )
      )

      newBlock = ts.factory.createBlock(
        [eventStatement, ...oldValues.block.statements],
        true
      )
    }

    return ts.factory.updateFunctionDeclaration(
      node,
      ts.getModifiers(node), // modifiers
      undefined, // asteriskToken
      node.name, // name
      ts.getEffectiveTypeParameterDeclarations(node), // typeParameters
      newParameters, // parameters
      undefined, // returnType
      newBlock // block
    )
  }
}

export const visitCallExpression = (node: ts.Node) => {
  console.log('visiting call')
}
