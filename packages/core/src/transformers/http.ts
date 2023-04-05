import ts from 'typescript'
import { parse as parseFileName } from 'path'
import { ServerlessConfigFunctions } from '../transpile'
import type { AnnotationArguments } from '../annotations'

export function httpTransfomer(
  nodeName: string,
  sourceFile: ts.SourceFile,
  functionDetails: ServerlessConfigFunctions,
  annotationArgs: AnnotationArguments<'HttpApi'> | undefined
): void {
  const details = functionDetails.get(nodeName)

  if (!annotationArgs || !annotationArgs.method || !annotationArgs.path) {
    // TODO: prettify this diagnostic
    console.error(
      `$HttpApi must receive both 'method' and 'path' as parameters.`
    )
    process.exit(1)
  }

  if (!details || !details.events || !details.events.length) {
    functionDetails.set(nodeName, {
      handler: parseFileName(sourceFile.fileName).name + '.' + nodeName,
      events: [
        {
          httpApi: {
            method: annotationArgs.method,
            path: annotationArgs.path,
          },
        },
      ],
    })
  } else {
    details.events.push({
      httpApi: {
        method: annotationArgs.method,
        path: annotationArgs.path,
      },
    })
  }
}
