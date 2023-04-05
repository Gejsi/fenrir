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
 * $HttpApi(method: "DELETE", path: (a, b) => a+b)
 * $HttpApi(method: "DELETE", path: { a: { b: 3 } })
 */
export function getUser(event: any, context: any) {
  return {
    event,
    context,
  }
}
