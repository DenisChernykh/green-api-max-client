export {
  getStateInstance,
  getChats,
  checkAccount,
  getChatHistory,
  sendMessage,
  receiveNotification,
  deleteNotification,
} from './max'
export {
  sendMessageSchema,
  type ChatItem,
  type HistoryMessage,
  type IncomingNotification,
} from './schemas'
export { ApiError, errorMessage } from './client'
