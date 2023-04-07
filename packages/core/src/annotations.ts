// TODO: use these types
// import type {Schedule} from 'serverless/aws'

export type AnnotationName = keyof typeof ANNOTATIONS

export type AnnotationArguments<T extends AnnotationName> = Record<
  keyof (typeof ANNOTATIONS)[T],
  string
>

export type Annotation<T extends AnnotationName = AnnotationName> = {
  name: AnnotationName
  args?: AnnotationArguments<T>
}

export function annotationNameEquals<T extends AnnotationName>(
  annotation: Annotation<AnnotationName>,
  annotationName: T
): annotation is Annotation<T> {
  return annotation.name === annotationName
}

// TODO: use default params
export const ANNOTATIONS = {
  Fixed: { memory: 1024, timeout: 6 },
  HttpApi: { method: undefined, path: undefined },
  Scheduled: { rate: undefined },
} as const
