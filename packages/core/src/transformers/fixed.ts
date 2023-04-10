import ts from 'typescript'
import { visitFunction } from '../visit'
import { parse as parseFileName } from 'path'
import { ServerlessConfigFunctions } from '../transpile'
import type { AnnotationArguments } from '../annotations'

export function fixedTransfomer(
  node: ts.FunctionDeclaration,
  context: ts.TransformationContext,
  functionDetails: ServerlessConfigFunctions,
  annotationArgs: AnnotationArguments<'Fixed'> | undefined
): ts.FunctionDeclaration | undefined {
  const nodeName = node.name?.getText()
  if (!nodeName) return

  const details = functionDetails.get(nodeName)

  if (!details || !details.handler) {
    functionDetails.set(nodeName, {
      handler:
        parseFileName(node.getSourceFile().fileName).name + '.' + nodeName,
      ...annotationArgs,
    })
  } else {
    functionDetails.set(nodeName, { ...details, ...annotationArgs })
  }

  return visitFunction(node, context)
}
