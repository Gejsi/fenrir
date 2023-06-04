import { transpile } from '../src/transpile'

async function main() {
  console.log()
  await transpile('input/fenrir.config.json')
  console.log('Finished transpiling')
}

main()
