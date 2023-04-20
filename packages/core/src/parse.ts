import ts from 'typescript'
import {
  type Annotation,
  ANNOTATIONS,
  type AnnotationArguments,
  type AnnotationName,
} from './annotations'
import { reportErrorAt, reportSyntaxError } from './report'
import { Locals } from './transpile'

/**
 * This regex uses a non-capturing group (?:...) and the | operator to match either a sequence
 * of characters that are not parentheses, or a nested set of parentheses.
 * The nested set of parentheses is matched using a similar recursive pattern,
 * where either a sequence of characters that are not parentheses or
 * another set of parentheses that can be potentially nested inside the current set are matched.
 * The [^()]* part inside the nested parentheses matches any sequence of characters that are not parentheses,
 * and the \([^()]*\) part matches a set of parentheses with potentially nested parentheses inside.
 */
const noteRegex =
  /\$(?<name>\w+)\s*(?<args>\((?:[^()]*|\((?:[^()]*|\([^()]*\))*\))*\))?/d

type Match =
  | (RegExpMatchArray & {
      groups?: { name?: string; args?: string }
      indices: { groups: { name: [number, number]; args: [number, number] } }
    })
  | null

export function parseAnnotation(
  text: string,
  nodeName: string | undefined,
  node: ts.FunctionDeclaration,
  context: ts.TransformationContext
): Annotation | undefined {
  const match = text.match(noteRegex) as Match

  if (!match || !match.groups) return

  const { name, args } = match.groups

  // catch name syntax errors
  if (!name || !(name in ANNOTATIONS)) {
    const [startPos, endPos] = match.indices.groups.name

    nodeName &&
      reportSyntaxError(
        text,
        startPos,
        endPos - startPos,
        'Unknown annotation name',
        nodeName,
        node
      )
  }

  // handles plain `$Note` case
  const isSimple = !text.includes('(') && !text.includes(')')

  // catch args syntax errors
  if (!args && !isSimple) {
    const [_, endPos] = match.indices.groups.name

    nodeName &&
      reportSyntaxError(
        text,
        endPos,
        text.length - endPos,
        'Invalid syntax for annotation parameters',
        nodeName,
        node
      )
  }

  // remove outer parentheses and trim whitespace
  const argsText = args?.replace(/^\s*\(\s*|\s*\)\s*$/g, '')

  return {
    name: name as AnnotationName,
    args: parseArguments(
      name as AnnotationName,
      argsText,
      nodeName,
      node,
      context
    ),
  }
}

function parseArguments<T extends AnnotationName>(
  annotationName: AnnotationName,
  argsString: string | undefined,
  nodeName: string | undefined,
  node: ts.FunctionDeclaration,
  context: ts.TransformationContext
): AnnotationArguments<T> | undefined {
  if (!argsString) return

  const sourceFile = ts.createSourceFile(
    '',
    `const temp = { ${argsString} }`,
    ts.ScriptTarget.Latest
  )

  // Catch arguments syntax errors by evaluating the source code
  try {
    evalContext(sourceFile.getText(), context.locals)
  } catch (e) {
    return reportErrorAt(
      `Check the syntax you provided for '$${annotationName}' parameters`,
      nodeName!,
      node
    )
  }

  const args = {} as AnnotationArguments<T>

  const { properties } = (sourceFile.statements[0] as ts.VariableStatement)
    .declarationList.declarations[0]?.initializer as ts.ObjectLiteralExpression

  for (const prop of properties) {
    if (ts.isPropertyAssignment(prop)) {
      const key = prop.name.getText(sourceFile) as keyof AnnotationArguments<T>
      const value = parseExpression(
        prop.initializer,
        sourceFile
      ) as AnnotationArguments<T>[keyof AnnotationArguments<T>]
      args[key] = value
    }
  }

  return args
}

function evalContext(source: string, locals: Locals): Function {
  const fn = new Function(...locals.keys(), source)
  return fn(...locals.values())
}

function parseExpression(
  expr: ts.Expression,
  sourceFile: ts.SourceFile
): unknown {
  let value

  if (ts.isStringLiteral(expr)) {
    value = expr.text
  } else if (ts.isNumericLiteral(expr)) {
    value = Number(expr.text)
  } else if (expr.kind === ts.SyntaxKind.TrueKeyword) {
    value = true
  } else if (expr.kind === ts.SyntaxKind.FalseKeyword) {
    value = false
  } else if (ts.isArrayLiteralExpression(expr)) {
    value = expr.elements.map((element) => parseExpression(element, sourceFile))
  } else if (ts.isObjectLiteralExpression(expr)) {
    const tempValue: Record<string, any> = {}

    for (const prop of expr.properties) {
      if (ts.isPropertyAssignment(prop)) {
        const key = prop.name.getText(sourceFile)
        tempValue[key] = parseExpression(prop.initializer, sourceFile)
      }
    }

    value = tempValue
  } else {
    // If the initializer has an unsupported type, just store its expression
    value = expr
  }

  return value
}
