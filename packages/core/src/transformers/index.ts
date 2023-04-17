import ts from 'typescript'
import { annotationNameEquals } from '../annotations'
import { isNodeExported } from '../node'
import { parseAnnotation } from '../parse'
import { trackMetricsTransformer } from './track-metrics'
import { fixedTransfomer } from './fixed'
import { httpTransfomer } from './http'
import { scheduledTransfomer } from './scheduled'
import type { ServerlessConfigFunctions } from '../transpile'

/** This transformer maps all sub-transformers */
export function superTransformer(
  checker: ts.TypeChecker,
  functionDetails: ServerlessConfigFunctions
): ts.TransformerFactory<ts.SourceFile> {
  return (context) => {
    context.slsFunctionDetails = functionDetails

    return (sourceFile) => {
      context.imports = new Set()

      const visitor: ts.Visitor = (node) => {
        if (ts.isImportDeclaration(node))
          context.imports.add(node.moduleSpecifier.getText())

        const res = mainTransfomer(node, checker, context)

        // if the function transformation was successful, return the new node...
        if (res) return res

        // ...otherwise, keep traversing the AST
        return ts.visitEachChild(node, visitor, context)
      }

      return ts.visitNode(sourceFile, visitor)
    }
  }
}

function mainTransfomer(
  node: ts.Node,
  checker: ts.TypeChecker,
  context: ts.TransformationContext
): ts.Node | undefined {
  // Only consider exported function declarations nodes
  if (!isNodeExported(node) || !ts.isFunctionDeclaration(node)) return

  // Define locals for annotations evaluation
  context.locals = (node as any).locals

  const symbol = node.name && checker.getSymbolAtLocation(node.name)
  if (!symbol) return

  const comments = ts
    .displayPartsToString(symbol.getDocumentationComment(checker))
    .split(/\n(?!\s)/)
    .filter((c) => c.startsWith('$'))

  let res: ts.Node | undefined

  for (const comment of comments) {
    const parsedAnnotation = parseAnnotation(
      comment,
      symbol.getName(),
      node,
      context
    )
    if (!parsedAnnotation) continue

    if (annotationNameEquals(parsedAnnotation, 'Fixed')) {
      res = fixedTransfomer(node, context, parsedAnnotation)
    } else if (annotationNameEquals(parsedAnnotation, 'TrackMetrics')) {
      res = trackMetricsTransformer(node, context, parsedAnnotation)
    } else if (annotationNameEquals(parsedAnnotation, 'HttpApi')) {
      httpTransfomer(node, context, parsedAnnotation)
    } else if (annotationNameEquals(parsedAnnotation, 'Scheduled')) {
      scheduledTransfomer(node, context, parsedAnnotation)
    }
  }

  return res
}
