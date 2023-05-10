import { CloudWatch } from "aws-sdk";
/**
 * $Fixed
 * $TrackMetrics(namespace: "fio", metricName: "bar", metricValue: b)
 */
export async function foo(event, context, callback) {
    const firstParam: any = JSON.parse(event.firstParam);
    const secondParam: any = JSON.parse(event.secondParam);
    const b = 1;
    const _cloudwatch = new CloudWatch();
    await _cloudwatch.putMetricData({
        Namespace: "fio",
        MetricData: [
            {
                MetricName: "bar",
                Timestamp: new Date(),
                Value: b
            }
        ]
    }).promise();
    const bar = function () {
        const c = a + b;
    };
    return {
        statusCode: 200,
        body: JSON.stringify(bar())
    };
}
/**
 * $TrackMetrics(namespace: "fio", metricName: "bar", metricValue: b)
 * $Fixed
 * $Fixed
 * $TrackMetrics(namespace: "fio", metricName: "bar", metricValue: b)
 * $Scheduled(rate: 'month')
 */
export async function lok(event, context, callback) {
    const firstParam: any = JSON.parse(event.firstParam);
    const secondParam: any = JSON.parse(event.secondParam);
    const b = 1;
    const _cloudwatch = new CloudWatch();
    await _cloudwatch.putMetricData({
        Namespace: "fio",
        MetricData: [
            {
                MetricName: "bar",
                Timestamp: new Date(),
                Value: b
            }
        ]
    }).promise();
    const _cloudwatch = new CloudWatch();
    await _cloudwatch.putMetricData({
        Namespace: "fio",
        MetricData: [
            {
                MetricName: "bar",
                Timestamp: new Date(),
                Value: b
            }
        ]
    }).promise();
    const bar = function () {
        const c = a + b;
    };
    return {
        statusCode: 200,
        body: JSON.stringify({
            statusCode: 200,
            body: JSON.stringify(bar())
        })
    };
}
