import { dealSchema } from './dealSchema'

const validDeal = {
   title: 'Разработка сайта',
   clientId: 'client-1',
   amount: 50000,
   status: 'new' as const,
   description: '',
}

describe('dealSchema', () => {
   it('принимает валидные данные', () => {
      expect(() => dealSchema.parse(validDeal)).not.toThrow()
   })

   it('отклоняет пустое название', () => {
      expect(dealSchema.safeParse({ ...validDeal, title: '' }).success).toBe(false)
   })

   it('отклоняет название из пробелов', () => {
      expect(dealSchema.safeParse({ ...validDeal, title: '   ' }).success).toBe(false)
   })

   it('отклоняет пустой идентификатор клиента', () => {
      expect(dealSchema.safeParse({ ...validDeal, clientId: '' }).success).toBe(false)
   })

   it('отклоняет нулевую сумму', () => {
      expect(dealSchema.safeParse({ ...validDeal, amount: 0 }).success).toBe(false)
   })

   it('отклоняет отрицательную сумму', () => {
      expect(dealSchema.safeParse({ ...validDeal, amount: -100 }).success).toBe(false)
   })

   it('принимает положительную сумму', () => {
      expect(dealSchema.safeParse({ ...validDeal, amount: 1 }).success).toBe(true)
   })

   it('принимает статус new', () => {
      expect(dealSchema.safeParse({ ...validDeal, status: 'new' }).success).toBe(true)
   })

   it('принимает статус in_progress', () => {
      expect(dealSchema.safeParse({ ...validDeal, status: 'in_progress' }).success).toBe(true)
   })

   it('принимает статус completed', () => {
      expect(dealSchema.safeParse({ ...validDeal, status: 'completed' }).success).toBe(true)
   })

   it('принимает статус cancelled', () => {
      expect(dealSchema.safeParse({ ...validDeal, status: 'cancelled' }).success).toBe(true)
   })

   it('отклоняет неизвестный статус', () => {
      expect(dealSchema.safeParse({ ...validDeal, status: 'unknown' }).success).toBe(false)
   })

   it('принимает пустое описание', () => {
      expect(dealSchema.safeParse({ ...validDeal, description: '' }).success).toBe(true)
   })
})
