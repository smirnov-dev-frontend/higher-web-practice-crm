import { formatCurrency, formatDate, formatPhone, formatShortDate, formatWebsite, normalizePhone } from './format'

describe('formatDate', () => {
   it('возвращает тире при отсутствии значения', () => {
      expect(formatDate(undefined)).toBe('—')
   })

   it('форматирует дату в российском формате', () => {
      expect(formatDate('2024-06-15T12:00:00')).toMatch(/15 июня 2024/)
   })

   it('убирает суффикс года', () => {
      expect(formatDate('2024-06-15T12:00:00')).not.toContain('г.')
   })
})

describe('formatShortDate', () => {
   it('возвращает тире при отсутствии значения', () => {
      expect(formatShortDate(undefined)).toBe('—')
   })

   it('форматирует короткую дату без года', () => {
      expect(formatShortDate('2024-06-15T12:00:00')).toMatch(/15 июня/)
   })

   it('не включает год', () => {
      expect(formatShortDate('2024-06-15T12:00:00')).not.toContain('2024')
   })
})

describe('formatCurrency', () => {
   it('включает символ рубля', () => {
      expect(formatCurrency(50000)).toContain('₽')
   })

   it('включает числовое значение', () => {
      expect(formatCurrency(50000)).toContain('50')
   })

   it('форматирует ноль', () => {
      expect(formatCurrency(0)).toContain('₽')
   })
})

describe('formatWebsite', () => {
   it('возвращает тире при отсутствии значения', () => {
      expect(formatWebsite(undefined)).toBe('—')
   })

   it('убирает https://', () => {
      expect(formatWebsite('https://example.com')).toBe('example.com')
   })

   it('убирает http://', () => {
      expect(formatWebsite('http://example.com')).toBe('example.com')
   })

   it('не изменяет строку без протокола', () => {
      expect(formatWebsite('example.com')).toBe('example.com')
   })
})

describe('formatPhone', () => {
   it('форматирует 11-значный номер начинающийся с 7', () => {
      expect(formatPhone('79991234567')).toBe('+7 999 123-45-67')
   })

   it('форматирует номер с символами в нужный вид', () => {
      expect(formatPhone('+7 (999) 123-45-67')).toBe('+7 999 123-45-67')
   })

   it('возвращает исходную строку для номера без ведущей 7', () => {
      expect(formatPhone('89991234567')).toBe('89991234567')
   })

   it('возвращает исходную строку для 10-значного номера', () => {
      expect(formatPhone('9991234567')).toBe('9991234567')
   })
})

describe('normalizePhone', () => {
   it('заменяет ведущую 8 на 7 у 11-значного номера', () => {
      expect(normalizePhone('89991234567')).toBe('79991234567')
   })

   it('оставляет номер с ведущей 7 без изменений', () => {
      expect(normalizePhone('79991234567')).toBe('79991234567')
   })

   it('убирает нецифровые символы', () => {
      expect(normalizePhone('+7 (999) 123-45-67')).toBe('79991234567')
   })

   it('возвращает только цифры для номера без специального префикса', () => {
      expect(normalizePhone('9991234567')).toBe('9991234567')
   })
})
