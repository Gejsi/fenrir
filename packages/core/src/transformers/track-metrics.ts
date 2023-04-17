import ts from 'typescript'
import type { Annotation } from '../annotations'
import { isNodeAsync } from '../node'
import { reportErrorAt } from '../report'

export function trackMetricsTransformer(
  node: ts.FunctionDeclaration,
  context: ts.TransformationContext,
  annotation: Annotation<'TrackMetrics'>
): ts.SourceFile | undefined {
  if (!isNodeAsync(node))
    return reportErrorAt(
      `'$${annotation.name}' must be async`,
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

  const newFunction = visitFunction(node, annotation)

  // if the cloudwatch import doesn't exist yet
  if (!context.imports.has(`'${importSpecifier}'`)) {
    context.imports.add(`'${importSpecifier}'`)

    return ts.factory.updateSourceFile(node.getSourceFile(), [
      importDeclaration,
      newFunction,
    ])
  }

  return ts.factory.updateSourceFile(node.getSourceFile(), [newFunction])
}

function visitFunction(
  node: ts.FunctionDeclaration,
  annotation: Annotation<'TrackMetrics'>
): ts.FunctionDeclaration {
  const cloudwatchVar = ts.factory.createVariableDeclaration(
    '_cloudwatch',
    undefined,
    undefined,
    ts.factory.createNewExpression(
      ts.factory.createIdentifier('CloudWatch'),
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
                            // FIX: this panics if metricValue isn't an Expression
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

  return ts.factory.updateFunctionDeclaration(
    node, // node
    ts.getModifiers(node), // modifiers
    node.asteriskToken, // asteriskToken
    node.name, // name
    node.typeParameters, // typeParameters
    node.parameters, // parameters
    node.type, // returnType
    ts.factory.updateBlock(node.body!, [
      varStatement,
      awaitedStatement,
      ...(node.body?.statements ?? []),
    ]) // block
  )
}
