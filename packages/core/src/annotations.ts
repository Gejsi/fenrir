type ObjectValues<T> = T[keyof T]

export type AnnotationName = ObjectValues<typeof ANNOTATIONS>

export const ANNOTATIONS = {
  Fixed: 'Fixed',
  HttpGet: 'HttpGet',
  HttpPost: 'HttpPost',
} as const
