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
  ts.forEachChild(node, (currentNode) => {
    if (ts.isParameter(currentNode)) oldValues.parameters.push(currentNode)
    else if (ts.isBlock(currentNode)) {
      oldValues.block = ts.visitEachChild(
        currentNode,
        visitFunctionBody,
        context
      )
    } else if (
      // detect anonymous functions
      ts.isArrowFunction(currentNode) ||
      ts.isFunctionExpression(currentNode)
    ) {
      oldValues.parameters = [...currentNode.parameters]

      oldValues.block = ts.visitEachChild(
        currentNode.body,
        visitFunctionBody,
        context
      ) as ts.Block
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
    const eventStatementList = buildEventStatementList(oldValues.parameters)

    newBlock = ts.factory.createBlock(
      [...eventStatementList, ...oldValues.block.statements],
      true
    )
  }

  // detect plain `function foo() {}`
  if (ts.isFunctionDeclaration(node))
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

  // detect anonymous functions
  if (
    node.initializer &&
    (ts.isArrowFunction(node.initializer) ||
      ts.isFunctionExpression(node.initializer))
  ) {
    const functionNode = node.initializer

    return ts.factory.updateVariableDeclaration(
      node, // node,
      node.name, // name,
      node.exclamationToken, // exclamationToken,
      node.type, // type
      functionNode.kind === ts.SyntaxKind.ArrowFunction
        ? ts.factory.updateArrowFunction(
            functionNode, // node
            ts.getModifiers(functionNode), // modifiers
            functionNode.typeParameters, // typeParameters
            newParameters, //parameters
            functionNode.type, // returnType
            functionNode.equalsGreaterThanToken, // equalsGreaterThanToken
            newBlock as ts.ConciseBody // conciseBody
          )
        : ts.factory.updateFunctionExpression(
            functionNode, // node
            ts.getModifiers(functionNode), // modifiers
            functionNode.asteriskToken, // asteriskToken
            functionNode.name, // name
            functionNode.typeParameters, // typeParameters
            newParameters, // parameters
            functionNode.type, // returnType
            newBlock! // block
          )
    )
  }
}

export const visitCallExpression = (node: ts.Node) => {
  console.log('visiting call')
}
