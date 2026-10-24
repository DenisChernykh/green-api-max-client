import { z } from 'zod'
import { connectionSchema, type InstanceConnection } from '@/shared/config'

export class ApiError extends Error {
  readonly status: number
  readonly code: string
  constructor(status: number, code: string) {
    super(code)
    this.status = status
    this.code = code
    this.name = 'ApiError'
  }
}

export async function request<T>(
  connection: InstanceConnection,
  method: string,
  schema: z.ZodType<T>,
  options: {
    body?: unknown
    signal?: AbortSignal
    receiptId?: number
    receiveTimeout?: number
  } = {},
): Promise<T> {
  const { apiUrl, idInstance, apiTokenInstance } =
    connectionSchema.parse(connection)
  const url = new URL(
    `${apiUrl}/waInstance${idInstance}/${method}/${encodeURIComponent(apiTokenInstance)}${options.receiptId !== undefined ? `/${options.receiptId}` : ''}`,
  )
  if (options.receiveTimeout !== undefined)
    url.searchParams.set('receiveTimeout', String(options.receiveTimeout))
  try {
    const response = await fetch(url, {
      method:
        options.receiptId !== undefined
          ? 'DELETE'
          : options.body !== undefined
            ? 'POST'
            : 'GET',
      headers:
        options.body !== undefined
          ? { 'Content-Type': 'application/json' }
          : undefined,
      body:
        options.body !== undefined ? JSON.stringify(options.body) : undefined,
      signal: options.signal
        ? AbortSignal.any([options.signal, AbortSignal.timeout(20000)])
        : AbortSignal.timeout(20000),
      credentials: 'omit',
      referrerPolicy: 'no-referrer',
      redirect: 'error',
    })
    if (!response.ok) throw new ApiError(response.status, 'HTTP_ERROR')
    const result = schema.safeParse(await response.json())
    if (!result.success) throw new ApiError(response.status, 'INVALID_RESPONSE')
    return result.data
  } catch (error) {
    if (options.signal?.aborted) throw error
    if (error instanceof ApiError) throw error
    throw new ApiError(0, 'NETWORK_ERROR')
  }
}

export function errorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.code === 'NOT_AUTHORIZED')
      return 'Авторизуйте инстанс в кабинете GREEN-API и повторите подключение.'
    if (error.code === 'PENDING_PASSWORD')
      return 'Подтвердите пароль MAX в кабинете GREEN-API.'
    if (error.status === 401 || error.status === 403)
      return 'Не удалось подключиться. Проверьте параметры инстанса.'
    if (error.status === 466)
      return 'Достигнут лимит чатов. Выберите существующий чат.'
    if (error.status === 0)
      return 'Нет соединения с GREEN-API. Проверьте адрес API и сеть.'
  }
  return 'Не удалось выполнить запрос. Попробуйте ещё раз.'
}
