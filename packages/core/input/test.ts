/**
 * $TrackMetrics(namespace: "fio", metricName: "bar", metricValue: firstParam)
 */
export async function t1(firstParam: any, secondParam: any) {
  return firstParam
}

console.log('divider')

/**
 * $Fixed
 * $TrackMetrics(namespace: "foo", metricName: "bar", metricValue: lok)
 */
export async function t2(firstParam: any, secondParam: any) {
  const lok = 40

  const c = (x: number, y: number) => x + y

  return c
}
