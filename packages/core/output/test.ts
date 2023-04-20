import { CloudWatch } from "aws-sdk";
/**
 * $TrackMetrics(namespace: "fio", metricName: "bar", metricValue: firstParam)
 */
export async function t1(firstParam: any, secondParam: any) {
    const _cloudwatch = new CloudWatch();
    await _cloudwatch.putMetricData({
        Namespace: "fio",
        MetricData: [
            {
                MetricName: "bar",
                Timestamp: new Date(),
                Value: firstParam
            }
        ]
    }).promise();
    return firstParam;
}
/**
 * $Fixed
 * $TrackMetrics(namespace: "foo", metricName: "bar", metricValue: lok)
 */
export async function t2(firstParam: any, secondParam: any) {
    const _cloudwatch = new CloudWatch();
    await _cloudwatch.putMetricData({
        Namespace: "foo",
        MetricData: [
            {
                MetricName: "bar",
                Timestamp: new Date(),
                Value: lok
            }
        ]
    }).promise();
    const lok = 40;
    const c = (x: number, y: number) => x + y;
    return c;
}
