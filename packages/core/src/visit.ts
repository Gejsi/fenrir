import ts from 'typescript'
import { buildEventStatementList, buildReturnExpression } from './node'

const updateFunctionBody: ts.Visitor = (node) => {
  if (ts.isReturnStatement(node))
    return ts.factory.updateReturnStatement(node, buildReturnExpression(node))

  return node
}

type FunctionDetails = {
  parameters: ts.ParameterDeclaration[]
  block?: ts.Block
}

const updateFunction = (
  node: ts.FunctionDeclaration | ts.VariableDeclaration,
  context: ts.TransformationContext
): FunctionDetails => {
  const details: FunctionDetails = {
    parameters: [],
    block: undefined,
  }

  ts.forEachChild(node, (currentNode) => {
    if (ts.isParameter(currentNode)) details.parameters.push(currentNode)
    else if (ts.isBlock(currentNode)) {
      details.block = ts.visitEachChild(
        currentNode,
        updateFunctionBody,
        context
      )
    } else if (
      // detect anonymous functions
      ts.isArrowFunction(currentNode) ||
      ts.isFunctionExpression(currentNode)
    ) {
      details.parameters = [...currentNode.parameters]

      details.block = ts.visitEachChild(
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

  let newBlock = details.block
  // if there are parameters to the function,
  // they should be mapped to the `event` cloud function parameter
  if (details.parameters.length && details.block?.statements) {
    const eventStatementList = buildEventStatementList(details.parameters)

    newBlock = ts.factory.createBlock(
      [...eventStatementList, ...details.block.statements],
      true
    )
  }

  return { parameters: newParameters, block: newBlock }
}

export const visitAnonymousFunction = (
  varStatement: ts.VariableStatement,
  varDeclaration: ts.VariableDeclaration,
  context: ts.TransformationContext
) => {
  const { parameters, block } = updateFunction(varDeclaration, context)
  if (
    varDeclaration.initializer &&
    (ts.isArrowFunction(varDeclaration.initializer) ||
      ts.isFunctionExpression(varDeclaration.initializer))
  ) {
    const functionNode = varDeclaration.initializer

    return ts.factory.updateVariableStatement(
      varStatement,
      ts.getModifiers(varStatement),
      ts.factory.updateVariableDeclarationList(varStatement.declarationList, [
        ts.factory.updateVariableDeclaration(
          varDeclaration, // node,
          varDeclaration.name, // name,
          varDeclaration.exclamationToken, // exclamationToken,
          varDeclaration.type, // type
          functionNode.kind === ts.SyntaxKind.ArrowFunction
            ? ts.factory.updateArrowFunction(
                functionNode, // node
                ts.getModifiers(functionNode), // modifiers
                functionNode.typeParameters, // typeParameters
                parameters, //parameters
                functionNode.type, // returnType
                functionNode.equalsGreaterThanToken, // equalsGreaterThanToken
                block as ts.ConciseBody // conciseBody
              )
            : ts.factory.updateFunctionExpression(
                functionNode, // node
                ts.getModifiers(functionNode), // modifiers
                functionNode.asteriskToken, // asteriskToken
                functionNode.name, // name
                functionNode.typeParameters, // typeParameters
                parameters, // parameters
                functionNode.type, // returnType
                block! // block
              )
        ),
      ])
    )
  }
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
