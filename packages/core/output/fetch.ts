/**
 * $HttpApi(method: "POST", path: "/users/create")
 * $HttpApi(method: "PUT", path: 3)
 */
export function createUser(event: any, context: any) {
    return {
        event,
        context
    };
}
/**
 * Nice
 * $Fixed
 * Foo
 * $Scheduled(rate: 'cron(0 12 * * ? *)', enabled: ['Three', 2, 'First'], inputTransfomer: { inputPathsMap: { eventTime: '$.time' }, inputTemplate: '{"time": <eventTime>, "key1": "value1"}' })
 */
export function getUser(event, context, callback) {
    const event: any = JSON.parse(event.event);
    const context: any = JSON.parse(event.context);
    return {
        statusCode: 200,
        body: JSON.stringify({
            event,
            context
        })
    };
}
/**
 * $Fixed
 * $Scheduled(
 *   rate: 'cron(0 11 * * ? *)',
 *   enabled: false,
 *   foo: ['One', 2, 'Three'],
 *   inputTransfomer: {
 *     inputPathsMap: { eventTime: '$.time' },
 *     inputTemplate: '{"time": <eventTime>, "key1": "value1"}'
 *   },
 *  )
 *  @returns
 */
export async function processOrder(event, context, callback) {
    const order = JSON.parse(event.order);
    const orderData = order;
    await processOrderData(orderData);
    return {
        statusCode: 200,
        body: JSON.stringify({ message: 'Order processed successfully' })
    };
}
