import { extractAnnotations } from './compiler'

const annotations = extractAnnotations('input')

console.log(JSON.stringify(annotations, undefined, 2))
