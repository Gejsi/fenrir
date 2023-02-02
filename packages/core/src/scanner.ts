import { ANNOTATIONS, AnnotationName } from './annotations'

export const noteRegex = /#(?<name>\w+)\s*(?<args>\((\s*\w+,*\s*\w+\s*)+\))?/d

// Try the regex at: https://regexr.com/

// #Note(     firstParam, dude)
// dolor sit amet Lorem ipsum

// #Note(firstParam, secondParam, thirdParam)
// dolor sit amet Lorem ipsum

// #Note(firstParam,secondParam)
// #Note(firstParam,secondParam)(thirdParam)
// #Note(firstParam,)
// #Note(,secondParam)
// #Note(firstParam)
// #Note()
// #Note

// #Note
// Lorem ipsum
// dolor sit amet
// @borrows 2

// #Note(

// #Note(,)

// #Note)

export type AnnotationData = {
  name: AnnotationName
  args?: string[]
}

type Match =
  | (RegExpMatchArray & {
      groups: { name?: string; args?: string }
      indices: { groups: { name: [number, number]; args: [number, number] } }
    })
  | null

const reportSyntaxError = (
  text: string,
  emptyCount: number,
  markerCount: number,
  errorMessage: string
) => {
  let errorText = text + '\n'
  errorText += ' '.repeat(emptyCount) + '^'.repeat(markerCount) + '\n'
  errorText += ' '.repeat(emptyCount) + errorMessage + '\n'

  console.log(errorText)
}

// TODO: add annotation name line position in the program for syntax errors
export const scanAnnotation = (text: string): AnnotationData | undefined => {
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
      'Unknown annotation name'
    )

    console.log(
      `You have provided an unknown annotation name for '#${name}' at...\n`
    )

    process.exit(1)
  }

  // handles plain `#Note` case
  const isSimple = !text.includes('(') && !text.includes(')')

  // catch args syntax errors
  if (!args && !isSimple) {
    const endPos = match.indices.groups.name[1]

    reportSyntaxError(
      text,
      endPos,
      text.length - endPos,
      'Invalid number of parameters'
    )

    console.log(
      `You have provided parameters with a wrong syntax for '#${name}' at...\n`
    )

    process.exit(1)
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
