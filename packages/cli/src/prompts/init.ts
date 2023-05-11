import * as prompt from '@clack/prompts'
import { setTimeout } from 'node:timers/promises'
import color from 'ansi-colors'
import { extname } from 'path'
import transpile from 'fenrir-core'

export const init = async () => {
  console.clear()

  prompt.intro(`${color.bgCyan(color.black(' fenrir '))}`)

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
      outputPath: () =>
        prompt.text({
          message:
            "How should the generated folder be named? (default: 'functions')",
          placeholder: 'output',
        }),
    },
    {
      onCancel: () => {
        prompt.cancel('Operation cancelled.')
        process.exit(0)
      },
    }
  )

  const s = prompt.spinner()
  s.start('Transpiling some code...')
  // transpile({
  //   files: project.files,
  //   serverlessConfigPath: project.slsPath,
  //   outputDirectory: project.outputPath,
  // })
  s.stop('Finished transpiling and generated metadata.')

  let nextSteps = `cd ${project.outputPath}        \n${
    project.outputPath ? '' : 'pnpm install\n'
  }pnpm dev`

  prompt.note(nextSteps, 'Next steps.')

  prompt.outro(
    `Problems? Open an issue: ${color.underline(
      color.cyan('https://github.com/Gejsi/fenrir/issues')
    )}`
  )

  return project
}
