/**
 * $TrackMetrics(namespace: "fio", metricName: event)
 */
export async function foo(event: any, context: any) {
  const b = 1
  const bar = function () {
    const c = a + b
  }
  return bar()
}