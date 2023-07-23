import { transpile } from '../src/transpile'

async function main() {
  await transpile('input/fenrir.config.json')
  console.log('Finished transpiling')
}

main()
