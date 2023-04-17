import { CloudWatch } from "aws-sdk";
/**
 * $TrackMetrics(namespace: "fio", metricName: "bar", metricValue: event.size)
 */
export async function t1(event: any, context: any) {
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
    return a;
}
/**
 * $TrackMetrics(namespace: "fio", metricName: "bar", metricValue: event.size)
 */
export async function t2(event: any, context: any) {
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
    const lol = 40;
    const c = (x: number, y: number) => x + y;
    return b;
}
