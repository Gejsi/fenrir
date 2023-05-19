import type { Email } from './read'
import type { IncomingHttpHeaders } from 'http'

type Metadata = {
  'content-type': IncomingHttpHeaders['content-type']
  'content-length': IncomingHttpHeaders['content-length']
  body: string
}

type Links = Email['links']

type Unpacked<T> = T extends (infer U)[] ? U : T
type Link = NonNullable<Unpacked<Links>>

type MetadataRecord = Record<Link, Metadata>

/** $Fixed */
export async function scanMetadata(links: Links) {
  if (!links || !links.length) return

  const metadata: MetadataRecord = {}

  for (const link of links) {
    const res = await fetch(link)
    const contentType = res.headers.get('content-type')
    const contentLength = res.headers.get('content-length')
    const body = await res.text()

    metadata[link] = {
      'content-type': contentType ?? undefined,
      'content-length': contentLength ?? undefined,
      body,
    }
  }

  return metadata
}
