import { Button as BaseButton } from '@base-ui/react/button'
import { Dialog } from '@base-ui/react/dialog'
import { Eye, EyeOff, LoaderCircle, X } from 'lucide-react'
import {
  useId,
  useState,
  type ComponentProps,
  type ReactNode,
  type ReactElement,
} from 'react'
import { clsx } from 'clsx'
import { initials } from '@/shared/lib/format'

export function Button({
  children,
  className,
  isLoading = false,
  loadingLabel = 'Загрузка',
  variant = 'primary',
  ...props
}: ComponentProps<typeof BaseButton> & {
  isLoading?: boolean
  loadingLabel?: string
  variant?: 'primary' | 'ghost' | 'secondary'
}) {
  return (
    <BaseButton
      {...props}
      disabled={props.disabled || isLoading}
      aria-busy={isLoading || undefined}
      aria-label={isLoading ? loadingLabel : props['aria-label']}
      className={(state) =>
        clsx(
          'button',
          `button-${variant}`,
          typeof className === 'function' ? className(state) : className,
        )
      }
    >
      {isLoading && <LoaderCircle aria-hidden className="spinner" />}
      {children}
    </BaseButton>
  )
}

type FieldProps = ComponentProps<'input'> & {
  label: string
  description?: string
  error?: string
}

export function TextField({
  label,
  description,
  error,
  id,
  ...props
}: FieldProps) {
  const generatedId = useId()
  const fieldId = id ?? generatedId
  return (
    <div className="form-field">
      <label htmlFor={fieldId}>{label}</label>
      <input
        {...props}
        id={fieldId}
        className={clsx('input', props.className)}
        aria-invalid={Boolean(error)}
        aria-describedby={
          [description && `${fieldId}-description`, error && `${fieldId}-error`]
            .filter(Boolean)
            .join(' ') || undefined
        }
      />
      {description && (
        <p className="field-description" id={`${fieldId}-description`}>
          {description}
        </p>
      )}
      {error && (
        <p className="field-error" role="alert" id={`${fieldId}-error`}>
          {error}
        </p>
      )}
    </div>
  )
}

export function PasswordField(props: FieldProps) {
  const [visible, setVisible] = useState(false)
  return (
    <div className="password-field">
      <TextField {...props} type={visible ? 'text' : 'password'} />
      <Button
        type="button"
        variant="ghost"
        className="password-toggle icon-button"
        aria-label={visible ? 'Скрыть токен' : 'Показать токен'}
        onClick={() => setVisible(!visible)}
      >
        {visible ? <EyeOff /> : <Eye />}
      </Button>
    </div>
  )
}

export function TextareaField({
  label,
  error,
  className,
  ...props
}: ComponentProps<'textarea'> & { label: string; error?: string }) {
  const id = useId()
  return (
    <div className={clsx('textarea-field', className)}>
      <label htmlFor={id} className="sr-only">
        {label}
      </label>
      <textarea
        {...props}
        id={id}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${id}-error` : undefined}
      />
      {error && (
        <p className="field-error" role="alert" id={`${id}-error`}>
          {error}
        </p>
      )}
    </div>
  )
}

export function Modal({
  trigger,
  title,
  description,
  open,
  onOpenChange,
  children,
}: {
  trigger: ReactElement
  title: string
  description: string
  open: boolean
  onOpenChange: (open: boolean) => void
  children: ReactNode
}) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Trigger render={trigger} />
      <Dialog.Portal>
        <Dialog.Backdrop className="dialog-backdrop" />
        <Dialog.Popup className="dialog-popup">
          <Dialog.Close
            render={
              <Button
                variant="ghost"
                className="icon-button dialog-close"
                aria-label="Закрыть"
              />
            }
          >
            <X />
          </Dialog.Close>
          <Dialog.Title className="dialog-title">{title}</Dialog.Title>
          <Dialog.Description className="dialog-description">
            {description}
          </Dialog.Description>
          {children}
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

export function Alert({ children }: { children: ReactNode }) {
  return (
    <div role="alert" className="alert">
      {children}
    </div>
  )
}

export function Avatar({
  name,
  id,
  small = false,
}: {
  name: string
  id: string
  small?: boolean
}) {
  const color = [...id].reduce((acc, value) => acc + value.charCodeAt(0), 0) % 4
  return (
    <span
      aria-hidden
      className={clsx('avatar', `avatar-${color}`, small && 'avatar-small')}
    >
      {initials(name)}
    </span>
  )
}

export function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <span
      className={clsx('brand', compact && 'brand-compact')}
      aria-label="MAX"
    >
      <svg viewBox="0 0 48 48" aria-hidden>
        <rect width="48" height="48" rx="16" fill="currentColor" />
        <path
          d="M13 26a11 11 0 1 1 6 9l-6 2 1-7"
          fill="none"
          stroke="white"
          strokeWidth="5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      {!compact && <span>MAX</span>}
    </span>
  )
}

export function Loading({ label = 'Загрузка…' }: { label?: string }) {
  return (
    <div className="loading-state" role="status">
      <LoaderCircle className="spinner" aria-hidden />
      <span>{label}</span>
    </div>
  )
}
