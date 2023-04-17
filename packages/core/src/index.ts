import { transpile } from './transpile'

console.log()

transpile({
  files: ['input/test.ts'],
  serverlessConfigPath: 'input/serverless.yml',
  outputDirectory: 'output',
})

console.log('Finished transpiling')
