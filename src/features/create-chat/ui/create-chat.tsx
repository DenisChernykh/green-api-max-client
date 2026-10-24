import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { ArrowRight, SquarePen } from 'lucide-react'
import { z } from 'zod'
import { addChat } from '@/entities/messenger'
import { checkAccount, errorMessage } from '@/shared/api'
import type { InstanceConnection } from '@/shared/config'
import { useZodForm } from '@/shared/lib/form'
import { formatPhone } from '@/shared/lib/format'
import { Alert, Button, Modal, TextField } from '@/shared/ui'

const schema = z.object({
  phone: z
    .string()
    .trim()
    .min(1, 'Введите номер телефона')
    .regex(/^[+\d\s()-]+$/, 'Используйте цифры и символы номера телефона')
    .transform((value) =>
      value.replace(/\D/g, '').replace(/^8(?=\d{10}$)/, '7'),
    )
    .refine(
      (value) => /^(7\d{10}|375\d{9})$/.test(value),
      'Введите номер РФ (+7) или Беларуси (+375)',
    ),
})

export function CreateChat({
  connection,
  onCreated,
}: {
  connection: InstanceConnection
  onCreated: (chatId: string) => void
}) {
  const [open, setOpen] = useState(false)
  const client = useQueryClient()
  const form = useZodForm(schema, { defaultValues: { phone: '' } })
  const mutation = useMutation({
    mutationFn: async ({ phone }: z.output<typeof schema>) => {
      const result = await checkAccount(connection, {
        phoneNumber: Number(phone),
      })
      if (!result.exist || !result.chatId) throw new Error('ACCOUNT_NOT_FOUND')
      return { chatId: result.chatId, phone }
    },
    onSuccess: ({ chatId, phone }) => {
      addChat(client, connection, {
        chatId,
        name: formatPhone(phone),
        phoneNumber: Number(phone),
        type: 'user',
        unreadCount: 0,
      })
      onCreated(chatId)
      setOpen(false)
    },
  })
  return (
    <Modal
      open={open}
      onOpenChange={(value) => {
        setOpen(value)
        if (value) {
          form.reset()
          mutation.reset()
        }
      }}
      title="Новый чат"
      description="Введите номер собеседника в международном формате."
      trigger={
        <Button
          variant="ghost"
          className="icon-button new-chat-button"
          aria-label="Новый чат"
          title="Новый чат"
        >
          <SquarePen size={22} />
        </Button>
      }
    >
      <form
        noValidate
        className="dialog-form"
        onSubmit={form.handleSubmit((values) => mutation.mutate(values))}
      >
        <TextField
          label="Номер телефона"
          placeholder="+7 900 123-45-67"
          type="tel"
          autoComplete="off"
          description="У собеседника должен быть аккаунт MAX. Поддерживаются номера РФ и РБ."
          {...form.register('phone')}
          error={form.formState.errors.phone?.message}
        />
        {mutation.error && (
          <Alert>
            {mutation.error.message === 'ACCOUNT_NOT_FOUND'
              ? 'Аккаунт MAX с этим номером не найден. Проверьте номер.'
              : errorMessage(mutation.error)}
          </Alert>
        )}
        <Button
          type="submit"
          isLoading={mutation.isPending}
          loadingLabel="Поиск собеседника"
        >
          Начать разговор
          <ArrowRight size={17} />
        </Button>
      </form>
    </Modal>
  )
}
