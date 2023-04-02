import ts from 'typescript'
import { visitFunction } from '../visit'
import { parse as parseFileName } from 'path'
import { ServerlessConfigFunctions } from '../transpile'

export function fixedTransfomer(
  node: ts.SignatureDeclaration,
  nodeName: string,
  context: ts.TransformationContext,
  sourceFile: ts.SourceFile,
  functionDetails: ServerlessConfigFunctions
): ts.Node | undefined {
  functionDetails.set(nodeName, {
    handler: parseFileName(sourceFile.fileName).name + '.' + nodeName,
  })

  // detect if this node is a normal function
  if (node.kind === ts.SyntaxKind.FunctionDeclaration)
    return visitFunction(node, context)
}
