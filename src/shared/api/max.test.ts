import { describe, expect, it, vi } from 'vitest'
import { ApiError, errorMessage } from './client'
import { getStateInstance, sendMessage } from './max'

const connection = {
  apiUrl: 'https://1100.api.green-api.com',
  idInstance: '123',
  apiTokenInstance: 'test-only-token',
}

describe('GREEN-API transport', () => {
  it('constructs the vendor endpoint and sends only the documented JSON body', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(
        new Response(JSON.stringify({ idMessage: 'message-1' })),
      )
    vi.stubGlobal('fetch', fetchMock)
    await expect(
      sendMessage(connection, { chatId: '456', message: 'Привет' }),
    ).resolves.toEqual({ idMessage: 'message-1' })
    const [url, options] = fetchMock.mock.calls[0]
    expect(String(url)).toBe(
      'https://1100.api.green-api.com/waInstance123/sendMessage/test-only-token',
    )
    expect(options.method).toBe('POST')
    expect(options.body).toBe(
      JSON.stringify({ chatId: '456', message: 'Привет' }),
    )
    expect(options.credentials).toBe('omit')
    expect(options.redirect).toBe('error')
  })

  it('rejects unexpected API shapes instead of treating them as success', async () => {
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValue(new Response(JSON.stringify({ status: false }))),
    )
    await expect(getStateInstance(connection)).rejects.toMatchObject({
      code: 'INVALID_RESPONSE',
    })
  })

  it('redacts network error details and maps rejected credentials', async () => {
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockRejectedValue(
          new Error(`Failed to fetch ${connection.apiTokenInstance}`),
        ),
    )
    await expect(getStateInstance(connection)).rejects.toMatchObject({
      message: 'NETWORK_ERROR',
      status: 0,
    })
    expect(errorMessage(new ApiError(401, 'HTTP_ERROR'))).toContain(
      'Проверьте параметры',
    )
  })
})
