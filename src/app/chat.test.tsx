import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { IncomingNotification } from '@/shared/api'
import { App } from './app'

const apiUrl = 'https://1100.api.green-api.com'
const credentials = {
  apiUrl,
  idInstance: '1234567890',
  apiTokenInstance: 'test-only-token',
}
const chat = { chatId: '456', name: 'Собеседник', type: 'user', unreadCount: 0 }
const response = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
let state = 'authorized'
let failSend = false
let failAck = false
let queue: Array<IncomingNotification> = []
const fetchMock = vi.fn<typeof fetch>()

beforeEach(() => {
  state = 'authorized'
  failSend = false
  failAck = false
  queue = []
  fetchMock.mockReset().mockImplementation(async (input, init) => {
    const url = new URL(String(input))
    expect(url.origin).toBe(apiUrl)
    const method = url.pathname.split('/')[2]
    switch (method) {
      case 'getStateInstance':
        return response({ stateInstance: state })
      case 'getChats':
        return response([chat])
      case 'getChatHistory':
        return response([])
      case 'checkAccount':
        return response({ exist: true, chatId: '789' })
      case 'sendMessage':
        return failSend ? response({}, 500) : response({ idMessage: 'out-1' })
      case 'receiveNotification':
        return response(queue[0] ?? null)
      case 'deleteNotification':
        expect(init?.method).toBe('DELETE')
        if (failAck) return response({ result: false })
        queue.shift()
        return response({ result: true })
      default:
        throw new Error(`Unexpected method: ${method}`)
    }
  })
  vi.stubGlobal('fetch', fetchMock)
})

async function fillConnection(user: ReturnType<typeof userEvent.setup>) {
  for (const [label, value] of Object.entries(credentials))
    await user.type(screen.getByLabelText(label), value)
}

async function connect() {
  const user = userEvent.setup()
  render(<App />)
  await fillConnection(user)
  await user.click(screen.getByRole('button', { name: 'Подключиться' }))
  await screen.findByRole('button', { name: /Собеседник/ })
  return user
}

async function openChat() {
  const user = await connect()
  await user.click(screen.getByRole('button', { name: /Собеседник/ }))
  await screen.findByRole('textbox', { name: 'Сообщение' })
  return user
}

