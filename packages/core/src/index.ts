import { transpile } from './transpile'

console.log()

transpile({
  files: ['input/fetch.ts'],
  serverlessConfigPath: 'input/serverless.yml',
  outputDirectory: 'output',
})
