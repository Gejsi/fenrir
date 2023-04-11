/**
 * $TrackMetrics(namespace: "MyNamespace", metricName: "MyMetric")
 */
export async function foo(event: any, context: any) {
    var _cloudwatch = new _CloudWatch();
    await _cloudwatch.putMetricData({
        Namespace: "MyNamespace",
        MetricData: [
            {
                MetricName: "MyMetric"
            }
        ]
    }).promise();
    return 2;
}
