import ts from 'typescript'
import { visitFunction } from '../visit'
import { parse as parseFileName } from 'path'
import { ServerlessConfigFunctions } from '../transpile'

export function fixedTransfomer(
  node: ts.FunctionDeclaration,
  nodeName: string,
  context: ts.TransformationContext,
  sourceFile: ts.SourceFile,
  functionDetails: ServerlessConfigFunctions
): ts.FunctionDeclaration | undefined {
  functionDetails.set(nodeName, {
    handler: parseFileName(sourceFile.fileName).name + '.' + nodeName,
  })

  return visitFunction(node, context)
}
