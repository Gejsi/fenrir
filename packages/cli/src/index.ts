import { cli } from 'cleye'
import { version } from '../package.json'
import { init } from './init'
import transpile from 'fenrir-core'

const argv = cli({
  name: 'fen',
  version,
  help: {
    description: 'Fenrir simplifies the development of serverless functions.',
  },

  flags: {
    generate: {
      type: String,
      alias: 'g',
      description:
        'Start transpiling by providing the folder which contains `fenrir.config.json`',
      default: '.',
    },
  },

  commands: [init],
})

if (!argv.command) {
  if (argv.flags.generate) {
    transpile(`${argv.flags.generate}/fenrir.config.json`)
  } else {
    console.error('Please provide a valid folder for the `--generate` flag.')
    process.exit(1)
  }
}
