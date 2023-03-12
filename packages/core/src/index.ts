import { transpile } from './transpile'

console.log()

transpile({
  files: ['input/vanilla.js'],
  serverlessConfig: 'input/serverless.yml',
  outputDirectory: 'output',
})
