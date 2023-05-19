import { Lambda } from 'aws-sdk'
import { readFileSync } from 'fs'

const lambda = new Lambda({
  endpoint: 'http://localhost:3002',
  region: 'eu-central-1',
})

const retrieveContent = (payload: Lambda._Blob, content: any) => {
  return JSON.stringify(
    JSON.parse(JSON.parse(payload.toString()).body)[content]
  )
}

async function main() {
  const data = readFileSync('email.json', 'utf8')

  const { Payload: emailPayload } = await lambda
    .invoke({ FunctionName: 'hati-dev-read', Payload: data })
    .promise()

  if (!emailPayload) return

  const message = retrieveContent(emailPayload, 'message')
  const links = retrieveContent(emailPayload, 'links')

  const { Payload: messagePayload } = await lambda
    .invoke({ FunctionName: 'hati-dev-scanMessage', Payload: message })
    .promise()

  // console.log('Scanned message: ', JSON.parse(messagePayload!.toString()))

  const { Payload: metadataPayload } = await lambda
    .invoke({ FunctionName: 'hati-dev-scanMetadata', Payload: links })
    .promise()

  // console.log('Scanned metadata: ', JSON.parse(metadataPayload!.toString()))
}

main()
