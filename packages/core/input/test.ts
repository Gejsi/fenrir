/**
 * $Fixed
 * $TrackMetrics(namespace: "fio", metricName: "bar", metricValue: event.size)
 */
export async function t1(event: any, context: any) {
  return context
}

/**
 * $Fixed
 * $TrackMetrics(namespace: "fio", metricName: "bar", metricValue: event.size)
 */
export async function t2(event: any, context: any) {
  return event
}
