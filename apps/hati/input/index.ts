import { readFileSync } from 'fs'
import { read } from './read'

async function main() {
  const data = JSON.parse(readFileSync('email.json', 'utf8'))
  const email = await read(data)
  console.log(email)
}

main()
