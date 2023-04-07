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
 * $Fixed
 * $HttpApi(method: "GET", path: "/users/{id}")
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
// * $Scheduled(
// *   rate: 'cron(0 12 * * ? *)',
// *   enabled: false,
// *   inputTransfomer: {
// *     inputPathsMap: { eventTime: '$.time' },
// *     inputTemplate: '{"time": <eventTime>, "key1": "value1"}'
// *   })
/**
 * $Fixed
 * $Scheduled(rate: 'cron(0 12 * * ? *)', enabled: false, inputTransfomer: { inputPathsMap: { eventTime: '$.time' }, inputTemplate: '{"time": <eventTime>, "key1": "value1"}' })
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
