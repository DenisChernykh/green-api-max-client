import { useMutation, useQueryClient } from '@tanstack/react-query'
import { ArrowUp } from 'lucide-react'
import { appendMessage } from '@/entities/messenger'
import { sendMessageSchema, sendMessage, errorMessage } from '@/shared/api'
import type { InstanceConnection } from '@/shared/config'
import { useZodForm } from '@/shared/lib/form'
import { Alert, Button, TextareaField } from '@/shared/ui'

const schema = sendMessageSchema.pick({ message: true }).extend({
  message: sendMessageSchema.shape.message
    .trim()
    .min(1, 'Напишите сообщение')
    .max(4000, 'Не больше 4000 символов'),
})

export function SendMessage({
  connection,
  chatId,
  draft,
  onDraftChange,
}: {
  connection: InstanceConnection
  chatId: string
  draft: string
  onDraftChange: (value: string) => void
}) {
  const client = useQueryClient()
  const form = useZodForm(schema, { defaultValues: { message: draft } })
  const mutation = useMutation({
    mutationFn: async ({ message }: { message: string }) => {
      const result = await sendMessage(connection, { chatId, message })
      return { idMessage: result.idMessage, message }
    },
    onSuccess: ({ idMessage, message }) => {
      appendMessage(client, connection, {
        idMessage,
        chatId,
        timestamp: Math.floor(Date.now() / 1000),
        type: 'outgoing',
        typeMessage: 'textMessage',
        textMessage: message,
        statusMessage: 'pending',
      })
      form.reset({ message: '' })
      onDraftChange('')
      form.setFocus('message')
    },
  })
  const message = form.watch('message')
  return (
    <div className="composer-container">
      {mutation.error && (
        <Alert>
          {errorMessage(mutation.error)} Текст сохранён — отправьте его ещё раз.
        </Alert>
      )}
      <form
        className="composer"
        aria-label="Отправка сообщения"
        noValidate
        onSubmit={form.handleSubmit((values) => mutation.mutate(values))}
      >
        <TextareaField
          label="Сообщение"
          placeholder="Напишите сообщение…"
          rows={1}
          maxLength={4000}
          disabled={mutation.isPending}
          {...form.register('message', {
            onChange: (event) => {
              onDraftChange(event.target.value)
              if (mutation.isError) mutation.reset()
            },
          })}
          error={form.formState.errors.message?.message}
          onKeyDown={(event) => {
            if (
              event.key === 'Enter' &&
              !event.shiftKey &&
              !event.nativeEvent.isComposing
            ) {
              event.preventDefault()
              if (!mutation.isPending)
                void form.handleSubmit((values) => mutation.mutate(values))()
            }
          }}
        />
        <Button
          type="submit"
          className="send-button"
          aria-label="Отправить сообщение"
          disabled={!message.trim()}
          isLoading={mutation.isPending}
          loadingLabel="Отправка сообщения"
        >
          <ArrowUp size={23} strokeWidth={2.5} />
        </Button>
      </form>
      <div className="composer-hint">
        <span>
          <kbd>Enter</kbd> — отправить · <kbd>Shift + Enter</kbd> — новая строка
        </span>
        <span>
          {message.length > 3500
            ? `${message.length} / 4000`
            : 'Только текстовые сообщения'}
        </span>
      </div>
    </div>
  )
}
