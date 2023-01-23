// #\w+\(\w+\)
// #\w+\(\w*(,\w*)*\)
// #\w+(\(\w*(,)*\s*\w*\))?
// #\w+(\((\w+(,)*\s*(\w)+)*\))?
export const noteRegex = /#(?<name>\w+)\s*(?<args>\((\s*\w+,*\s*\w+\s*)*\))?/d

// Try the regex at: https://regexr.com/

// #Fixed(     firstParam, dude)
// dolor sit amet Lorem ipsum

// #Fixed(firstParam, secondParam, thirdParam)
// dolor sit amet Lorem ipsum

// #Fixed(firstParam,secondParam)
// #Fixed(firstParam,secondParam)(thirdParam)
// #Fixed(firstParam,)
// #Fixed(,secondParam)
// #Fixed(firstParam)
// #Fixed()
// #Fixed

// #Fixed
// Lorem ipsum
// dolor sit amet
// @borrows 2

// #Fixed(

// #Fixed(,)

// #Fixed)

const s = '#Fixed(firstParam, secondParam)'

type Annotation = {
  name: string
  args: string[]
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

  // TODO: add diagnostics through `match.indices.groups`

  const args = match.groups.args
    .substring(1, match.groups.args.length - 1)
    .split(',')
    .map((s) => s.trim())

  console.log(args)

  return {
    name: match.groups.name!,
    args,
  }
}

const res = parseAnnotation(s)

console.log(res)
