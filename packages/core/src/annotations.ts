export type AnnotationName = keyof typeof ALL_ANNOTATIONS

export type AnnotationArguments = Record<string, string>

export type Annotation = {
  name: AnnotationName
  args?: AnnotationArguments
}

export const ALL_ANNOTATIONS = {
  Fixed: 'Fixed',
  HttpApi: 'HttpApi',
} as const
