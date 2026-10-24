import { QueryClientProvider } from '@tanstack/react-query'
import { useState } from 'react'
import { ChatPage } from '@/pages/chat'
import { createQueryClient } from './config/query-client'

export function App() {
  const [runtime, setRuntime] = useState(() => ({
    client: createQueryClient(),
    version: 0,
  }))
  function disconnect() {
    void runtime.client.cancelQueries()
    runtime.client.clear()
    // Pending callbacks remain attached to the discarded client, never a new session.
    setRuntime({ client: createQueryClient(), version: runtime.version + 1 })
  }
  return (
    <QueryClientProvider client={runtime.client}>
      <ChatPage key={runtime.version} onDisconnect={disconnect} />
    </QueryClientProvider>
  )
}
