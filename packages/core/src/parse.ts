import ts from 'typescript'
import {
  type Annotation,
  ANNOTATIONS,
  type AnnotationArguments,
  type AnnotationName,
} from './annotations'
import { reportSyntaxError } from './report'

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
  node: ts.Node
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
        'Invalid syntax for parameters',
        nodeName,
        node
      )
  }

  // remove outer parentheses and trim whitespace
  const argsText = args?.replace(/^\s*\(\s*|\s*\)\s*$/g, '')

  return {
    name: name as AnnotationName,
    args: parseArguments(argsText),
  }
}

function parseArguments<T extends AnnotationName>(
  argsString: string | undefined
): AnnotationArguments<T> | undefined {
  if (!argsString) return

  const sourceFile = ts.createSourceFile(
    '',
    `const args = { ${argsString} }`,
    ts.ScriptTarget.Latest
  )

  const args = {} as AnnotationArguments<T>

  const { properties } = (sourceFile.statements[0] as ts.VariableStatement)
    .declarationList.declarations[0]?.initializer as ts.ObjectLiteralExpression

  for (const prop of properties) {
    if (ts.isPropertyAssignment(prop)) {
      const key = prop.name.getText(sourceFile) as keyof AnnotationArguments<T>
      const value = prop.initializer.getText(sourceFile)
      args[key] = value
    }
  }

  return args
}
