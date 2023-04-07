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
/**
 * $Scheduled(rate: "cron(0 12 * * ? *)")
 * $Scheduled(rate: "cron(0 12 * * ? *)")
 */
export async function processOrder(order) {
    const orderData = order;
    await processOrderData(orderData);
    return { message: 'Order processed successfully' };
}
