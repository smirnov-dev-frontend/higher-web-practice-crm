import { z } from 'zod'

export const clientSchema = z.object({
   comment: z.string().trim(),
   company: z.string().trim().min(1, 'Введите название компании'),
   email: z.string().trim().min(1, 'Введите email').email('Введите корректный email'),
   name: z.string().trim().min(1, 'Введите имя'),
   phone: z.string().trim().min(1, 'Введите телефон'),
   website: z.string().trim(),
})

export type ClientFormValues = z.infer<typeof clientSchema>