import ts from 'typescript'
import { buildEventStatementList, buildReturnExpression } from './node'

const visitFunctionBody: ts.Visitor = (node) => {
  if (ts.isReturnStatement(node))
    return ts.factory.updateReturnStatement(node, buildReturnExpression(node))

  return node
}

export const visitFunction = (
  checker: ts.TypeChecker,
  symbol: ts.Symbol,
  node: ts.FunctionDeclaration | ts.VariableDeclaration,
  context: ts.TransformationContext
) => {
  if (ts.isFunctionDeclaration(node)) {
    const oldValues: {
      parameters: ts.ParameterDeclaration[]
      block?: ts.Block
    } = {
      parameters: [],
      block: undefined,
    }

    /* Loop through functions to get
     * 1. Parameters
     * 2. Function body...
     *  2.1 TODO: ...and to modify throw statements
     *  2.2 ...and to modify return statements
     */
    ts.forEachChild(node, (outerNode) => {
      if (ts.isParameter(outerNode)) oldValues.parameters.push(outerNode)
      else if (ts.isBlock(outerNode)) {
        oldValues.block = ts.visitEachChild(
          outerNode,
          visitFunctionBody,
          context
        )
      }
    })

    const newParameters = [
      ts.factory.createParameterDeclaration(undefined, undefined, 'event'),
      ts.factory.createParameterDeclaration(undefined, undefined, 'context'),
      ts.factory.createParameterDeclaration(undefined, undefined, 'callback'),
    ]

    let newBlock = oldValues.block
    // if there are parameters to the function,
    // they should be mapped to the `event` cloud function parameter
    if (oldValues.parameters.length && oldValues.block?.statements) {
      const eventStatementList = buildEventStatementList(
        checker,
        oldValues.parameters
      )

      newBlock = ts.factory.createBlock(
        [...eventStatementList, ...oldValues.block.statements],
        true
      )
    }

    const signatures = checker
      .getTypeOfSymbolAtLocation(symbol, node)
      .getCallSignatures()

    let returnType: ts.TypeNode | undefined
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
      undefined, // typeParameters
      newParameters, // parameters
      returnType, // returnType
      newBlock // block
    )
  }
}

export const visitCallExpression = (node: ts.Node) => {
  console.log('visiting call')
}
