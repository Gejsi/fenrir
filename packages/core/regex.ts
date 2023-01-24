// #(\w+)\s*(\((\s*\w+,*\s*\w+\s*)+\))

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

const str = '#Note(, )'

type Annotation = {
  name: string
  args?: string[]
}

type Match =
  | (RegExpMatchArray & {
      groups: { name?: string; args?: string }
      indices: { groups: { name: [number, number]; args: [number, number] } }
    })
  | null

export const parseAnnotation = (text: string): Annotation | undefined => {
  const match = text.match(noteRegex) as Match

  if (!match || !match.groups) return

  // TODO: add diagnostics for names
  // TODO: add annotation name line position in the program
  if ((!match.groups.args && text.includes('(')) || text.includes(')')) {
    console.log()

    const endPos = match.indices.groups.name[1]

    let errorText = text + '\n'
    errorText += ' '.repeat(endPos) + '^'.repeat(text.length - endPos) + '\n'
    errorText += ' '.repeat(endPos) + 'Invalid number of parameters' + '\n'

    console.log(errorText)

    console.log(
      `You have provided parameters with a wrong syntax for '#${match.groups.name}' at...\n`
    )
  }

  const args = match.groups.args
    ?.substring(1, match.groups.args.length - 1)
    .split(',')
    .map((s) => s.trim())

  return {
    name: match.groups.name!,
    args,
  }
}

console.log(parseAnnotation(str))
