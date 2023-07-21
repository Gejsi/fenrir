// input.js
import { getOrder } from '../local-file.js'

/**
 * $Fixed
 * $HttpApi(method: "GET", path: "/orders/report")
 */
export async function processOrder(orderId) {
  const order = await getOrder(orderId)

  // Perform some processing logic
  console.log(`Processing order ${orderId}`)

  // maybe even working with the file system
  return order
}

/**
 * $Scheduled(rate: "2 hours")
 */
export async function generateReport() {
  const data = await fetchData()

  // Generate a report based on the data
  console.log('Generating report')
}
