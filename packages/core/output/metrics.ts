import { CloudWatch } from 'aws-sdk';
/**
 * $TrackMetrics(namespace: "fio", metricName: "bar", metricValue: event.size)
 * $Fixed
 */
export async function foo(event, context, callback) {
    const event: any = JSON.parse(event.event);
    const context: any = JSON.parse(event.context);
    const b = 1;
    const bar = function () {
        const c = a + b;
    };
    return {
        statusCode: 200,
        body: JSON.stringify(bar())
    };
}
/**
 * $Fixed
 * $TrackMetrics(namespace: "fio", metricName: "bar", metricValue: event.size)
 */
export async function lok(event: any, context: any) {
    const _cloudwatch = new CloudWatch();
    await _cloudwatch.putMetricData({
        Namespace: "fio",
        MetricData: [
            {
                MetricName: "bar",
                Timestamp: new Date(),
                Value: event.size
            }
        ]
    }).promise();
    const b = 1;
    const bar = function () {
        const c = a + b;
    };
    return bar();
}
