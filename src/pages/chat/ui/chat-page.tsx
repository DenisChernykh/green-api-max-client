import { useState } from 'react'
import { ConnectInstance } from '@/features/connect-instance'
import { Messenger } from '@/widgets/messenger'
import type { InstanceConnection } from '@/shared/config'

export function ChatPage({ onDisconnect }: { onDisconnect: () => void }) {
  const [connection, setConnection] = useState<InstanceConnection | null>(null)
  return connection ? (
    <Messenger connection={connection} onDisconnect={onDisconnect} />
  ) : (
    <ConnectInstance onConnected={setConnection} />
  )
}
