import ts from 'typescript'

export const isNodeExported = (node: ts.Node): boolean => {
  const modifierFlags = ts.getCombinedModifierFlags(node as ts.Declaration)
  return (modifierFlags & ts.ModifierFlags.Export) !== 0
}

export const isFunctionAsync = (node: ts.FunctionDeclaration): boolean => {
  const modifierFlags = ts.getCombinedModifierFlags(node)
  return (modifierFlags & ts.ModifierFlags.Async) !== 0
}

/** Checks if the node has a real position in the AST */
export const isNodeReal = (node: ts.Node | undefined): boolean => {
  return node ? node.pos !== -1 : false
}

export function findFunctionInFile(
  node: ts.SourceFile,
  nodeName: string
): ts.FunctionDeclaration | undefined {
  return node.statements.find((statement) => {
    return (
      ts.isFunctionDeclaration(statement) &&
      statement.name?.getText() === nodeName
    )
  }) as ts.FunctionDeclaration | undefined
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
              ts.factory.createStringLiteral('Invalid request.')
            ),
          ],
          true
        ),
      ]
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
export const buildReturnExpression = (
  node: ts.ReturnStatement
): ts.ObjectLiteralExpression => {
  const statusCode = ts.factory.createPropertyAssignment(
    'statusCode',
    ts.factory.createNumericLiteral(node.expression ? 200 : 400)
  )

  const body = ts.factory.createPropertyAssignment(
    'body',
    buildJsonStringifyExpression(node.expression)
  )

  return ts.factory.createObjectLiteralExpression([statusCode, body], true)
}
