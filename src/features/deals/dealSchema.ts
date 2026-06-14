import { z } from 'zod'

export const dealSchema = z.object({
   title: z.string().trim().min(1, 'Введите название'),
   clientId: z.string().min(1, 'Выберите клиента'),
   amount: z.number().positive('Введите корректную сумму'),
   status: z.enum(['new', 'in_progress', 'completed', 'cancelled']),
   description: z.string().trim(),
})

export type DealFormValues = z.infer<typeof dealSchema>