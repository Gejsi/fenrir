import ts from 'typescript'
import { fixedTransformer } from './fixed'
import { ignoredTransformer } from './ignored'

const transformers = [fixedTransformer, ignoredTransformer]

/** This transformer maps all sub-transformers*/
export function superTransformer(
  checker: ts.TypeChecker
): ts.TransformerFactory<ts.SourceFile> {
  return (context) => {
    const initializedTransformers = transformers.map((transformer) =>
      transformer(checker)(context)
    )

    return (sourceFile) => {
      return initializedTransformers.reduce((source, transformer) => {
        return transformer(source)
      }, sourceFile)
    }
  }
}
