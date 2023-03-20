import ts from 'typescript'
import type { ServerlessConfigFunctions } from '../transpile'
import { fixedTransformer } from './fixed'
import { ignoredTransformer } from './ignored'

const transformers = [ignoredTransformer, fixedTransformer]

/** This transformer maps all sub-transformers*/
export function superTransformer(
  checker: ts.TypeChecker,
  functionDetails: ServerlessConfigFunctions
): ts.TransformerFactory<ts.SourceFile> {
  return (context) => {
    const initializedTransformers = transformers.map((transformer) =>
      transformer(checker, functionDetails)(context)
    )

    return (sourceFile) => {
      return initializedTransformers.reduce((source, transformer) => {
        return transformer(source)
      }, sourceFile)
    }
  }
}
