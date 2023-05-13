/**
 * $TrackMetrics(namespace: "fio", metricName: "bar", metricValue: firstParam)
 */
export async function t1(firstParam: any, secondParam: any) {
  return 3
}

console.log('divider')

/**
 * $TrackMetrics(namespace: "foo", metricName: "bal", metricValue: lok)
 */
export async function t2(firstParam: any, secondParam: any) {
  const lok = 40

  const c = [1, 2]

  return 2
}
