import ts from 'typescript'
import { parse as parseFileName } from 'path'
import { ServerlessConfigFunctions } from '../transpile'
import type { AnnotationArguments } from '../annotations'
import { reportErrorAt } from '../report'

export function scheduledTransfomer(
  node: ts.FunctionDeclaration,
  functionDetails: ServerlessConfigFunctions,
  annotationArgs: AnnotationArguments<'Scheduled'> | undefined
): void {
  const nodeName = node.name?.getText()
  if (!nodeName) return

  if (!annotationArgs || !annotationArgs.rate) {
    return reportErrorAt(
      "'$Scheduled' must receive the 'rate' parameter",
      nodeName,
      node
    )
  }

  const details = functionDetails.get(nodeName)

  if (!details || !details.handler) {
    functionDetails.set(nodeName, {
      handler:
        parseFileName(node.getSourceFile().fileName).name + '.' + nodeName,
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
