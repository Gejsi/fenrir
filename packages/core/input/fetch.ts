/**
 * $Fixed(timeout: 10)
 * $HttpApi(method: "POST", path: "/users/create")
 * $HttpApi(method: "PUT", path: 3)
 */
export function createUser(first: any) {
  return 1
}

/**
 * Nice
 * Foo
 * $Fixed(memorySize: 2048)
 * $Scheduled(rate: 'cron(0 8 * * ? *)', enabled: ['Three', 2, 'First'], inputTransfomer: { inputPathsMap: { eventTime: '$.time' }, inputTemplate: '{"time": <eventTime>, "key1": "value1"}' })
 */
export function getUser(event: any, context: any) {
  return {
    event,
    context,
  }
}

/**
 * $Fixed(timeout: 10)
 * $HttpApi(method: "PUT", path: 3)
 * $Scheduled(
 *   rate: 'cron(0 11 * * ? *)',
 *   enabled: false,
 *   foo: ['One', 2, 'Three'],
 *   inputTransfomer: {
 *     inputPathap: { eventTime: '$.time' },
 *     inputTemplate: '{"time": <eventTime>, "key1": "value1"}'
 *   },
 *  )
 *  @returns
 */
export async function processOrder(order) {
  const orderData = order

  await processOrderData(orderData)

  return { message: 'Order processed successfully' }
}
