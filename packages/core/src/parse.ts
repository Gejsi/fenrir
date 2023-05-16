import ts from 'typescript'
import {
  type Annotation,
  ANNOTATIONS,
  type AnnotationArguments,
  type AnnotationName,
} from './annotations'
import { reportSyntaxError } from './report'

const noteRegex =
  // eslint-disable-next-line no-empty-character-class
  /\$(?<name>\w+)\s*(?:\((?<args>[^)(]*(?:\((?:[^)(]*\))*[^)(]*)*)\))?/d

type Match =
  | (RegExpMatchArray & {
      groups?: { name?: string; args?: string }
      indices: { groups: { name: [number, number]; args: [number, number] } }
    })
  | null

export function parseAnnotation(
  text: string,
  nodeName: string | undefined,
  node: ts.FunctionDeclaration
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

  // catch brackets syntax errors
  if (!args && !isSimple) {
    const [, endPos] = match.indices.groups.name

    nodeName &&
      reportSyntaxError(
        text,
        endPos,
        text.length - endPos,
        'Invalid bracket',
        nodeName,
        node
      )
  }

  // remove outer parentheses and trim whitespace
  const argsText = args?.replace(/^\s*\(\s*|\s*\)\s*$/g, '')
  const parsedArgs = parseArguments(argsText)

  // catch args syntax errors
  if (typeof parsedArgs === 'object' && Object.keys(parsedArgs).length === 0) {
    const [, endPos] = match.indices.groups.name

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

  return {
    name: name as AnnotationName,
    args: parsedArgs,
  }
}

function parseArguments<T extends AnnotationName>(
  argsString: string | undefined
): AnnotationArguments<T> | undefined {
  if (!argsString) return

  const sourceFile = ts.createSourceFile(
    '',
    `const temp = { ${argsString} }`,
    ts.ScriptTarget.Latest
  )

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
    const tempValue: Record<string, unknown> = {}

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
