export type AnnotationName = keyof typeof ALL_ANNOTATIONS

export type AnnotationArguments = Record<string, string>

export type Annotation = {
  name: AnnotationName
  args?: AnnotationArguments
}

export const TOP_LEVEL_ANNOTATIONS = {
  Fixed: 'Fixed',
} as const

export const ALL_ANNOTATIONS = {
  ...TOP_LEVEL_ANNOTATIONS,
  HttpGet: 'HttpGet',
  HttpPost: 'HttpPost',
} as const
