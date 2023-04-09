import ts from 'typescript'
import { parse as parseFileName } from 'path'

export const reportSyntaxError = (
  text: string,
  emptyCount: number,
  markerCount: number,
  errorMessage: string,
  nodeName: string,
  node: ts.Node
): never => {
  let errorText = text + '\n'
  errorText += ' '.repeat(emptyCount) + '^'.repeat(markerCount) + '\n'
  errorText += ' '.repeat(emptyCount) + errorMessage + '\n\n'
  errorText += `You have provided an ${errorMessage.toLowerCase()}`

  return reportErrorAt(errorText, nodeName, node)
}

export const reportErrorAt = (
  errorMessage: string,
  nodeName: string,
  node: ts.Node
): never => {
  const { dir, base } = parseFileName(node.getSourceFile().fileName)
  const filePath = dir + '/' + base
  const { line } = node
    .getSourceFile()
    .getLineAndCharacterOfPosition(node.getStart())

  let errorText = errorMessage + '\n'
  errorText += `in function '${nodeName}' defined here:\n${filePath}:${
    line + 1
  }`

  console.error(errorText)
  process.exit(1)
}

export const reportDiagnostics = (diagnostics: ts.DiagnosticWithLocation[]) => {
  diagnostics.forEach((diagnostic) => {
    let message = ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n')

    if (diagnostic.file) {
      let { line, character } = ts.getLineAndCharacterOfPosition(
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
