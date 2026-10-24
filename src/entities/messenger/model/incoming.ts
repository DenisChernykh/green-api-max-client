import { useQueryClient } from '@tanstack/react-query'
import { useEffect, useEffectEvent, useRef, useState } from 'react'
import {
  receiveNotification,
  deleteNotification,
  type ChatItem,
  type IncomingNotification,
} from '@/shared/api'
import type { InstanceConnection } from '@/shared/config'
import { addChat, appendMessage, chatKeys } from '../api/queries'

export function useIncomingMessages(
  connection: InstanceConnection,
  activeChatId: string | null,
  enabled: boolean,
) {
  const client = useQueryClient()
  const [failed, setFailed] = useState(false)
  const [attempt, setAttempt] = useState(0)
  const seen = useRef(new Set<string>())
  const applyNotification = useEffectEvent(
    (body: NonNullable<IncomingNotification>['body']) => {
      if (
        body.typeWebhook === 'incomingMessageReceived' &&
        ['textMessage', 'extendedTextMessage'].includes(
          body.messageData?.typeMessage ?? '',
        ) &&
        body.senderData &&
        body.idMessage &&
        body.timestamp !== undefined
      ) {
        const text =
          body.messageData?.textMessageData?.textMessage ??
          body.messageData?.extendedTextMessageData?.text
        if (text === undefined) return
        const chatId = body.senderData.chatId
        addChat(client, connection, {
          chatId,
          name:
            body.senderData.chatName ?? body.senderData.senderName ?? chatId,
          type: 'user',
          unreadCount: 0,
        })
        const key = chatKeys.messages(connection.idInstance, chatId)
        const duplicate =
          seen.current.has(body.idMessage) ||
          client
            .getQueryData<Array<{ idMessage: string }>>(key)
            ?.some((message) => message.idMessage === body.idMessage)
        seen.current.add(body.idMessage)
        appendMessage(client, connection, {
          idMessage: body.idMessage,
          timestamp: body.timestamp,
          chatId,
          type: 'incoming',
          typeMessage: 'textMessage',
          textMessage: text,
        })
        if (!duplicate && chatId !== activeChatId) {
          client.setQueryData<ChatItem[]>(
            chatKeys.chats(connection.idInstance),
            (old) =>
              old?.map((chat) =>
                chat.chatId === chatId
                  ? { ...chat, unreadCount: (chat.unreadCount ?? 0) + 1 }
                  : chat,
              ),
          )
        }
      }
    },
  )
  useEffect(() => {
    if (!enabled) return
    const controller = new AbortController()
    let timer: ReturnType<typeof setTimeout>
    async function poll() {
      try {
        const notification = await receiveNotification(
          connection,
          controller.signal,
        )
        if (controller.signal.aborted) return
        if (notification) {
          const { body, receiptId } = notification
          applyNotification(body)
          const ack = await deleteNotification(
            connection,
            receiptId,
            controller.signal,
          )
          if (!ack.result) throw new Error('Notification was not acknowledged')
        }
        if (!controller.signal.aborted)
          timer = setTimeout(() => void poll(), 100)
      } catch {
        if (!controller.signal.aborted) setFailed(true)
      }
    }
    void poll()
    return () => {
      controller.abort()
      clearTimeout(timer)
    }
  }, [connection, client, attempt, enabled])
  return {
    failed,
    retry: () => {
      setFailed(false)
      setAttempt((value) => value + 1)
    },
  }
}
