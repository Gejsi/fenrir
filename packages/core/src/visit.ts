import ts from 'typescript'
import { buildEventStatement } from './node'

export const visitFunction = (
  checker: ts.TypeChecker,
  symbol: ts.Symbol,
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
      const eventStatement = buildEventStatement(checker, oldValues.parameters)

      newBlock = ts.factory.createBlock(
        [eventStatement, ...oldValues.block.statements],
        true
      )
    }

    const signatures =
      symbol.valueDeclaration &&
      checker
        .getTypeOfSymbolAtLocation(symbol, symbol.valueDeclaration)
        .getCallSignatures()

    let returnType: ts.TypeNode | undefined = undefined

    if (signatures?.[0]) {
      returnType = checker.typeToTypeNode(
        signatures[0].getReturnType(),
        undefined,
        undefined
      )
    }

    return ts.factory.updateFunctionDeclaration(
      node,
      ts.getModifiers(node), // modifiers
      undefined, // asteriskToken
      node.name, // name
      ts.getEffectiveTypeParameterDeclarations(node), // typeParameters
      newParameters, // parameters
      returnType, // returnType
      newBlock // block
    )
  }
}

export const visitCallExpression = (node: ts.Node) => {
  console.log('visiting call')
}
