import { transpile } from './transpile'

console.log()

transpile({
  files: 'input',
  serverlessConfigPath: 'serverless.yml',
})
