import ts from 'typescript'

export const visitFunction = (
  node: ts.FunctionDeclaration | ts.VariableDeclaration
) => {
  if (ts.isFunctionDeclaration(node)) {
    // const symbolType = checker.getTypeOfSymbolAtLocation(
    //   symbol,
    //   symbol.valueDeclaration!
    // )

    // const parameters = symbolType.getCallSignatures().at(0)?.parameters
    // const returnType = symbolType.getCallSignatures().at(0)?.getReturnType()

    const parameters = [
      ts.factory.createParameterDeclaration(undefined, undefined, 'event'),
      ts.factory.createParameterDeclaration(undefined, undefined, 'context'),
      ts.factory.createParameterDeclaration(undefined, undefined, 'callback'),
    ]

    const block = ts.forEachChild(node, (currentNode) => {
      if (ts.isBlock(currentNode)) return currentNode
    })

    return ts.factory.updateFunctionDeclaration(
      node,
      ts.getModifiers(node), // modifiers
      undefined, // asteriskToken
      node.name, // name
      ts.getEffectiveTypeParameterDeclarations(node), // typeParameters
      parameters, // parameters
      undefined, // returnType
      block // block
    )
  }
}

export const visitCallExpression = (node: ts.Node) => {
  console.log('visiting call')
}
