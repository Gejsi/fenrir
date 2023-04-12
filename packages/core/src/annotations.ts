import type { Schedule, HttpApiEvent, AwsFunctionHandler } from 'serverless/aws'
import type { Expression } from 'typescript'

export type AnnotationName = keyof typeof ANNOTATIONS

export type AnnotationArguments<T extends AnnotationName> =
  (typeof ANNOTATIONS)[T]

export type Annotation<T extends AnnotationName = AnnotationName> = {
  name: T
  args?: AnnotationArguments<T>
}

export const ANNOTATIONS: {
  Fixed: AwsFunctionHandler
  TrackMetrics: {
    namespace: string
    metricName: string
    metricValue: Expression | undefined
  }
  HttpApi: HttpApiEvent
  Scheduled: Schedule
} = {
  Fixed: { handler: '' },
  TrackMetrics: { namespace: '', metricName: '', metricValue: undefined },
  HttpApi: { method: '', path: '' },
  Scheduled: { rate: '' },
}

export function annotationNameEquals<T extends AnnotationName>(
  annotation: Annotation<AnnotationName>,
  annotationName: T
): annotation is Annotation<T> {
  return annotation.name === annotationName
}
