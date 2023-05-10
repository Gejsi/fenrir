import { CloudWatch as _CloudWatch } from 'aws-sdk'

export async function greet(event: any) {
  const cloudwatch = new _CloudWatch()
  await cloudwatch
    .putMetricData({
      Namespace: 'Dude',
      MetricData: [
        {
          MetricName: 'First',
          Timestamp: new Date(),
          Value: 1,
        },
      ],
    })
    .promise()

  return {
    message: 'Hello world!',
    input: event,
  }
}
