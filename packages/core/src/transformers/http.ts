import ts from 'typescript'
import { parse as parseFileName } from 'path'
import type { Annotation } from '../annotations'
import { reportErrorAt } from '../report'

export function httpTransfomer(
  node: ts.FunctionDeclaration | undefined,
  context: ts.TransformationContext,
  annotation: Annotation<'HttpApi'>
): void {
  if (!node) return
  const nodeName = node.name?.getText()
  if (!nodeName) return

  const annotationArgs = annotation.args

  if (!annotationArgs || !annotationArgs.method || !annotationArgs.path) {
    return reportErrorAt(
      `'$${annotation?.name}' must receive both 'method' and 'path' as parameters`,
      nodeName,
      node
    )
  }

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
      events: [{ httpApi: annotationArgs }],
    })

    return
  }

  if (!details.events || !details.events.length) {
    details.events = [{ httpApi: annotationArgs }]
  } else {
    details.events?.push({
      httpApi: {
        ...annotationArgs,
      },
    })
  }
}
