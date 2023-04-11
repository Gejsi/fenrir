/**
 * $TrackMetrics(namespace: "fio", metricName: event)
 */
export async function foo(event: any, context: any) {
    var _cloudwatch = new _CloudWatch();
    await _cloudwatch.putMetricData({
        Namespace: "fio",
        MetricData: [
            {
                MetricName: event
            }
        ]
    }).promise();
    const b = 1;
    const bar = function () {
        const c = a + b;
    };
    return bar();
}
