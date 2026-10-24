import {
  queryOptions,
  useQuery,
  useQueryClient,
  type QueryClient,
} from '@tanstack/react-query'
import { type ChatItem, type HistoryMessage } from '@/shared/api'
import type { InstanceConnection } from '@/shared/config'
import { chatsRequest, historyRequest } from './requests'

export const chatKeys = {
  all: (id: string) => ['messenger', id] as const,
  chats: (id: string) => ['messenger', id, 'chats'] as const,
  messages: (id: string, chatId: string) =>
    ['messenger', id, 'messages', chatId] as const,
}

export function chatsOptions(connection: InstanceConnection) {
  return queryOptions({
    queryKey: chatKeys.chats(connection.idInstance),
    queryFn: chatsRequest(connection),
    staleTime: Infinity,
  })
}

export function useChats(connection: InstanceConnection) {
  return useQuery(chatsOptions(connection))
}

export function useMessages(
  connection: InstanceConnection,
  chatId: string,
  enabled = true,
) {
  const client = useQueryClient()
  return useQuery({
    queryKey: chatKeys.messages(connection.idInstance, chatId),
    queryFn: historyRequest(
      connection,
      chatId,
      () =>
        client.getQueryData<HistoryMessage[]>(
          chatKeys.messages(connection.idInstance, chatId),
        ) ?? [],
    ),
    enabled,
    staleTime: Infinity,
  })
}

export function addChat(
  client: QueryClient,
  connection: InstanceConnection,
  chat: ChatItem,
) {
  client.setQueryData<ChatItem[]>(
    chatKeys.chats(connection.idInstance),
    (old) =>
      old?.some((item) => item.chatId === chat.chatId)
        ? old
        : [...(old ?? []), chat],
  )
}

export function appendMessage(
  client: QueryClient,
  connection: InstanceConnection,
  message: HistoryMessage,
) {
  const key = chatKeys.messages(connection.idInstance, message.chatId)
  const needsHistory =
    !client.getQueryData(key) ||
    client.getQueryState(key)?.isInvalidated === true
  client.setQueryData<HistoryMessage[]>(key, (old) =>
    old?.some((item) => item.idMessage === message.idMessage)
      ? old
      : [...(old ?? []), message].sort((a, b) => a.timestamp - b.timestamp),
  )
  if (needsHistory) void client.invalidateQueries({ queryKey: key })
}

export function markRead(
  client: QueryClient,
  connection: InstanceConnection,
  chatId: string,
) {
  client.setQueryData<ChatItem[]>(
    chatKeys.chats(connection.idInstance),
    (old) =>
      old?.map((chat) =>
        chat.chatId === chatId ? { ...chat, unreadCount: 0 } : chat,
      ),
  )
}
