import { query } from '../local'
import { CloudWatch } from 'aws-sdk'

/**
 * $TrackMetrics(namespace: 'shop', metricName: 'sells', metricValue: size)
 */
export async function processOrder(id) {
  const order = await query(id)
  const size = order.size
  await new CloudWatch()
    .putMetricData({
      Namespace: 'shop',
      MetricData: [
        {
          MetricName: 'sells',
          Timestamp: new Date(),
          Value: size,
        },
      ],
    })
    .promise()
  // ...more logic...
  return size
}
