import ts from 'typescript'
import { Annotation } from '../annotations'
import { isFunctionAsync, isNodeReal } from '../node'
import { reportErrorAt } from '../report'

// TODO: support named and default imports
export function trackMetricsTransformer(
  node: ts.FunctionDeclaration | undefined,
  context: ts.TransformationContext,
  annotation: Annotation<'TrackMetrics'>
): ts.SourceFile | undefined {
  if (!node) return
  const nodeName = node.name?.getText()
  if (!nodeName) return

  if (!isFunctionAsync(node))
    return reportErrorAt(
      `'$${annotation.name}' must be applied to an async function`,
      nodeName,
      node
    )

  if (
    !annotation.args ||
    !annotation.args.namespace ||
    !annotation.args.metricName
  ) {
    return reportErrorAt(
      `'$${annotation.name}' must receive 'namespace' and 'metricName' as parameters`,
      nodeName,
      node
    )
  }

  if (
    typeof annotation.args.namespace !== 'string' ||
    typeof annotation.args.metricName !== 'string'
  ) {
    return reportErrorAt(
      `'$${annotation.name}' must receive strings as values for 'namespace' and 'metricName' parameters`,
      nodeName,
      node
    )
  }

  const isLocal = context.locals.get(
    (annotation.args.metricValue as ts.Identifier)?.escapedText as string
  )

  if (
    annotation.args.metricValue &&
    (!ts.isIdentifier(annotation.args.metricValue) || !isLocal)
  ) {
    let errorText = `'$${annotation.name}' can only receive an identifier as\na value for the 'metricValue' parameter like\n`

    for (const [localName] of context.locals) {
      errorText += `'${localName}' | `
    }

    errorText = errorText.substring(0, errorText.length - 3) // - 3 removes the last " | " chars

    return reportErrorAt(errorText, nodeName, node)
  }

  const importSpecifier = 'aws-sdk'
  const importDeclaration = ts.factory.createImportDeclaration(
    undefined,
    ts.factory.createImportClause(
      false,
      undefined,
      ts.factory.createNamedImports([
        ts.factory.createImportSpecifier(
          false,
          undefined,
          ts.factory.createIdentifier('CloudWatch')
        ),
      ])
    ),
    ts.factory.createStringLiteral(importSpecifier),
    undefined
  )

  const newFunction = visitFunction(node, context, annotation)

  // if the cloudwatch import doesn't exist yet
  if (!context.imports.has(importSpecifier)) {
    context.imports.add(importSpecifier)

    return ts.factory.updateSourceFile(context.sourceFile, [
      importDeclaration,
      newFunction,
    ])
  }

  return ts.factory.updateSourceFile(context.sourceFile, [newFunction])
}

function visitFunction(
  node: ts.FunctionDeclaration,
  context: ts.TransformationContext,
  annotation: Annotation<'TrackMetrics'>
): ts.FunctionDeclaration {
  const varStatement = ts.factory.createVariableStatement(
    undefined,
    ts.factory.createVariableDeclarationList(
      [
        ts.factory.createVariableDeclaration(
          '_cloudwatch',
          undefined,
          undefined,
          ts.factory.createNewExpression(
            ts.factory.createIdentifier('CloudWatch'),
            undefined,
            []
          )
        ),
      ],
      ts.NodeFlags.Const
    )
  )

  const awaitedStatement = ts.factory.createExpressionStatement(
    ts.factory.createAwaitExpression(
      ts.factory.createCallExpression(
        ts.factory.createPropertyAccessExpression(
          ts.factory.createCallExpression(
            ts.factory.createPropertyAccessExpression(
              ts.factory.createIdentifier('_cloudwatch'),
              'putMetricData'
            ),
            undefined,
            [
              ts.factory.createObjectLiteralExpression(
                [
                  ts.factory.createPropertyAssignment(
                    'Namespace',
                    ts.factory.createStringLiteral(annotation.args!.namespace)
                  ),

                  ts.factory.createPropertyAssignment(
                    'MetricData',
                    ts.factory.createArrayLiteralExpression(
                      [
                        ts.factory.createObjectLiteralExpression(
                          [
                            ts.factory.createPropertyAssignment(
                              'MetricName',
                              ts.factory.createStringLiteral(
                                annotation.args!.metricName
                              )
                            ),

                            ts.factory.createPropertyAssignment(
                              'Timestamp',
                              ts.factory.createNewExpression(
                                ts.factory.createIdentifier('Date'),
                                undefined,
                                []
                              )
                            ),

                            ts.factory.createPropertyAssignment(
                              'Value',
                              annotation.args!.metricValue ??
                                ts.factory.createNumericLiteral(1)
                            ),
                          ],
                          true
                        ),
                      ],
                      true
                    )
                  ),
                ],
                true
              ),
            ]
          ),
          'promise'
        ),
        undefined,
        []
      )
    )
  )

  // Define a block for environment-aware block transformation
  let awareBlock: ts.Block | undefined

  ts.forEachChild(node, (currentNode) => {
    if (ts.isBlock(currentNode)) {
      awareBlock = ts.visitEachChild(
        currentNode,
        (childNode) => {
          if (
            ts.isVariableStatement(childNode) &&
            isNodeReal(childNode) &&
            childNode.declarationList.declarations[0]?.name.getText() ===
              (annotation.args?.metricValue as ts.Identifier)?.escapedText
          ) {
            return [childNode, varStatement, awaitedStatement]
          }

          return childNode
        },
        context
      )
    }
  })

  // True if the statements were placed under an identifier (excluding function parameters)
  const isAware = awareBlock?.statements.length !== node.body?.statements.length

  return ts.factory.updateFunctionDeclaration(
    node, // node
    ts.getModifiers(node), // modifiers
    node.asteriskToken, // asteriskToken
    node.name, // name
    node.typeParameters, // typeParameters
    node.parameters, // parameters
    node.type, // returnType
    isAware
      ? awareBlock
      : ts.factory.updateBlock(node.body!, [
          varStatement,
          awaitedStatement,
          ...(node.body?.statements ?? []),
        ]) // block
  )
}
