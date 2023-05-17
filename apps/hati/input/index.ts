import { readFileSync } from 'fs'
import { read } from './read'
import { scanMessage } from './scan-message'
import { scanMetadata } from './scan-metadata'

async function main() {
  const data = JSON.parse(readFileSync('email.json', 'utf8'))

  const email = read(data)
  const scannedMessage = scanMessage(email.message)
  const scannedMetadata = await scanMetadata(email.links)
  console.log(scannedMetadata)
}

main()
