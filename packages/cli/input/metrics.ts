/**
 * $Fixed
 * $TrackMetrics(namespace: "fio", metricName: "bar", metricValue: b)
 */
export async function foo(firstParam: any, secondParam: any) {
  const b = 1
  const bar = function () {
    const c = a + b
  }
  return bar()
}

/**
 * $TrackMetrics(namespace: "fio", metricName: "bar", metricValue: b)
 * $Fixed
 * $Fixed
 * $TrackMetrics(namespace: "fio", metricName: "bar", metricValue: b)
 * $Scheduled(rate: 'month')
 */
export async function lok(firstParam: any, secondParam: any) {
  const b = 1
  const bar = function () {
    const c = a + b
  }
  return bar()
}
