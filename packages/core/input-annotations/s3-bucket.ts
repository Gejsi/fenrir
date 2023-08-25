import type { CustomTransformer } from '../src/transpile'

const transformer: CustomTransformer<'S3Bucket', { a: 'a' }> = (
  node,
  context,
  annotation
) => {}

export default transformer
