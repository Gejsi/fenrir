import type { CustomTransformer } from '../src/transpile'

const transformer: CustomTransformer<'S3Bucket', { foo: number }> = (
  node,
  context,
  annotation
) => {
  console.log('transforming')
}

export default transformer
