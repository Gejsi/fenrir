import { transpile } from './transpile'

console.log()

transpile({
  files: ['input/source.ts'],
  serverlessConfigPath: 'input/serverless.yml',
})
