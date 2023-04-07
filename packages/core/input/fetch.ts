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
 * $Fixed
 * $HttpApi(method: "GET", path: "/users/{id}")
 */
export function getUser(event: any, context: any) {
  return {
    event,
    context,
  }
}

/**
 * $Scheduled(rate: "cron(0 12 * * ? *)")
 */
export async function processOrder(order) {
  const orderData = order

  await processOrderData(orderData)

  return { message: 'Order processed successfully' }
}
