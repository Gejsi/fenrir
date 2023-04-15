import ts from 'typescript'
import { annotationNameEquals } from '../annotations'
import { isNodeExported } from '../node'
import { parseAnnotation } from '../parse'
import type { SourceFileImports, ServerlessConfigFunctions } from '../transpile'
import { trackMetricsTransformer } from './track-metrics'
import { fixedTransfomer } from './fixed'
import { httpTransfomer } from './http'
import { scheduledTransfomer } from './scheduled'

function mainTransfomer(
  node: ts.Node,
  checker: ts.TypeChecker,
  context: ts.TransformationContext,
  functionDetails: ServerlessConfigFunctions,
  imports: SourceFileImports
): ts.Node | undefined {
  // Only consider exported function declarations nodes
  if (!isNodeExported(node) || !ts.isFunctionDeclaration(node)) return

  const symbol = node.name && checker.getSymbolAtLocation(node.name)
  if (!symbol) return

  const comments = ts
    .displayPartsToString(symbol.getDocumentationComment(checker))
    .split(/\n(?!\s)/)
    .filter((c) => c.startsWith('$'))

  let res: ts.Node | undefined

  for (const comment of comments) {
    const parsedAnnotation = parseAnnotation(comment, symbol.getName(), node)
    if (!parsedAnnotation) continue

    if (annotationNameEquals(parsedAnnotation, 'Fixed')) {
      res = fixedTransfomer(
        node,
        context,
        functionDetails,
        parsedAnnotation.args
      )
    } else if (annotationNameEquals(parsedAnnotation, 'TrackMetrics')) {
      res = trackMetricsTransformer(node, imports, parsedAnnotation)
    } else if (annotationNameEquals(parsedAnnotation, 'HttpApi')) {
      httpTransfomer(node, functionDetails, parsedAnnotation.args)
    } else if (annotationNameEquals(parsedAnnotation, 'Scheduled')) {
      scheduledTransfomer(node, functionDetails, parsedAnnotation.args)
    }
  }

  return res
}

/** This transformer maps all sub-transformers*/
export function superTransformer(
  checker: ts.TypeChecker,
  functionDetails: ServerlessConfigFunctions,
  imports: SourceFileImports
): ts.TransformerFactory<ts.SourceFile> {
  return (context) => (sourceFile) => {
    const visitor: ts.Visitor = (node) => {
      if (ts.isImportDeclaration(node))
        imports.set(sourceFile.fileName, node.moduleSpecifier.getText())

      const res = mainTransfomer(
        node,
        checker,
        context,
        functionDetails,
        imports
      )

      // if the function transformation was successful, return the new node...
      if (res) return res

      // ...otherwise, keep traversing the AST
      return ts.visitEachChild(node, visitor, context)
    }

    return ts.visitNode(sourceFile, visitor)
  }
}
