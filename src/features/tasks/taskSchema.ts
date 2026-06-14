import { z } from 'zod'

export const taskSchema = z.object({
   title: z.string().trim().min(1, 'Введите название'),
   dealId: z.string().min(1, 'Выберите сделку'),
   description: z.string().trim().optional(),
   dueDate: z.string().optional(),
   assigneeId: z.string().min(1, 'Выберите исполнителя'),
   status: z.enum(['new', 'in_progress', 'completed']),
})

export type TaskFormValues = z.infer<typeof taskSchema>