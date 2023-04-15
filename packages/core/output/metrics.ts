import { CloudWatch } from 'aws-sdk';
/**
 * $TrackMetrics(namespace: "fio", metricName: "bar", metricValue: event.size)
 */
export async function foo(event: any, context: any) {
    var _cloudwatch = new CloudWatch();
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
/**
 * $TrackMetrics(namespace: "fio", metricName: "bar", metricValue: event.size)
 */
export async function lok(event: any, context: any) {
    var _cloudwatch = new CloudWatch();
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
