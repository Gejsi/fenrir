import ts from 'typescript'
import { parse as parseFileName } from 'path'
import { ServerlessConfigFunctions } from '../transpile'
import type { AnnotationArguments } from '../annotations'

export function httpTransfomer(
  nodeName: string,
  sourceFile: ts.SourceFile,
  functionDetails: ServerlessConfigFunctions,
  annotationArgs: AnnotationArguments | undefined
): void {
  if (!functionDetails.get(nodeName)) {
    functionDetails.set(nodeName, {
      handler: parseFileName(sourceFile.fileName).name + '.' + nodeName,
      events: [
        {
          httpApi: {
            method: annotationArgs?.method!,
            path: annotationArgs?.path!,
          }, // TODO: remove exclamation marks
        },
      ],
    })
  } else {
    functionDetails.get(nodeName)?.events?.push({
      httpApi: {
        method: annotationArgs?.method!,
        path: annotationArgs?.path!,
      }, // TODO: remove also here
    })
  }
}
