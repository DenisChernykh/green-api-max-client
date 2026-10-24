import { z } from 'zod'

export const connectionSchema = z.object({
  apiUrl: z
    .string()
    .trim()
    .min(1, 'Введите apiUrl')
    .refine((value) => {
      try {
        const url = new URL(value)
        return (
          url.protocol === 'https:' &&
          /^(\d+\.)?api\.green-api\.com$/.test(url.hostname) &&
          !url.port &&
          !url.username &&
          !url.password &&
          url.pathname === '/' &&
          !url.search &&
          !url.hash
        )
      } catch {
        return false
      }
    }, 'Укажите HTTPS-адрес API из кабинета GREEN-API')
    .transform((value) => new URL(value).origin),
  idInstance: z
    .string()
    .trim()
    .min(1, 'Введите idInstance')
    .regex(/^\d+$/, 'Используйте только цифры'),
  apiTokenInstance: z.string().trim().min(1, 'Введите apiTokenInstance'),
})

export type InstanceConnection = z.output<typeof connectionSchema>
