import ts from 'typescript'
import { parse as parseFileName } from 'path'
import { stringify as stringifyYaml } from 'yaml'

export const reportSyntaxError = (
  text: string,
  emptyCount: number,
  markerCount: number,
  errorMessage: string,
  nodeName: string,
  context: ts.TransformationContext
): never => {
  let errorText = text + '\n'
  errorText += ' '.repeat(emptyCount) + '^'.repeat(markerCount) + '\n'
  errorText += ' '.repeat(emptyCount) + errorMessage + '\n\n'
  errorText += `You have provided an ${errorMessage.toLowerCase()}`

  return reportErrorAt(errorText, nodeName, context)
}

export const reportErrorAt = (
  errorMessage: string,
  nodeName: string,
  context: ts.TransformationContext
): never => {
  const { dir, base } = parseFileName(context.sourceFile.fileName)
  const filePath = dir + '/' + base

  const { line } = context.sourceFile.getLineAndCharacterOfPosition(
    context.nodeStartingPosition
  )

  let errorText = errorMessage + '\n'
  errorText += `in function '${nodeName}' defined here:\n`
  errorText += `--> ${filePath}:${line + 1}`

  console.error(errorText)
  process.exit(1)
}

export const reportDiagnostics = (diagnostics: ts.DiagnosticWithLocation[]) => {
  diagnostics.forEach((diagnostic) => {
    const message = ts.flattenDiagnosticMessageText(
      diagnostic.messageText,
      '\n'
    )

    if (diagnostic.file) {
      const { line, character } = ts.getLineAndCharacterOfPosition(
        diagnostic.file,
        diagnostic.start!
      )
      console.log(
        `${diagnostic.file.fileName} (${line + 1},${character + 1}): ${message}`
      )
    } else {
      console.log(message)
    }
  })
}

export const reportMissingServerlessConfig = (error: string) => {
  let errorText = error + '\n'
  errorText +=
    'Please, provide a valid configuration file. You can use the following reference:\n\n'

  errorText += stringifyYaml({
    service: 'my-service-name',
    provider: {
      name: 'aws',
      runtime: 'nodejs14.x',
      region: 'us-east-1',
    },
  })

  console.log(errorText)
}
