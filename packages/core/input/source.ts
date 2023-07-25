import { query } from '../local'

/**
 * $TrackMetrics(namespace: 'shop', metricName: 'sells', metricValue: size)
 */
export async function processOrder(id) {
  const order = await query(id)
  const size = order.size
  // ...more logic...
  return size
}
