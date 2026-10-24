import { useEffect, useRef, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import {
  ArrowLeft,
  Check,
  CheckCheck,
  ChevronDown,
  LogOut,
  MessageCircle,
  Search,
  Settings2,
  ShieldCheck,
  X,
} from 'lucide-react'
import { clsx } from 'clsx'
import {
  useChats,
  useMessages,
  useIncomingMessages,
  markRead,
} from '@/entities/messenger'
import { CreateChat } from '@/features/create-chat'
import { SendMessage } from '@/features/send-message'
import { errorMessage, type ChatItem, type HistoryMessage } from '@/shared/api'
import type { InstanceConnection } from '@/shared/config'
import { formatDay, formatPhone, formatTime } from '@/shared/lib/format'
import { Alert, Avatar, Brand, Button, Loading, Modal } from '@/shared/ui'

function ChatRow({
  chat,
  connection,
  active,
  onSelect,
}: {
  chat: ChatItem
  connection: InstanceConnection
  active: boolean
  onSelect: () => void
}) {
  const { data } = useMessages(connection, chat.chatId, false)
  const last = data?.at(-1)
  return (
    <button
      type="button"
      className={clsx('chat-row', active && 'chat-row-active')}
      onClick={onSelect}
      aria-current={active ? 'true' : undefined}
    >
      <Avatar name={chat.name} id={chat.chatId} />
      <span className="chat-row-content">
        <span className="chat-row-top">
          <span className="chat-row-name">{chat.name}</span>
          <time>{last ? formatTime(last.timestamp) : 'Новый'}</time>
        </span>
        <span className="chat-row-bottom">
          <span className="chat-preview">
            {last?.type === 'outgoing' && <CheckCheck size={15} aria-hidden />}
            <span className="chat-preview-text">
              {last?.textMessage ?? 'Открыть переписку'}
            </span>
          </span>
          {Boolean(chat.unreadCount) && (
            <span
              className="unread-count"
              aria-label={`${chat.unreadCount} непрочитанных`}
            >
              {chat.unreadCount}
            </span>
          )}
        </span>
      </span>
    </button>
  )
}

function MessageBubble({ message }: { message: HistoryMessage }) {
  const outgoing = message.type === 'outgoing'
  return (
    <div className={clsx('message-row', outgoing && 'message-row-outgoing')}>
      <article
        className={clsx('message-bubble', outgoing && 'message-outgoing')}
        aria-label={outgoing ? 'Исходящее сообщение' : 'Входящее сообщение'}
      >
        <p>{message.textMessage}</p>
        <span className="message-meta">
          <time dateTime={new Date(message.timestamp * 1000).toISOString()}>
            {formatTime(message.timestamp)}
          </time>
          {outgoing && (
            <Check
              size={14}
              aria-label={
                message.statusMessage === 'pending'
                  ? 'Принято API'
                  : 'Исходящее сообщение'
              }
            />
          )}
        </span>
      </article>
    </div>
  )
}

function Conversation({
  chat,
  connection,
  onBack,
  draft,
  onDraftChange,
}: {
  chat: ChatItem
  connection: InstanceConnection
  onBack: () => void
  draft: string
  onDraftChange: (value: string) => void
}) {
  const messages = useMessages(connection, chat.chatId)
  const bottom = useRef<HTMLDivElement>(null)
  const scrollArea = useRef<HTMLDivElement>(null)
  const followLatest = useRef(true)
  const [showScroll, setShowScroll] = useState(false)
  const [infoOpen, setInfoOpen] = useState(false)
  useEffect(() => {
    if (followLatest.current || messages.data?.at(-1)?.type === 'outgoing') {
      bottom.current?.scrollIntoView({ behavior: 'instant', block: 'end' })
    }
  }, [messages.data, chat.chatId])
  return (
    <section className="conversation" aria-label={`Чат с ${chat.name}`}>
      <header className="conversation-header">
        <Button
          variant="ghost"
          className="icon-button mobile-back"
          aria-label="Назад к чатам"
          onClick={onBack}
        >
          <ArrowLeft />
        </Button>
        <Avatar name={chat.name} id={chat.chatId} small />
        <div className="conversation-contact">
          <h1>{chat.name}</h1>
          <span>MAX</span>
        </div>
        <Modal
          open={infoOpen}
          onOpenChange={setInfoOpen}
          title={chat.name}
          description="Данные собеседника."
          trigger={
            <Button
              variant="ghost"
              className="icon-button contact-details-button"
              aria-label="Информация о собеседнике"
            >
              <Settings2 size={21} />
            </Button>
          }
        >
          <div className="contact-card">
            <Avatar name={chat.name} id={chat.chatId} />
            <span>
              {chat.phoneNumber ? formatPhone(chat.phoneNumber) : 'Номер скрыт'}
            </span>
            <span className="muted-text">MAX</span>
          </div>
        </Modal>
      </header>
      <div
        className="conversation-body"
        ref={scrollArea}
        onScroll={() => {
          const node = scrollArea.current
          if (node) {
            followLatest.current =
              node.scrollHeight - node.scrollTop - node.clientHeight < 120
            setShowScroll(
              node.scrollHeight - node.scrollTop - node.clientHeight > 240,
            )
          }
        }}
      >
        {messages.isPending && <Loading label="Загружаем переписку…" />}
        {messages.isError && (
          <div className="conversation-feedback">
            <Alert>{errorMessage(messages.error)}</Alert>
            <Button variant="secondary" onClick={() => void messages.refetch()}>
              Попробовать снова
            </Button>
          </div>
        )}
        {messages.isSuccess && messages.data.length === 0 && (
          <div className="empty-conversation">
            <span>
              <MessageCircle size={29} />
            </span>
            <h2>Начните разговор</h2>
            <p>Напишите первое сообщение собеседнику в MAX.</p>
          </div>
        )}
        <div
          className="messages"
          role="log"
          aria-label="Сообщения"
          aria-live="polite"
          aria-relevant="additions"
        >
          {messages.data?.map((message, index, list) => (
            <div key={message.idMessage}>
              {(index === 0 ||
                new Date(message.timestamp * 1000).toDateString() !==
                  new Date(
                    list[index - 1].timestamp * 1000,
                  ).toDateString()) && (
                <div className="day-separator">
                  <span>{formatDay(message.timestamp)}</span>
                </div>
              )}
              <MessageBubble message={message} />
            </div>
          ))}
          <div ref={bottom} />
        </div>
      </div>
      {showScroll && (
        <Button
          variant="secondary"
          className="scroll-to-bottom icon-button"
          aria-label="К последним сообщениям"
          onClick={() => bottom.current?.scrollIntoView({ behavior: 'smooth' })}
        >
          <ChevronDown />
        </Button>
      )}
      {messages.isSuccess && (
        <SendMessage
          key={chat.chatId}
          connection={connection}
          chatId={chat.chatId}
          draft={draft}
          onDraftChange={onDraftChange}
        />
      )}
    </section>
  )
}

export function Messenger({
  connection,
  onDisconnect,
}: {
  connection: InstanceConnection
  onDisconnect: () => void
}) {
  const [activeChatId, setActiveChatId] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [unreadOnly, setUnreadOnly] = useState(false)
  const [drafts, setDrafts] = useState<Record<string, string>>({})
  const chats = useChats(connection)
  const client = useQueryClient()
  const incoming = useIncomingMessages(
    connection,
    activeChatId,
    chats.isSuccess,
  )
  const activeChat = chats.data?.find((chat) => chat.chatId === activeChatId)
  const unreadCount =
    chats.data?.filter((chat) => Boolean(chat.unreadCount)).length ?? 0
  function selectChat(id: string | null) {
    setActiveChatId(id)
    if (id) markRead(client, connection, id)
  }
  const filtered = chats.data?.filter(
    (chat) =>
      chat.type === 'user' &&
      (!unreadOnly || Boolean(chat.unreadCount)) &&
      `${chat.name} ${chat.phoneNumber ?? ''}`
        .toLocaleLowerCase('ru')
        .includes(search.toLocaleLowerCase('ru').trim()),
  )
  return (
    <main
      className={clsx(
        'messenger-app',
        Boolean(activeChat) && 'has-active-chat',
      )}
    >
      <nav className="navigation-rail" aria-label="Навигация">
        <Brand compact />
        <Button
          variant="ghost"
          className="rail-chat-button"
          onClick={() => selectChat(null)}
          aria-label="Перейти к списку чатов"
          title="Чаты"
        >
          <MessageCircle size={23} fill="currentColor" strokeWidth={1.5} />
          <span>Чаты</span>
        </Button>
        <div className="rail-bottom">
          <Button
            variant="ghost"
            className="icon-button rail-action"
            aria-label="Отключиться"
            title="Отключиться"
            onClick={onDisconnect}
          >
            <LogOut size={21} />
          </Button>
          <span className="profile-avatar" title="MAX">
            М
          </span>
        </div>
      </nav>
      <aside className="chat-sidebar" aria-label="Список чатов">
        <header className="sidebar-header">
          <div>
            <h2>Чаты</h2>
            <span className="chat-total">{chats.data?.length ?? 0}</span>
          </div>
          <CreateChat connection={connection} onCreated={selectChat} />
        </header>
        <div className="chat-search">
          <Search size={18} aria-hidden />
          <input
            aria-label="Поиск чатов"
            placeholder="Поиск"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
          {Boolean(search) && (
            <Button
              variant="ghost"
              className="icon-button search-clear"
              aria-label="Очистить поиск"
              onClick={() => setSearch('')}
            >
              <X size={16} />
            </Button>
          )}
        </div>
        <div className="chat-filters" aria-label="Фильтр чатов">
          <button
            type="button"
            aria-pressed={!unreadOnly}
            className={!unreadOnly ? 'filter-active' : ''}
            onClick={() => setUnreadOnly(false)}
          >
            Все чаты
          </button>
          <button
            type="button"
            aria-pressed={unreadOnly}
            className={unreadOnly ? 'filter-active' : ''}
            onClick={() => setUnreadOnly(true)}
          >
            Непрочитанные{unreadCount > 0 && <span>{unreadCount}</span>}
          </button>
        </div>
        <div className="chat-list">
          {chats.isPending && <Loading label="Загружаем чаты…" />}
          {chats.isError && (
            <div className="sidebar-error">
              <Alert>{errorMessage(chats.error)}</Alert>
              <Button variant="secondary" onClick={() => void chats.refetch()}>
                Повторить
              </Button>
            </div>
          )}
          {filtered?.map((chat) => (
            <ChatRow
              key={chat.chatId}
              connection={connection}
              chat={chat}
              active={chat.chatId === activeChatId}
              onSelect={() => selectChat(chat.chatId)}
            />
          ))}
          {chats.isSuccess && filtered?.length === 0 && (
            <div className="sidebar-empty">
              <Search size={27} />
              <p>
                {search
                  ? 'Чаты не найдены'
                  : unreadOnly
                    ? 'Всё прочитано'
                    : 'Пока нет чатов'}
              </p>
              <span>
                {search
                  ? 'Попробуйте другое имя или номер'
                  : 'Начните новый разговор'}
              </span>
            </div>
          )}
        </div>
        <footer className="sidebar-footer">
          <span className="status-dot" />
          <div>
            <span>Инстанс подключён</span>
            <small>GREEN-API · {connection.idInstance}</small>
          </div>
          <ShieldCheck size={18} />
        </footer>
      </aside>
      <div className="chat-workspace">
        {incoming.failed && (
          <div className="sync-error" role="alert">
            <span>Получение сообщений приостановлено.</span>
            <Button variant="secondary" onClick={incoming.retry}>
              Возобновить
            </Button>
          </div>
        )}
        {activeChat ? (
          <Conversation
            key={activeChat.chatId}
            connection={connection}
            chat={activeChat}
            onBack={() => selectChat(null)}
            draft={drafts[activeChat.chatId] ?? ''}
            onDraftChange={(value) =>
              setDrafts((current) => ({
                ...current,
                [activeChat.chatId]: value,
              }))
            }
          />
        ) : (
          <section className="welcome-state">
            <div className="welcome-mark">
              <Brand compact />
            </div>
            <h1>Начнём разговор?</h1>
            <p>
              Выберите чат слева
              <br />
              или создайте новый по номеру телефона.
            </p>
          </section>
        )}
      </div>
    </main>
  )
}
