import ts from 'typescript'
import { parse as parseFileName } from 'path'
import { ServerlessConfigFunctions } from '../transpile'
import type { AnnotationArguments } from '../annotations'

export function scheduledTransfomer(
  nodeName: string,
  sourceFile: ts.SourceFile,
  functionDetails: ServerlessConfigFunctions,
  annotationArgs: AnnotationArguments<'Scheduled'> | undefined
): void {
  if (!annotationArgs || !annotationArgs.rate) {
    // TODO: prettify this diagnostic with line diagnostics
    console.error(`$Scheduled must receive the 'rate' parameter.`)
    process.exit(1)
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
