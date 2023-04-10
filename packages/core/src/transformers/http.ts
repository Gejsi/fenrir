import ts from 'typescript'
import { parse as parseFileName } from 'path'
import { ServerlessConfigFunctions } from '../transpile'
import type { AnnotationArguments } from '../annotations'
import { reportErrorAt } from '../report'

export function httpTransfomer(
  node: ts.FunctionDeclaration,
  functionDetails: ServerlessConfigFunctions,
  annotationArgs: AnnotationArguments<'HttpApi'> | undefined
): void {
  const nodeName = node.name?.getText()
  if (!nodeName) return

  if (!annotationArgs || !annotationArgs.method || !annotationArgs.path) {
    return reportErrorAt(
      "'$HttpApi' must receive both 'method' and 'path' as parameters",
      nodeName,
      node
    )
  }

  const details = functionDetails.get(nodeName)

  if (!details || !details.handler) {
    functionDetails.set(nodeName, {
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
