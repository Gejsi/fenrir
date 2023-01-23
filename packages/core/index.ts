import { extractAnnotations } from './compiler'

const annotations = extractAnnotations(['input/test.ts'])

console.log(JSON.stringify(annotations, undefined, 2))
