import { CloudWatch } from 'aws-sdk'
/**
 * $Fixed
 * $TrackMetrics(namespace: "fio", metricName: "bar", metricValue: b)
 */
export async function foo(event) {
  const firstParam: any = event
  const secondParam: any = event
  const b = 1
  const _cloudwatch = new CloudWatch()
  await _cloudwatch
    .putMetricData({
      Namespace: 'fio',
      MetricData: [
        {
          MetricName: 'bar',
          Timestamp: new Date(),
          Value: b,
        },
      ],
    })
    .promise()
  const bar = function () {
    const c = a + b
  }
  return {
    statusCode: 200,
    body: JSON.stringify(bar()),
  }
}
/**
 * $TrackMetrics(namespace: "fio", metricName: "bar", metricValue: b)
 * $Fixed
 * $Fixed
 * $Scheduled(rate: 'month')
 */
export async function lok(event) {
  const firstParam: any = event
  const secondParam: any = event
  const b = 1
  const _cloudwatch = new CloudWatch()
  await _cloudwatch
    .putMetricData({
      Namespace: 'fio',
      MetricData: [
        {
          MetricName: 'bar',
          Timestamp: new Date(),
          Value: b,
        },
      ],
    })
    .promise()
  const _cloudwatch = new CloudWatch()
  await _cloudwatch
    .putMetricData({
      Namespace: 'fio',
      MetricData: [
        {
          MetricName: 'bar',
          Timestamp: new Date(),
          Value: b,
        },
      ],
    })
    .promise()
  const bar = function () {
    const c = a + b
  }
  return {
    statusCode: 200,
    body: JSON.stringify({
      statusCode: 200,
      body: JSON.stringify(bar()),
    }),
  }
}
