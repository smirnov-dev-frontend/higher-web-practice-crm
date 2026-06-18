import { clientSchema } from './clientsSchema'

const validClient = {
   name: 'Иван Иванов',
   company: 'Рога и Копыта',
   email: 'ivan@example.com',
   phone: '79991234567',
   website: 'https://example.com',
   comment: '',
}

describe('clientSchema', () => {
   it('принимает валидные данные', () => {
      expect(() => clientSchema.parse(validClient)).not.toThrow()
   })

   it('отклоняет пустое имя', () => {
      expect(clientSchema.safeParse({ ...validClient, name: '' }).success).toBe(false)
   })

   it('отклоняет имя из пробелов', () => {
      expect(clientSchema.safeParse({ ...validClient, name: '   ' }).success).toBe(false)
   })

   it('отклоняет пустое название компании', () => {
      expect(clientSchema.safeParse({ ...validClient, company: '' }).success).toBe(false)
   })

   it('отклоняет некорректный email', () => {
      expect(clientSchema.safeParse({ ...validClient, email: 'not-an-email' }).success).toBe(false)
   })

   it('отклоняет email без домена', () => {
      expect(clientSchema.safeParse({ ...validClient, email: 'user@' }).success).toBe(false)
   })

   it('отклоняет слишком короткий номер телефона', () => {
      expect(clientSchema.safeParse({ ...validClient, phone: '12345' }).success).toBe(false)
   })

   it('принимает телефон из 10 цифр', () => {
      expect(clientSchema.safeParse({ ...validClient, phone: '9991234567' }).success).toBe(true)
   })

   it('принимает телефон из 11 цифр', () => {
      expect(clientSchema.safeParse({ ...validClient, phone: '79991234567' }).success).toBe(true)
   })

   it('отклоняет телефон длиннее 12 цифр', () => {
      expect(clientSchema.safeParse({ ...validClient, phone: '1234567890123' }).success).toBe(false)
   })

   it('принимает телефон с нецифровыми символами если цифр достаточно', () => {
      expect(clientSchema.safeParse({ ...validClient, phone: '+7 (999) 123-45-67' }).success).toBe(true)
   })

   it('принимает пустой сайт', () => {
      expect(clientSchema.safeParse({ ...validClient, website: '' }).success).toBe(true)
   })

   it('принимает URL без протокола', () => {
      expect(clientSchema.safeParse({ ...validClient, website: 'example.com' }).success).toBe(true)
   })

   it('отклоняет строку с пробелами как URL', () => {
      expect(clientSchema.safeParse({ ...validClient, website: 'not a url' }).success).toBe(false)
   })

   it('отклоняет одиночное слово без домена', () => {
      expect(clientSchema.safeParse({ ...validClient, website: 'site' }).success).toBe(false)
   })

   it('принимает пустой комментарий', () => {
      expect(clientSchema.safeParse({ ...validClient, comment: '' }).success).toBe(true)
   })
})
