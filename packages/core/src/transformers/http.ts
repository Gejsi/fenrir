import ts from 'typescript'
import { parse as parseFileName } from 'path'
import { ServerlessConfigFunctions } from '../transpile'
import type { AnnotationArguments } from '../annotations'
import { reportErrorAt } from '../report'

export function httpTransfomer(
  node: ts.FunctionDeclaration,
  nodeName: string,
  sourceFile: ts.SourceFile,
  functionDetails: ServerlessConfigFunctions,
  annotationArgs: AnnotationArguments<'HttpApi'> | undefined
): void {
  if (!annotationArgs || !annotationArgs.method || !annotationArgs.path) {
    return reportErrorAt(
      "'$HttpApi' must receive both 'method' and 'path' as parameters",
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
          httpApi: {
            ...annotationArgs,
          },
        },
      ],
    })
  } else {
    details.events.push({
      httpApi: {
        ...annotationArgs,
      },
    })
  }
}
