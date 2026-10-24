import { getChats, getChatHistory, type HistoryMessage } from '@/shared/api'
import type { InstanceConnection } from '@/shared/config'

// Credentials stay in request closures; cache keys contain only resource identity.
export function chatsRequest(connection: InstanceConnection) {
  return ({ signal }: { signal: AbortSignal }) => getChats(connection, signal)
}

export function historyRequest(
  connection: InstanceConnection,
  chatId: string,
  cachedMessages: () => HistoryMessage[],
) {
  return async ({ signal }: { signal: AbortSignal }) => {
    const history = await getChatHistory(
      connection,
      { chatId, count: 100 },
      signal,
    )
    // A notification can arrive while history is loading. Keep it before acknowledging it.
    const merged = new Map(
      [...cachedMessages(), ...history].map((message) => [
        message.idMessage,
        message,
      ]),
    )
    return [...merged.values()]
      .map((message) => ({
        ...message,
        textMessage: message.textMessage ?? message.extendedTextMessage?.text,
      }))
      .filter(
        (message) =>
          ['textMessage', 'extendedTextMessage'].includes(
            message.typeMessage,
          ) && typeof message.textMessage === 'string',
      )
      .sort((a, b) => a.timestamp - b.timestamp)
  }
}
