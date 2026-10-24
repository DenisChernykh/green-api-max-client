import type { InstanceConnection } from '@/shared/config'
import { request } from './client'
import {
  chatSchema,
  checkAccountSchema,
  deletedNotificationSchema,
  historyMessageSchema,
  instanceStateSchema,
  notificationSchema,
  sendMessageSchema,
  sentMessageSchema,
} from './schemas'
import type { z } from 'zod'

export const getStateInstance = (connection: InstanceConnection) =>
  request(connection, 'getStateInstance', instanceStateSchema)
export const getChats = (
  connection: InstanceConnection,
  signal?: AbortSignal,
) => request(connection, 'getChats', chatSchema.array(), { signal })
export const checkAccount = (
  connection: InstanceConnection,
  body: { phoneNumber: number },
) => request(connection, 'checkAccount', checkAccountSchema, { body })
export const getChatHistory = (
  connection: InstanceConnection,
  body: { chatId: string; count: number },
  signal?: AbortSignal,
) =>
  request(connection, 'getChatHistory', historyMessageSchema.array(), {
    body,
    signal,
  })
export const sendMessage = (
  connection: InstanceConnection,
  body: z.infer<typeof sendMessageSchema>,
) =>
  request(connection, 'sendMessage', sentMessageSchema, {
    body: sendMessageSchema.parse(body),
  })
export const receiveNotification = (
  connection: InstanceConnection,
  signal?: AbortSignal,
) =>
  request(connection, 'receiveNotification', notificationSchema, {
    receiveTimeout: 5,
    signal,
  })
export const deleteNotification = (
  connection: InstanceConnection,
  receiptId: number,
  signal?: AbortSignal,
) =>
  request(connection, 'deleteNotification', deletedNotificationSchema, {
    receiptId,
    signal,
  })
