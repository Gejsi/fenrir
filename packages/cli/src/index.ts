import { cli } from 'cleye'
import { version } from '../package.json'
import { init } from './prompts/init'

const argv = cli({
  name: 'fen',
  version,
  help: {
    description: 'Fenrir simplifies the development of serverless functions.',
  },

  flags: {
    init: {
      type: Boolean,
      alias: 'i',
      description: 'Initialize the transpiler with custom options',
      default: false,
    },
  },
})

if (argv.flags.init) {
  init().catch((err) => {
    console.error(err)
    process.exit(1)
  })
}
