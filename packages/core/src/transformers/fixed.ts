import ts from 'typescript'
import { parse as parseFileName } from 'path'
import type { Annotation } from '../annotations'
import { isFunctionAsync, isNodeReal } from '../node'

export function fixedTransfomer(
  node: ts.FunctionDeclaration | undefined,
  context: ts.TransformationContext,
  annotation: Annotation<'Fixed'>
): ts.FunctionDeclaration | undefined {
  if (!node) return
  const nodeName = node.name?.getText()
  if (!nodeName) return

  const details = context.slsFunctionDetails.get(nodeName)
  const handler =
    context.outputDirectory +
    '/' +
    parseFileName(context.sourceFile.fileName).name +
    '.' +
    nodeName

  if (!details || !details.handler) {
    context.slsFunctionDetails.set(nodeName, {
      handler,
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
        const s: ts.Statement[] = []

        ts.forEachChild(outerNode, (innerNode) => {
          if (ts.isReturnStatement(innerNode))
            s.push(
              ts.factory.updateReturnStatement(
                innerNode,
                buildReturnExpression(innerNode)
              )
            )
          else if (ts.isThrowStatement(innerNode))
            s.push(
              ts.factory.createReturnStatement(buildThrowExpression(innerNode))
            )
          else s.push(innerNode as ts.Statement)
        })

        return ts.factory.updateBlock(outerNode, s)
      } else if (ts.isReturnStatement(outerNode)) {
        return ts.factory.updateReturnStatement(
          outerNode,
          buildReturnExpression(outerNode)
        )
      } else if (ts.isThrowStatement(outerNode)) {
        const throwExpression = buildThrowExpression(outerNode)

        if (throwExpression)
          return ts.factory.createReturnStatement(throwExpression)
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

/**
 * Transforms function parameters into property-access expressions:
 * ```
 * // from
 * function foo(x: Type) {}
 * // into
 * function foo() {
 *   const first: Type = event.x
 * }
 * ```
 */
const buildEventStatementList = (parameters: ts.ParameterDeclaration[]) => {
  return parameters.map((parameter) => {
    return ts.factory.createVariableStatement(
      undefined, // modifiers
      ts.factory.createVariableDeclarationList(
        [
          ts.factory.createVariableDeclaration(
            ts.factory.createIdentifier(parameter.name.getText()), // name
            undefined, // exclamation token
            parameter.type, // type
            ts.factory.createIdentifier('event') // initializer
          ),
        ],
        ts.NodeFlags.Const
      )
    )
  })
}

/**
 * Makes an expression like: `JSON.stringify(x)`
 */
const buildJsonStringifyExpression = (
  expression?: ts.Expression
): ts.Expression => {
  // handle guard clauses
  if (!expression) {
    return buildErrorJsonStringifyExpression(
      ts.factory.createStringLiteral('Invalid request.')
    )
  }

  return ts.factory.createCallExpression(
    ts.factory.createPropertyAccessExpression(
      ts.factory.createIdentifier('JSON'),
      ts.factory.createIdentifier('stringify')
    ),
    undefined,
    [expression]
  )
}

/**
 * Makes an expression like: `JSON.stringify({ error: 'foo' })`
 */
const buildErrorJsonStringifyExpression = (
  error: ts.Expression
): ts.Expression => {
  return ts.factory.createCallExpression(
    ts.factory.createPropertyAccessExpression(
      ts.factory.createIdentifier('JSON'),
      ts.factory.createIdentifier('stringify')
    ),
    undefined,
    [
      ts.factory.createObjectLiteralExpression(
        [
          ts.factory.createPropertyAssignment(
            ts.factory.createIdentifier('error'),
            error
          ),
        ],
        true
      ),
    ]
  )
}

/**
 * Transforms return statements into object-literals:
 * ```
 * // from
 * return x
 * // into
 * return {
 *  statusCode: 200,
 *  body: JSON.stringify(x)
 * }
 * ```
 */
const buildReturnExpression = (
  node: ts.ReturnStatement
): ts.ObjectLiteralExpression => {
  const statusCode = ts.factory.createPropertyAssignment(
    'statusCode',
    ts.factory.createNumericLiteral(200)
  )

  const body = ts.factory.createPropertyAssignment(
    'body',
    buildJsonStringifyExpression(node.expression)
  )

  return ts.factory.createObjectLiteralExpression([statusCode, body], true)
}

/**
 * Transforms throw statements into object-literals:
 * ```
 * // from
 * throw new Error('Foo')
 * // into
 * return {
 *  statusCode: 400,
 *  body: JSON.stringify({ error: 'Foo'})
 * }
 * ```
 */
const buildThrowExpression = (
  node: ts.ThrowStatement
): ts.ObjectLiteralExpression | undefined => {
  if (!ts.isNewExpression(node.expression)) return

  const errorExpression = node.expression.arguments?.[0]

  if (!errorExpression) return

  const statusCode = ts.factory.createPropertyAssignment(
    'statusCode',
    ts.factory.createNumericLiteral(400)
  )

  const body = ts.factory.createPropertyAssignment(
    'body',
    buildErrorJsonStringifyExpression(errorExpression)
  )

  return ts.factory.createObjectLiteralExpression([statusCode, body], true)
}
