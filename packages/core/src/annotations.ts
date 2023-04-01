export type AnnotationName = keyof typeof ANNOTATIONS
export type AnnotationArguments = Record<string, string>
export type Annotation = {
  name: AnnotationName
  args?: AnnotationArguments
}

export const ANNOTATIONS = {
  Fixed: 'Fixed',
  HttpGet: 'HttpGet',
  HttpPost: 'HttpPost',
  Ignored: 'Ignored',
} as const
