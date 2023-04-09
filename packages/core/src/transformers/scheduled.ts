import ts from 'typescript'
import { parse as parseFileName } from 'path'
import { ServerlessConfigFunctions } from '../transpile'
import type { AnnotationArguments } from '../annotations'
import { reportErrorAt } from '../report'

export function scheduledTransfomer(
  node: ts.FunctionDeclaration,
  nodeName: string,
  sourceFile: ts.SourceFile,
  functionDetails: ServerlessConfigFunctions,
  annotationArgs: AnnotationArguments<'Scheduled'> | undefined
): void {
  if (!annotationArgs || !annotationArgs.rate) {
    return reportErrorAt(
      "$Scheduled must receive the 'rate' parameter",
      nodeName,
      node
    )
  }

  const details = functionDetails.get(nodeName)

  if (!details || !details.events || !details.events.length) {
    functionDetails.set(nodeName, {
      handler: parseFileName(sourceFile.fileName).name + '.' + nodeName,
      events: [
        {
          schedule: {
            ...annotationArgs,
          },
        },
      ],
    })
  } else {
    details.events.push({
      schedule: {
        ...annotationArgs,
      },
    })
  }
}
