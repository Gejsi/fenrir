import ts from 'typescript'
import { buildEventStatementList, buildReturnExpression } from './node'

const visitFunctionBody: ts.Visitor = (node) => {
  if (ts.isReturnStatement(node))
    return ts.factory.updateReturnStatement(node, buildReturnExpression(node))

  return node
}

export const visitFunction = (
  node: ts.FunctionDeclaration | ts.VariableDeclaration,
  context: ts.TransformationContext
) => {
  const oldValues: {
    parameters: ts.ParameterDeclaration[]
    block?: ts.Block
  } = {
    parameters: [],
    block: undefined,
  }

  /* Loop through functions to get
   * 1. Parameters
   * 2. Function body -> modify return statements
   */
  ts.forEachChild(node, (outerNode) => {
    if (ts.isParameter(outerNode)) oldValues.parameters.push(outerNode)
    else if (ts.isBlock(outerNode))
      oldValues.block = ts.visitEachChild(outerNode, visitFunctionBody, context)
    else if (ts.isArrowFunction(outerNode))
      oldValues.block = ts.visitEachChild(
        outerNode.body,
        visitFunctionBody,
        context
      ) as ts.Block
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
    const eventStatementList = buildEventStatementList(oldValues.parameters)

    newBlock = ts.factory.createBlock(
      [...eventStatementList, ...oldValues.block.statements],
      true
    )
  }

  if (ts.isFunctionDeclaration(node)) {
    return ts.factory.updateFunctionDeclaration(
      node, // node
      ts.getModifiers(node), // modifiers
      node.asteriskToken, // asteriskToken
      node.name, // name
      node.typeParameters, // typeParameters
      newParameters, // parameters
      node.type, // returnType
      newBlock // block
    )
  } else {
    const arrowFunctionNode = node.initializer as ts.ArrowFunction

    return ts.factory.updateVariableDeclaration(
      node, // node,
      node.name, // name,
      node.exclamationToken, // exclamationToken,
      node.type, // type
      ts.factory.updateArrowFunction(
        arrowFunctionNode, // node
        ts.getModifiers(arrowFunctionNode), // modifiers
        arrowFunctionNode.typeParameters, // typeParameters
        newParameters, //parameters
        arrowFunctionNode.type, // returnType
        arrowFunctionNode.equalsGreaterThanToken, // equalsGreaterThanToken
        newBlock as ts.ConciseBody // conciseBody
      )
    )
  }
}

export const visitCallExpression = (node: ts.Node) => {
  console.log('visiting call')
}
