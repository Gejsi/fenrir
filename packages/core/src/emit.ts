import ts from 'typescript'
import { basename } from 'path'

// TODO: get this name as a parameter for the function below
const OUTPUT_DIRNAME = 'output'

export const emitFile = (sourceFile: ts.SourceFile, sourceCode: string) => {
  if (!ts.sys.directoryExists(OUTPUT_DIRNAME)) {
    console.log(
      `The output directory been created at\n${ts.sys.resolvePath(
        OUTPUT_DIRNAME
      )}`
    )
    ts.sys.createDirectory(OUTPUT_DIRNAME)
  }

  const fileName = basename(sourceFile.fileName)

  ts.sys.writeFile(`${OUTPUT_DIRNAME}/${fileName}`, sourceCode)
}
