import { z } from 'zod'

export const clientSchema = z.object({
   comment: z.string().trim(),
   company: z.string().trim().min(1, 'Введите название компании'),
   email: z.string().trim().min(1, 'Введите email').email('Введите корректный email'),
   name: z.string().trim().min(1, 'Введите имя'),
   phone: z.string().trim()
      .min(1, 'Введите телефон')
      .refine(
         (v) => { const d = v.replace(/\D/g, ''); return d.length >= 10 && d.length <= 12 },
         'Введите корректный номер телефона',
      ),
   website: z.string().trim().refine(
      (v) => {
         if (!v) return true
         try {
            const url = new URL(v.startsWith('http') ? v : `https://${v}`)
            const parts = url.hostname.split('.')
            return parts.length >= 2 && parts.every((p) => p.length > 0)
         } catch {
            return false
         }
      },
      'Введите корректный адрес сайта',
   ),
})

export type ClientFormValues = z.infer<typeof clientSchema>