import ts from 'typescript'
import { parse as parseFileName } from 'path'
import type { Annotation } from '../annotations'
import { reportErrorAt } from '../report'

export function httpTransfomer(
  node: ts.FunctionDeclaration,
  context: ts.TransformationContext,
  annotation: Annotation<'HttpApi'>
): void {
  const nodeName = node.name?.getText()
  if (!nodeName) return

  const annotationArgs = annotation.args

  if (!annotationArgs || !annotationArgs.method || !annotationArgs.path) {
    return reportErrorAt(
      `$${annotation?.name}' must receive both 'method' and 'path' as parameters`,
      nodeName,
      node
    )
  }

  const details = context.slsFunctionDetails.get(nodeName)

  if (!details || !details.handler) {
    context.slsFunctionDetails.set(nodeName, {
      handler:
        parseFileName(node.getSourceFile().fileName).name + '.' + nodeName,
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
