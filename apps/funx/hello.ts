export async function greet(event: any) {
  return {
    message: 'Hello world!',
    input: event,
  }
}
