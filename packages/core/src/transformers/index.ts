import ts from 'typescript'
import { TOP_LEVEL_ANNOTATIONS } from '../annotations'
import { isNodeExported } from '../node'
import { reportTopLevelWarning } from '../report'
import { scanAnnotation } from '../scan'
import type { ServerlessConfigFunctions } from '../transpile'
import { fixedTransfomer } from './fixed'
import { httpTransfomer } from './http'

function mainTransfomer(
  node: ts.Node,
  checker: ts.TypeChecker,
  context: ts.TransformationContext,
  sourceFile: ts.SourceFile,
  functionDetails: ServerlessConfigFunctions
): ts.Node | undefined {
  // Only consider exported nodes
  if (!isNodeExported(node)) return

  // Only consider function-like nodes
  if (!ts.isFunctionDeclaration(node)) return

  const symbol = node.name && checker.getSymbolAtLocation(node.name)
  if (!symbol) return

  const comments = ts
    .displayPartsToString(symbol.getDocumentationComment(checker))
    .split('\n')
    .filter((c) => c.startsWith('$'))

  let res: ts.Node | undefined

  for (let i = 0; i < comments.length; i++) {
    const comment = comments[i]
    if (!comment) continue

    const parsedAnnotation = scanAnnotation(comment, symbol.getName(), node)
    if (!parsedAnnotation) continue

    if (i === 0 && !(parsedAnnotation.name in TOP_LEVEL_ANNOTATIONS)) {
      reportTopLevelWarning(sourceFile, node.getStart(), parsedAnnotation.name)
      return
    }

    if (parsedAnnotation.name === 'Fixed') {
      res = fixedTransfomer(
        node,
        symbol.getName(),
        context,
        sourceFile,
        functionDetails
      )
    } else if (parsedAnnotation.name === 'HttpEvent') {
      httpTransfomer(
        symbol.getName(),
        sourceFile,
        functionDetails,
        parsedAnnotation.args
      )
    }
  }

  return res
}

/** This transformer maps all sub-transformers*/
export function superTransformer(
  checker: ts.TypeChecker,
  functionDetails: ServerlessConfigFunctions
): ts.TransformerFactory<ts.SourceFile> {
  return (context) => (sourceFile) => {
    const visitor: ts.Visitor = (node) => {
      const res = mainTransfomer(
        node,
        checker,
        context,
        sourceFile,
        functionDetails
      )

      // if the function transformation was successful, return the new node...
      if (res) return res

      // ...otherwise, keep traversing the AST
      return ts.visitEachChild(node, visitor, context)
    }

    return ts.visitNode(sourceFile, visitor)
  }
}
