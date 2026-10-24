import { z } from 'zod'

export const instanceStateSchema = z.object({ stateInstance: z.string() })
export const checkAccountSchema = z.object({
  exist: z.boolean(),
  chatId: z.string(),
  fromCache: z.boolean().optional(),
})
export const chatSchema = z.object({
  chatId: z.string(),
  name: z.string(),
  type: z.string(),
  phoneNumber: z.number().optional(),
  unreadCount: z.number().optional(),
})
export const historyMessageSchema = z.object({
  type: z.enum(['incoming', 'outgoing']),
  idMessage: z.string(),
  timestamp: z.number(),
  typeMessage: z.string(),
  chatId: z.string(),
  textMessage: z.string().optional(),
  extendedTextMessage: z.object({ text: z.string().optional() }).optional(),
  statusMessage: z.string().optional(),
  senderName: z.string().optional(),
})
export const sendMessageSchema = z.object({
  chatId: z.string().min(1),
  message: z.string().trim().min(1).max(4000),
})
export const sentMessageSchema = z.object({ idMessage: z.string().min(1) })
export const notificationSchema = z
  .object({
    receiptId: z.number().int(),
    body: z.object({
      typeWebhook: z.string(),
      timestamp: z.number().optional(),
      idMessage: z.string().optional(),
      senderData: z
        .object({
          chatId: z.string(),
          chatName: z.string().optional(),
          senderName: z.string().optional(),
        })
        .optional(),
      messageData: z
        .object({
          typeMessage: z.string(),
          textMessageData: z.object({ textMessage: z.string() }).optional(),
          extendedTextMessageData: z.object({ text: z.string() }).optional(),
        })
        .optional(),
    }),
  })
  .nullable()
export const deletedNotificationSchema = z.object({
  result: z.boolean(),
  reason: z.string().optional(),
})

export type ChatItem = z.infer<typeof chatSchema>
export type HistoryMessage = z.infer<typeof historyMessageSchema>
export type IncomingNotification = z.infer<typeof notificationSchema>
