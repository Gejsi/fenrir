import ts from 'typescript'
import type { AwsFunctionHandler } from 'serverless/aws'
import { isNodeExported } from './node'
import { visitAnonymousFunction, visitFunction } from './visit'
import { parse as parseFileName } from 'path'
import { scanAnnotation } from './scan'

export function transformFixedFunction(
  node: ts.Node,
  checker: ts.TypeChecker,
  context: ts.TransformationContext,
  sourceFile: ts.SourceFile,
  functionDetails: Map<string, AwsFunctionHandler>
): ts.Node | undefined {
  // Only consider exported nodes
  if (!isNodeExported(node)) return

  // `isFunctionLike()` doesn't detect anonymous functions
  // so variables must be visited as well
  if (ts.isFunctionLike(node) || ts.isVariableStatement(node)) {
    const currentNode =
      node.kind === ts.SyntaxKind.VariableStatement
        ? node.declarationList.declarations[0]
        : node
    if (!currentNode) return

    const symbol =
      currentNode.name && checker.getSymbolAtLocation(currentNode.name)
    if (!symbol) return

    const comment = ts
      .displayPartsToString(symbol.getDocumentationComment(checker))
      .split('\n')[0]
    if (!comment) return

    const parsedAnnotation = scanAnnotation(
      comment,
      symbol.getName(),
      currentNode
    )
    if (!parsedAnnotation || parsedAnnotation.name === 'Ignored') return

    // add function details that will be used for emitting `serverless.yml`
    functionDetails.set(symbol.getName(), {
      handler: parseFileName(sourceFile.fileName).name + '.' + symbol.getName(),
    })

    // detect if this node is a normal function
    const isFunction = currentNode.kind === ts.SyntaxKind.FunctionDeclaration
    // detect if this variable is an anonymous function
    const isAnonFunction =
      currentNode.kind === ts.SyntaxKind.VariableDeclaration &&
      ts.isFunctionLike(currentNode.initializer) &&
      node.kind === ts.SyntaxKind.VariableStatement

    if (isFunction) return visitFunction(currentNode, context)
    else if (isAnonFunction)
      return visitAnonymousFunction(node, currentNode, context)
  }
}
