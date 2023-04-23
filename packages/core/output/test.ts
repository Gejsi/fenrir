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
    return 3;
}
/**
 * $TrackMetrics(namespace: "foo", metricName: "bal", metricValue: lok)
 */
export async function t2(firstParam: any, secondParam: any) {
    const lok = 40;
    const _cloudwatch = new CloudWatch();
    await _cloudwatch.putMetricData({
        Namespace: "foo",
        MetricData: [
            {
                MetricName: "bal",
                Timestamp: new Date(),
                Value: lok
            }
        ]
    }).promise();
    const c = [1, 2];
    return 2;
}
