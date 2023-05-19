import { readFileSync } from 'fs'
import { read } from '../input/read'
import { scanMessage } from '../input/scan-message'
import { scanMetadata } from '../input/scan-metadata'

async function main() {
  const data = JSON.parse(readFileSync('email.json', 'utf8'))

  const email = read(data)
  if (!email) return

  console.log(email)

  const scannedMessage = scanMessage(email.message)
  // console.log(scannedMessage)

  const scannedMetadata = await scanMetadata(email.links)
  // console.log(scannedMetadata)
}

main()
