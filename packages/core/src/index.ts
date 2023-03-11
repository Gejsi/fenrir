import { transpile } from './transpile'

console.log()

transpile({
  files: ['input/source.ts'],
  serverlessConfig: 'input/serverless.yml',
  outputDirectory: 'output',
})
