import ts from 'typescript'
import { buildEventStatementList, buildReturnExpression } from './node'

const updateFunctionBody: ts.Visitor = (node) => {
  if (ts.isReturnStatement(node))
    return ts.factory.updateReturnStatement(node, buildReturnExpression(node))

  return node
}

type FunctionNode = {
  parameters: ts.ParameterDeclaration[]
  block?: ts.Block
}

const updateFunction = (
  node: ts.FunctionDeclaration,
  context: ts.TransformationContext
): FunctionNode => {
  const functionNode: FunctionNode = {
    parameters: [],
    block: undefined,
  }

  ts.forEachChild(node, (currentNode) => {
    if (ts.isParameter(currentNode)) functionNode.parameters.push(currentNode)
    else if (ts.isBlock(currentNode)) {
      functionNode.block = ts.visitEachChild(
        currentNode,
        updateFunctionBody,
        context
      )
    }
  })

  const newParameters = [
    ts.factory.createParameterDeclaration(undefined, undefined, 'event'),
    ts.factory.createParameterDeclaration(undefined, undefined, 'context'),
    ts.factory.createParameterDeclaration(undefined, undefined, 'callback'),
  ]

  let newBlock = functionNode.block
  // if there are parameters to the function,
  // they should be mapped to the `event` cloud function parameter
  if (functionNode.parameters.length && functionNode.block?.statements) {
    const eventStatementList = buildEventStatementList(functionNode.parameters)

    newBlock = ts.factory.createBlock(
      [...eventStatementList, ...functionNode.block.statements],
      true
    )
  }

  return { parameters: newParameters, block: newBlock }
}

export const visitFunction = (
  node: ts.FunctionDeclaration,
  context: ts.TransformationContext
): ts.FunctionDeclaration => {
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
