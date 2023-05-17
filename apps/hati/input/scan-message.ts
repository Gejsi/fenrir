import Sentiment, { type AnalysisResult } from 'sentiment'
import type { Email } from './read'

type Message = {
  mentions: string[]
  sentiment: Pick<AnalysisResult, 'score' | 'positive' | 'negative'>
}

export function scanMessage(message: Email['message']): Message {
  const words = message
    .split(/(\s+|\n+|^@[^\s]+)/)
    .filter((word) => word.trim() !== '')

  const mentions: Message['mentions'] = []

  for (let word of words) {
    if (word.match(/@\w+/g)) {
      // remove trailing punctuation
      const cleanMention = word.replace(/[^\w]+$/, '')
      mentions.push(cleanMention)
    }
  }

  const { score, positive, negative } = new Sentiment().analyze(message)

  return {
    mentions,
    sentiment: {
      score,
      positive,
      negative,
    },
  }
}
