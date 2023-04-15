import ts from 'typescript'
import type { Annotation } from '../annotations'
import { isNodeAsync } from '../node'
import { reportErrorAt } from '../report'
import { SourceFileImports } from '../transpile'

export function trackMetricsTransformer(
  node: ts.FunctionDeclaration,
  imports: SourceFileImports,
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

  const updatedFunction = visitFunction(node, annotation)

  // if the import cloudwatch import doesn't already exist
  if (imports.get(node.getSourceFile().fileName) !== `'${importSpecifier}'`) {
    imports.set(node.getSourceFile().fileName, `'${importSpecifier}'`)

    return ts.factory.updateSourceFile(node.getSourceFile(), [
      importDeclaration,
      updatedFunction,
    ])
  }

  return ts.factory.updateSourceFile(node.getSourceFile(), [updatedFunction])
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
