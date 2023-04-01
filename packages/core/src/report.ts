import ts from 'typescript'

export const reportSyntaxError = (
  text: string,
  emptyCount: number,
  markerCount: number,
  errorMessage: string,
  nodeName: string | undefined,
  node: ts.Node
) => {
  let errorText = text + '\n'
  errorText += ' '.repeat(emptyCount) + '^'.repeat(markerCount) + '\n'
  errorText += ' '.repeat(emptyCount) + errorMessage + '\n\n'

  const filePath = ts.sys.resolvePath(node.getSourceFile().fileName)
  const { line } = node
    .getSourceFile()
    .getLineAndCharacterOfPosition(node.getStart())

  // FIX: this if statement doesn't work
  if (!nodeName) {
    errorText += `You have provided an ${errorMessage.toLowerCase()} for a call expression defined here\n ${filePath}:${
      line + 1
    }\n`
  } else {
    errorText += `You have provided an ${errorMessage.toLowerCase()} for '${nodeName}' defined here\n ${filePath}:${
      line + 1
    }\n`
  }

  console.log(errorText)
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
