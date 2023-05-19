import ts from 'typescript'
import { parse as parseFileName } from 'path'
import type { Annotation } from '../annotations'
import { reportErrorAt } from '../report'

export function scheduledTransfomer(
  node: ts.FunctionDeclaration | undefined,
  context: ts.TransformationContext,
  annotation: Annotation<'Scheduled'>
): void {
  if (!node) return
  const nodeName = node.name?.getText()
  if (!nodeName) return

  const annotationArgs = annotation.args

  if (!annotationArgs || !annotationArgs.rate) {
    return reportErrorAt(
      `'$${annotation.name}' must receive the 'rate' parameter`,
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
      events: [{ schedule: annotationArgs }],
    })

    return
  }

  if (!details.events || !details.events.length) {
    details.events = [{ schedule: annotationArgs }]
  } else {
    details.events?.push({
      schedule: {
        ...annotationArgs,
      },
    })
  }
}
