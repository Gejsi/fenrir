import ts from 'typescript'
import type { Annotation } from '../annotations'
import { isNodeAsync } from '../node'
import { reportErrorAt } from '../report'

export function trackMetricsTransformer(
  node: ts.FunctionDeclaration,
  context: ts.TransformationContext,
  annotation: Annotation<'TrackMetrics'>
): ts.FunctionDeclaration | undefined {
  if (!isNodeAsync(node))
    return reportErrorAt(
      `'$${annotation.name}' must be 'async'`,
      node.name?.getText()!,
      node
    )

  if (
    !annotation.args ||
    !annotation.args.namespace ||
    !annotation.args.metricName
  ) {
    return reportErrorAt(
      `'$${annotation.name}' must receive 'namespace' and 'metricName' as parameters`,
      node.name?.getText()!,
      node
    )
  }

  return visitFunction(node, context, annotation)
}

function visitFunction(
  node: ts.FunctionDeclaration,
  context: ts.TransformationContext,
  annotation: Annotation<'TrackMetrics'>
): ts.FunctionDeclaration {
  const block = updateFunction(node, context, annotation)

  return ts.factory.updateFunctionDeclaration(
    node, // node
    ts.getModifiers(node), // modifiers
    node.asteriskToken, // asteriskToken
    node.name, // name
    node.typeParameters, // typeParameters
    node.parameters, // parameters
    node.type, // returnType
    block // block
  )
}

function updateFunction(
  node: ts.FunctionDeclaration,
  context: ts.TransformationContext,
  annotation: Annotation<'TrackMetrics'>
): ts.Block | undefined {
  // const cloudwatchImport = ts.factory.createImportDeclaration(
  //   undefined,
  //   ts.factory.createImportClause(
  //     false,
  //     undefined,
  //     ts.factory.createNamespaceImport(ts.factory.createIdentifier('AWS'))
  //   ),
  //   ts.factory.createStringLiteral('aws-sdk')
  // )

  const cloudwatchVar = ts.factory.createVariableDeclaration(
    '_cloudwatch',
    undefined,
    undefined,
    ts.factory.createNewExpression(
      ts.factory.createIdentifier('_CloudWatch'),
      undefined,
      []
    )
  )

  const varStatement = ts.factory.createVariableStatement(undefined, [
    cloudwatchVar,
  ])

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
                              'MetricName',
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

  const block = ts.factory.createBlock([varStatement, awaitedStatement], true)

  if (node.body) {
    return ts.factory.updateBlock(node.body, [
      ...block.statements,
      ...node.body.statements,
    ])
  }
}
