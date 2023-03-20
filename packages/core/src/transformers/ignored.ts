import ts from 'typescript'
import { isTopLevelNode } from '../node'
import { scanAnnotation } from '../scan'

/**
 * This transformer may sound misleading, but it handles 'Ignored' annotations
 */
export const ignoredTransformer = () => {
  const factory: ts.TransformerFactory<ts.SourceFile> = (context) => {
    return (sourceFile) => {
      const visitor: ts.Visitor = (node) => {
        if (isTopLevelNode(node)) {
          const comment: string | undefined = (node as any)?.jsDoc?.at(
            -1
          )?.comment

          if (comment) {
            const parsedAnnotation = scanAnnotation(comment, undefined, node)
            if (parsedAnnotation?.name === 'Ignored') return
          }

          return node
        }

        return ts.visitEachChild(node, visitor, context)
      }

      return ts.visitNode(sourceFile, visitor)
    }
  }

  return factory
}
