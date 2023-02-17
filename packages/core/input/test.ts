/** #Fixed */
export const t1 = server.get('/ping', async () => {
  return 'pong\n'
})

/** #Fixed */
server.listen({ port: 8080 }, (err: any, address: any) => {
  if (err) {
    console.error(err)
    process.exit(1)
  }
  console.log(`Server listening at ${address}`)
})

const a = () => {}

/**
 * #HttpGet
 */
export const b = () => {}

/** #Fixed */
export function bar() {}

/**
 * #Fixed
 * dolor sit amet
 * Lorem ipsum
 * @returns 1
 */
export const c = 3
