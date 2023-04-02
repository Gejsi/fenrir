import ts from 'typescript'
import { buildEventStatementList, buildReturnExpression } from './node'

const updateFunctionBody: ts.Visitor = (node) => {
  if (ts.isReturnStatement(node))
    return ts.factory.updateReturnStatement(node, buildReturnExpression(node))

  return node
}

type FunctionInfo = {
  parameters: ts.ParameterDeclaration[]
  block?: ts.Block
}

const updateFunction = (
  node: ts.FunctionDeclaration | ts.VariableDeclaration,
  context: ts.TransformationContext
): FunctionInfo => {
  const info: FunctionInfo = {
    parameters: [],
    block: undefined,
  }

  ts.forEachChild(node, (currentNode) => {
    if (ts.isParameter(currentNode)) info.parameters.push(currentNode)
    else if (ts.isBlock(currentNode)) {
      info.block = ts.visitEachChild(currentNode, updateFunctionBody, context)
    } else if (
      // detect anonymous functions
      ts.isArrowFunction(currentNode) ||
      ts.isFunctionExpression(currentNode)
    ) {
      info.parameters = [...currentNode.parameters]

      info.block = ts.visitEachChild(
        currentNode.body,
        updateFunctionBody,
        context
      ) as ts.Block
    }
  })

  const newParameters = [
    ts.factory.createParameterDeclaration(undefined, undefined, 'event'),
    ts.factory.createParameterDeclaration(undefined, undefined, 'context'),
    ts.factory.createParameterDeclaration(undefined, undefined, 'callback'),
  ]

  let newBlock = info.block
  // if there are parameters to the function,
  // they should be mapped to the `event` cloud function parameter
  if (info.parameters.length && info.block?.statements) {
    const eventStatementList = buildEventStatementList(info.parameters)

    newBlock = ts.factory.createBlock(
      [...eventStatementList, ...info.block.statements],
      true
    )
  }

  return { parameters: newParameters, block: newBlock }
}

export const visitFunction = (
  node: ts.FunctionDeclaration,
  context: ts.TransformationContext
) => {
  const { parameters, block } = updateFunction(node, context)

  return ts.factory.updateFunctionDeclaration(
    node, // node
    ts.getModifiers(node), // modifiers
    node.asteriskToken, // asteriskToken
    node.name, // name
    node.typeParameters, // typeParameters
    parameters, // parameters
    node.type, // returnType
    block // block
  )
}
