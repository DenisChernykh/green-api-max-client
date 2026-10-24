import { useMutation } from '@tanstack/react-query'
import { ArrowRight, MessageCircle, ShieldCheck } from 'lucide-react'
import { ApiError, getStateInstance, errorMessage } from '@/shared/api'
import { connectionSchema, type InstanceConnection } from '@/shared/config'
import { useZodForm } from '@/shared/lib/form'
import { Alert, Brand, Button, PasswordField, TextField } from '@/shared/ui'

export function ConnectInstance({
  onConnected,
}: {
  onConnected: (connection: InstanceConnection) => void
}) {
  const form = useZodForm(connectionSchema, {
    defaultValues: { apiUrl: '', idInstance: '', apiTokenInstance: '' },
  })
  const mutation = useMutation({
    mutationFn: async (values: InstanceConnection) => {
      const data = await getStateInstance(values)
      if (data.stateInstance === 'pendingPassword')
        throw new ApiError(401, 'PENDING_PASSWORD')
      if (data.stateInstance !== 'authorized')
        throw new ApiError(401, 'NOT_AUTHORIZED')
      return values
    },
    onSuccess: onConnected,
  })
  return (
    <main className="connect-page">
      <header className="connect-header">
        <Brand />
        <span className="project-label">
          Тестовое задание <span>GREEN-API</span>
        </span>
      </header>
      <div className="connect-layout">
        <section className="connect-preview" aria-label="Предпросмотр чата">
          <span className="eyebrow">GREEN-API × MAX</span>
          <h1>
            Переписка
            <br />в MAX<span>.</span>
          </h1>
          <p>Отправляйте текст и получайте ответы в одном окне.</p>
          <div className="preview-conversation" aria-hidden>
            <div className="preview-bubble">
              Привет! Есть идея на выходные ☀️<small>10:20</small>
            </div>
            <div className="preview-bubble preview-outgoing">
              Привет! Рассказывай<small>10:21 ✓✓</small>
            </div>
            <div className="preview-bubble">
              Давай выберемся за город?<small>10:22</small>
            </div>
          </div>
          <div className="preview-caption">
            <MessageCircle size={18} />
            <span>Текстовые сообщения · MAX</span>
          </div>
        </section>
        <section
          className="connect-form-panel"
          aria-labelledby="connect-heading"
        >
          <h2 id="connect-heading">Подключение к MAX</h2>
          <p className="connect-description">
            Введите параметры инстанса из личного кабинета GREEN-API.
          </p>
          <form
            noValidate
            onSubmit={form.handleSubmit((values) => mutation.mutate(values))}
            className="connect-form"
          >
            <TextField
              label="apiUrl"
              placeholder="https://1100.api.green-api.com"
              autoComplete="off"
              type="url"
              {...form.register('apiUrl')}
              error={form.formState.errors.apiUrl?.message}
            />
            <TextField
              label="idInstance"
              autoComplete="off"
              inputMode="numeric"
              {...form.register('idInstance')}
              error={form.formState.errors.idInstance?.message}
            />
            <PasswordField
              label="apiTokenInstance"
              autoComplete="off"
              {...form.register('apiTokenInstance')}
              error={form.formState.errors.apiTokenInstance?.message}
            />
            {mutation.error && <Alert>{errorMessage(mutation.error)}</Alert>}
            <Button
              type="submit"
              className="connect-submit"
              isLoading={mutation.isPending}
              loadingLabel="Подключение"
            >
              Подключиться
              <ArrowRight size={18} />
            </Button>
          </form>
          <p className="connection-note">
            <ShieldCheck size={17} />
            <span>
              Параметры используются для запросов к GREEN-API и хранятся только
              до закрытия или перезагрузки страницы.
            </span>
          </p>
        </section>
      </div>
      <footer className="connect-footer">
        <span>MAX × GREEN-API</span>
        <span>Текстовые сообщения</span>
      </footer>
    </main>
  )
}
