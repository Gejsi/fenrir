import { sys, type Node } from 'typescript'
import { AnnotationName, ANNOTATIONS } from './annotations'

export const noteRegex = /\$(?<name>\w+)\s*(?<args>\((\s*\w+,*\s*\w+\s*)+\))?/d

// Try the regex at: https://regexr.com/
// $Note(     firstParam, secondParam)
// dolor sit amet Lorem ipsum
// $Note(firstParam, secondParam, thirdParam)
// dolor sit amet Lorem ipsum
// $Note(firstParam,secondParam)
// $Note(firstParam,secondParam)(thirdParam)
// $Note(firstParam,)
// $Note(,secondParam)
// $Note(firstParam)
// $Note()
// $Note
// $Note(
// $Note(,)
// $Note)
// $Note
// Lorem ipsum
// dolor sit amet
// @borrows 2

export type Annotation = {
  name: AnnotationName
  args?: string[]
}

const reportSyntaxError = (
  text: string,
  emptyCount: number,
  markerCount: number,
  errorMessage: string,
  nodeName: string | undefined,
  node: Node
) => {
  let errorText = text + '\n'
  errorText += ' '.repeat(emptyCount) + '^'.repeat(markerCount) + '\n'
  errorText += ' '.repeat(emptyCount) + errorMessage + '\n\n'

  const filePath = sys.resolvePath(node.getSourceFile().fileName)
  const { line } = node
    .getSourceFile()
    .getLineAndCharacterOfPosition(node.getStart())

  if (!nodeName) {
    errorText += `You have provided an ${errorMessage.toLowerCase()} for a call expression defined here\n ${filePath}:${
      line + 1
    }\n`
  } else {
    errorText += `You have provided an ${errorMessage.toLowerCase()} for '${nodeName}' defined here\n ${filePath}:${
      line + 1
    }\n`
  }

  console.log(errorText)
  process.exit(1)
}

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
  if (!name || !(name in ANNOTATIONS)) {
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
    const endPos = match.indices.groups.name[1]

    reportSyntaxError(
      text,
      endPos,
      text.length - endPos,
      'Invalid number of parameters',
      nodeName,
      node
    )
  }

  const parsedArgs = args
    ?.substring(1, args.length - 1)
    .split(',')
    .map((s) => s.trim())

  return {
    name: name as AnnotationName,
    args: parsedArgs,
  }
}
