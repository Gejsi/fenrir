/**
 * $HttpApi(method: "POST", path: "/users/create")
 * $HttpApi(method: "PUT", path: 3)
 */
export function createUser(event: any, context: any) {
  return {
    event,
    context,
  }
}

/**
 * Nice
 * $Fixed
 * Foo
 * $Scheduled(rate: 'cron(0 8 * * ? *)', enabled: ['Three', 2, 'First'], inputTransfomer: { inputPathsMap: { eventTime: '$.time' }, inputTemplate: '{"time": <eventTime>, "key1": "value1"}' })
 */
export function getUser(event: any, context: any) {
  return {
    event,
    context,
  }
}

/**
 * $Fixed
 * $Scheduled(
 *   rate: 'cron(0 11 * * ? *)',
 *   enabled: false,
 *   foo: ['One', 2, 'Three'],
 *   inputTransfomer: {
 *     inputPathap: { eventTime: '$.time' },
 *     inputTemplate: '{"time": <eventTime>, "key1": "value1"}'
 *   },
 *   dude: () => a + b
 *  )
 *  @returns
 */
export async function processOrder(order) {
  const orderData = order

  await processOrderData(orderData)

  return { message: 'Order processed successfully' }
}
