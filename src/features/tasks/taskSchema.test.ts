import { taskSchema } from './taskSchema'

const validTask = {
   title: 'Подготовить договор',
   dealId: 'deal-1',
   assigneeId: 'user-1',
   status: 'new' as const,
   description: '',
   dueDate: '',
}

describe('taskSchema', () => {
   it('принимает валидные данные', () => {
      expect(() => taskSchema.parse(validTask)).not.toThrow()
   })

   it('отклоняет пустое название', () => {
      expect(taskSchema.safeParse({ ...validTask, title: '' }).success).toBe(false)
   })

   it('отклоняет название из пробелов', () => {
      expect(taskSchema.safeParse({ ...validTask, title: '   ' }).success).toBe(false)
   })

   it('отклоняет пустой идентификатор сделки', () => {
      expect(taskSchema.safeParse({ ...validTask, dealId: '' }).success).toBe(false)
   })

   it('отклоняет пустой идентификатор исполнителя', () => {
      expect(taskSchema.safeParse({ ...validTask, assigneeId: '' }).success).toBe(false)
   })

   it('принимает статус new', () => {
      expect(taskSchema.safeParse({ ...validTask, status: 'new' }).success).toBe(true)
   })

   it('принимает статус in_progress', () => {
      expect(taskSchema.safeParse({ ...validTask, status: 'in_progress' }).success).toBe(true)
   })

   it('принимает статус completed', () => {
      expect(taskSchema.safeParse({ ...validTask, status: 'completed' }).success).toBe(true)
   })

   it('отклоняет неизвестный статус', () => {
      expect(taskSchema.safeParse({ ...validTask, status: 'done' }).success).toBe(false)
   })

   it('принимает задачу без дедлайна', () => {
      expect(taskSchema.safeParse({ title: validTask.title, dealId: validTask.dealId, assigneeId: validTask.assigneeId, status: validTask.status }).success).toBe(true)
   })

   it('принимает задачу с датой дедлайна', () => {
      expect(taskSchema.safeParse({ ...validTask, dueDate: '2024-12-31' }).success).toBe(true)
   })

   it('принимает задачу без описания', () => {
      expect(taskSchema.safeParse({ title: validTask.title, dealId: validTask.dealId, assigneeId: validTask.assigneeId, status: validTask.status }).success).toBe(true)
   })
})
