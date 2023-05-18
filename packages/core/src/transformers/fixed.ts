import ts from 'typescript'
import { parse as parseFileName } from 'path'
import type { Annotation } from '../annotations'
import {
  buildEventStatementList,
  buildReturnExpression,
  isFunctionAsync,
  isNodeReal,
} from '../node'

export function fixedTransfomer(
  node: ts.FunctionDeclaration | undefined,
  context: ts.TransformationContext,
  annotation: Annotation<'Fixed'>
): ts.FunctionDeclaration | undefined {
  if (!node) return
  const nodeName = node.name?.getText()
  if (!nodeName) return

  const details = context.slsFunctionDetails.get(nodeName)

  if (!details || !details.handler) {
    context.slsFunctionDetails.set(nodeName, {
      handler: parseFileName(context.sourceFile.fileName).name + '.' + nodeName,
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
  else if (ts.isIfStatement(node)) {
    const thenStatement = ts.visitNode(node.thenStatement, (outerNode) => {
      if (ts.isBlock(outerNode)) {
        let s: ts.Statement[] = []

        ts.forEachChild(outerNode, (innerNode) => {
          if (ts.isReturnStatement(innerNode))
            s.push(
              ts.factory.updateReturnStatement(
                innerNode,
                buildReturnExpression(innerNode)
              )
            )
          else s.push(innerNode as ts.Statement)
        })

        return ts.factory.updateBlock(outerNode, s)
      } else if (ts.isReturnStatement(outerNode)) {
        return ts.factory.updateReturnStatement(
          outerNode,
          buildReturnExpression(outerNode)
        )
      }

      return outerNode
    })

    return ts.factory.updateIfStatement(
      node,
      node.expression,
      thenStatement,
      node.elseStatement
    )
  }

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
    if (ts.isParameter(currentNode) && isNodeReal(currentNode))
      functionNode.parameters.push(currentNode)
    else if (ts.isBlock(currentNode)) {
      functionNode.block = ts.visitEachChild(
        currentNode,
        updateFunctionBody,
        context
      )
    }
  })

  let newBlock = functionNode.block
  // if there are parameters to the function,
  // they should be mapped to the `event` cloud function parameter
  if (functionNode.parameters.length && functionNode.block?.statements) {
    const eventStatementList = buildEventStatementList(functionNode.parameters)

    newBlock = ts.factory.updateBlock(functionNode.block, [
      ...eventStatementList,
      ...functionNode.block.statements,
    ])
  }

  const newParameters = [
    ts.factory.createParameterDeclaration(undefined, undefined, 'event'),
    ts.factory.createParameterDeclaration(undefined, undefined, 'context'),
    ts.factory.createParameterDeclaration(undefined, undefined, 'callback'),
  ]

  return { parameters: newParameters, block: newBlock }
}

const visitFunction = (
  node: ts.FunctionDeclaration,
  context: ts.TransformationContext
): ts.FunctionDeclaration => {
  const { parameters, block } = updateFunction(node, context)
  const modifiers = ts.getModifiers(node)?.slice()
  const asyncModifier = ts.factory.createModifiersFromModifierFlags(
    ts.ModifierFlags.Async
  )?.[0]

  if (!isFunctionAsync(node) && asyncModifier) modifiers?.push(asyncModifier)

  return ts.factory.updateFunctionDeclaration(
    node, // node
    modifiers, // modifiers
    node.asteriskToken, // asteriskToken
    node.name, // name
    node.typeParameters, // typeParameters
    parameters, // parameters
    node.type, // returnType
    block // block
  )
}
