import ts from 'typescript'
import { parse as parseFileName } from 'path'
import type { Annotation } from '../annotations'
import { buildEventStatementList, buildReturnExpression } from '../node'

export function fixedTransfomer(
  node: ts.FunctionDeclaration,
  context: ts.TransformationContext,
  annotation: Annotation<'Fixed'>
): ts.FunctionDeclaration | undefined {
  const nodeName = node.name?.getText()
  if (!nodeName) return

  const details = context.slsFunctionDetails.get(nodeName)

  if (!details || !details.handler) {
    context.slsFunctionDetails.set(nodeName, {
      handler:
        parseFileName(node.getSourceFile().fileName).name + '.' + nodeName,
      ...annotation.args,
    })
  } else {
    context.slsFunctionDetails.set(nodeName, { ...details, ...annotation.args })
  }

  return visitFunction(node, context)
}

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

const visitFunction = (
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