describe('MAX frontend', () => {
  it('requires credentials and blocks unrelated API hosts before any request', async () => {
    const user = userEvent.setup()
    render(<App />)
    expect(screen.getByLabelText('apiTokenInstance')).toHaveValue('')
    await user.click(screen.getByRole('button', { name: 'Подключиться' }))
    expect(await screen.findByText('Введите idInstance')).toBeVisible()
    await fillConnection(user)
    await user.clear(screen.getByLabelText('apiUrl'))
    await user.type(screen.getByLabelText('apiUrl'), 'https://example.com')
    await user.click(screen.getByRole('button', { name: 'Подключиться' }))
    expect(
      await screen.findByText('Укажите HTTPS-адрес API из кабинета GREEN-API'),
    ).toBeVisible()
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('checks authorization and rechecks the same instance after credentials change', async () => {
    state = 'pendingPassword'
    const user = userEvent.setup()
    render(<App />)
    await fillConnection(user)
    await user.click(screen.getByRole('button', { name: 'Подключиться' }))
    expect(
      await screen.findByText('Подтвердите пароль MAX в кабинете GREEN-API.'),
    ).toBeVisible()
    state = 'authorized'
    await user.clear(screen.getByLabelText('apiTokenInstance'))
    await user.type(
      screen.getByLabelText('apiTokenInstance'),
      'another-test-token',
    )
    await user.click(screen.getByRole('button', { name: 'Подключиться' }))
    expect(await screen.findByText('Инстанс подключён')).toBeVisible()
    expect(
      fetchMock.mock.calls.filter(([url]) =>
        String(url).includes('/getStateInstance/'),
      ),
    ).toHaveLength(2)
    expect(
      fetchMock.mock.calls.filter(([url]) =>
        String(url).includes('/getChatHistory/'),
      ),
    ).toHaveLength(0)
    await user.click(screen.getByRole('button', { name: 'Отключиться' }))
    expect(screen.getByLabelText('apiTokenInstance')).toHaveValue('')
    expect(localStorage.length).toBe(0)
    expect(sessionStorage.length).toBe(0)
  })

  it('normalizes a phone and creates a chat with the ID returned by GREEN-API', async () => {
    const user = await connect()
    await user.click(screen.getByRole('button', { name: 'Новый чат' }))
    await user.type(
      screen.getByLabelText('Номер телефона'),
      '8 (900) 123-45-67',
    )
    await user.click(screen.getByRole('button', { name: 'Начать разговор' }))
    expect(
      await screen.findByRole('heading', { name: '+7 900 123-45-67' }),
    ).toBeVisible()
    const call = fetchMock.mock.calls.find(([url]) =>
      String(url).includes('/checkAccount/'),
    )!
    expect(call[1]?.body).toBe(JSON.stringify({ phoneNumber: 79001234567 }))
    await user.type(
      await screen.findByRole('textbox', { name: 'Сообщение' }),
      'Привет{Enter}',
    )
    await within(screen.getByRole('log')).findByText('Привет')
    const send = fetchMock.mock.calls.find(([url]) =>
      String(url).includes('/sendMessage/'),
    )!
    expect(send[1]?.body).toBe(
      JSON.stringify({ chatId: '789', message: 'Привет' }),
    )
  })

  it('keeps the draft after send failure and sends again only on user action', async () => {
    const user = await openChat()
    failSend = true
    await user.type(
      screen.getByRole('textbox', { name: 'Сообщение' }),
      'Проверка{Enter}',
    )
    expect(await screen.findByText(/Текст сохранён/)).toBeVisible()
    expect(screen.getByRole('textbox', { name: 'Сообщение' })).toHaveValue(
      'Проверка',
    )
    expect(
      fetchMock.mock.calls.filter(([url]) =>
        String(url).includes('/sendMessage/'),
      ),
    ).toHaveLength(1)
    failSend = false
    await user.click(
      screen.getByRole('button', { name: 'Отправить сообщение' }),
    )
    expect(
      await within(screen.getByRole('log')).findByText('Проверка'),
    ).toBeVisible()
    expect(screen.getByRole('textbox', { name: 'Сообщение' })).toHaveValue('')
  })

  it('keeps an incoming message before history loads, retries acknowledgement without a duplicate and aborts polling on disconnect', async () => {
    const user = await connect()
    failAck = true
    queue.push({
      receiptId: 42,
      body: {
        typeWebhook: 'incomingMessageReceived',
        timestamp: 1700000000,
        idMessage: 'incoming-1',
        senderData: { chatId: '456' },
        messageData: {
          typeMessage: 'textMessage',
          textMessageData: { textMessage: 'Ответ из MAX' },
        },
      },
    })
    await screen.findByText('Получение сообщений приостановлено.')
    failAck = false
    await user.click(screen.getByRole('button', { name: 'Возобновить' }))
    await waitFor(() => expect(queue).toHaveLength(0))
    await user.click(screen.getByRole('button', { name: /Собеседник/ }))
    await screen.findByRole('textbox', { name: 'Сообщение' })
    await waitFor(() =>
      expect(
        fetchMock.mock.calls.filter(([url]) =>
          String(url).includes('/getChatHistory/'),
        ),
      ).toHaveLength(1),
    )
    expect(
      within(screen.getByRole('log')).getAllByText('Ответ из MAX'),
    ).toHaveLength(1)
    const polls = fetchMock.mock.calls.filter(([url]) =>
      String(url).includes('/receiveNotification/'),
    )
    expect(String(polls.at(-1)![0])).toContain('receiveTimeout=5')
    await user.click(screen.getByRole('button', { name: 'Отключиться' }))
    expect(polls.at(-1)![1]?.signal?.aborted).toBe(true)
  })
})
