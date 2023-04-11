import ts from 'typescript'

export const isNodeExported = (node: ts.Node): boolean => {
  const modifierFlags = ts.getCombinedModifierFlags(node)
  return (modifierFlags & ts.ModifierFlags.Export) !== 0
}

export const isNodeAsync = (node: ts.FunctionDeclaration): boolean => {
  const modifierFlags = ts.getCombinedModifierFlags(node)
  return (modifierFlags & ts.ModifierFlags.Async) !== 0
}

export function getLocalVariables(
  node: ts.FunctionDeclaration
): Record<string, true> {
  const locals: Record<string, true> = {}

  function visit(currentNode: ts.Node) {
    if (ts.isIdentifier(currentNode)) {
      locals[currentNode.text] = true
    } else {
      ts.forEachChild(currentNode, visit)
    }
  }

  ts.forEachChild(node, visit)

  return locals
}

/**
 * Makes an expression like: `JSON.parse(event.x)`
 */
const buildJsonParseExpression = (
  parameterName: ts.BindingName
): ts.Expression => {
  return ts.factory.createCallExpression(
    ts.factory.createPropertyAccessExpression(
      ts.factory.createIdentifier('JSON'), // expression
      ts.factory.createIdentifier('parse') // memberName
    ),
    undefined, // typeArguments
    [
      ts.factory.createPropertyAccessExpression(
        ts.factory.createIdentifier('event'), // expression
        ts.factory.createIdentifier(parameterName.getText()) // memberName
      ),
    ]
  )
}

/**
 * Transforms function parameters into property-access expressions:
 * ```
 * // from
 * function foo(x: Type) {}
 * ```
 * ```
 * // into
 * function foo() {
 *   const first: Type = JSON.parse(event.x)
 * }
 * ```
 */
export const buildEventStatementList = (
  parameters: ts.ParameterDeclaration[]
) => {
  return parameters.map((parameter) => {
    return ts.factory.createVariableStatement(
      undefined, // modifiers
      ts.factory.createVariableDeclarationList(
        [
          ts.factory.createVariableDeclaration(
            ts.factory.createIdentifier(parameter.name.getText()), // name
            undefined, // exclamation token
            parameter.type, // type
            buildJsonParseExpression(parameter.name) // initializer
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
  expression: ts.Expression
): ts.Expression => {
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
 * Transforms return statements into object-literals:
 * ```
 * // from
 * return x
 * ```
 * ```
 * // into
 * return {
 *  statusCode: 200,
 *  body: JSON.stringify(x)
 * }
 * ```
 */
// FIX: fix naked returns
export const buildReturnExpression = (
  node: ts.ReturnStatement
): ts.ObjectLiteralExpression => {
  const statusCode = ts.factory.createPropertyAssignment(
    'statusCode',
    ts.factory.createNumericLiteral(200)
  )

  const body =
    node.expression &&
    ts.factory.createPropertyAssignment(
      'body',
      buildJsonStringifyExpression(node.expression)
    )

  const properties: ts.ObjectLiteralElementLike[] = []
  properties.push(statusCode)
  body && properties.push(body)

  return ts.factory.createObjectLiteralExpression(properties, true)
}
