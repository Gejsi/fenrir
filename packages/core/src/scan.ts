import { type Node } from 'typescript'
import {
  type Annotation,
  ALL_ANNOTATIONS,
  type AnnotationArguments,
  type AnnotationName,
} from './annotations'
import { reportSyntaxError } from './report'

const noteRegex =
  /\$(?<name>\w+)\s*(?<args>\((\s*\w+\s*:\s*\w+\s*(,\s*\w+\s*:\s*\w+\s*)*)\))?/d

type Match =
  | (RegExpMatchArray & {
      groups?: { name?: string; args?: string }
      indices: { groups: { name: [number, number]; args: [number, number] } }
    })
  | null

export const scanAnnotation = (
  text: string,
  nodeName: string | undefined,
  node: Node
): Annotation | undefined => {
  const match = text.match(noteRegex) as Match

  if (!match || !match.groups) return

  const { name, args } = match.groups

  // catch name syntax errors
  if (!name || !(name in ALL_ANNOTATIONS)) {
    const [startPos, endPos] = match.indices.groups.name

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

    reportSyntaxError(
      text,
      endPos,
      text.length - endPos,
      'Invalid syntax for parameters',
      nodeName,
      node
    )
  }

  const argsText = args?.replace(/^\s*\(\s*|\s*\)\s*$/g, '') // remove outer parentheses and trim whitespace

  // parse named arguments
  const namedArgs = argsText?.split(/\s*,\s*/).reduce((acc, cur) => {
    const [key, value] = cur.split(/\s*:\s*/)
    if (acc && key && value) acc[key] = value
    return acc
  }, {} as AnnotationArguments)

  return {
    name: name as AnnotationName,
    args: namedArgs,
  }
}
