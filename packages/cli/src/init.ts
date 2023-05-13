import * as prompt from '@clack/prompts'
import color from 'ansi-colors'
import { extname } from 'path'
import { writeFileSync } from 'fs'
import { command } from 'cleye'

const initPrompt = async () => {
  console.clear()

  prompt.intro(`${color.bgCyan(color.black(' Fenrir '))}`)

  const project = await prompt.group(
    {
      files: () =>
        prompt.text({
          message:
            "Provide a directory (e.g. 'lambda') or a list of files comma separated (e.g 'lambda/foo.ts', 'lambda/bar.js')",
          placeholder: 'lambda',
          validate: (value) => {
            if (!value) return 'Please enter a path.'
          },
        }),
      slsPath: () =>
        prompt.text({
          message:
            'Provide the `serverless.yml` path. If empty, it will be detected from the directory you previously provided.',
          placeholder: 'lambda/serverless.yml',
          validate: (value) => {
            if (value !== '' && extname(value) !== '.yml')
              return 'Only YAML files are supported.'
          },
        }),
      outputDirectory: () =>
        prompt.text({
          message:
            "How should the generated folder be named? (default: 'functions')",
          placeholder: 'output',
        }),
      configPath: () =>
        prompt.text({
          message:
            'Where should `fenrir.config.json` be created? If empty, it will be placed in the current directory.',
          placeholder: 'lambda',
        }),
    },
    {
      onCancel: () => {
        prompt.cancel('Operation cancelled.')
        process.exit(0)
      },
    }
  )

  writeFileSync(
    `${project.configPath ?? '.'}/fenrir.config.json`,
    JSON.stringify(
      {
        files: project.files.includes(',')
          ? project.files.split(',').map((f) => f.trim())
          : project.files,
        serverlessConfigPath: project.slsPath,
        outputDirectory: project.outputDirectory,
      },
      null,
      2
    )
  )

  let nextSteps = `// transpile your functions: '${project.files}'\n`
  nextSteps += `> fen\n`
  nextSteps += `// ...generates '${
    project.outputDirectory ?? 'functions'
  }' folder`

  prompt.note(nextSteps, 'Next steps.')

  prompt.outro(
    `Problems? Open an issue: ${color.underline(
      color.cyan('https://github.com/Gejsi/fenrir/issues')
    )}`
  )
}

export const init = command(
  {
    name: 'init',
    alias: 'i',

    help: {
      description: 'Initialize the transpiler with custom options',
    },
  },
  () => {
    initPrompt().catch((err) => {
      console.error(err)
      process.exit(1)
    })
  }
)
