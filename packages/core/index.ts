import { extractAnnotations } from './compiler'

const annotations = extractAnnotations(['input/source.ts'])

console.log(JSON.stringify(annotations, undefined, 2))
