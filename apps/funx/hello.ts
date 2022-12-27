type Event = any

export async function greet(event: Event) {
  return {
    message: 'Hello world!',
    input: event,
  }
}
