export const formatDate = (value: string | undefined): string => {
   if (!value) return '—'
   return new Intl.DateTimeFormat('ru-RU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
   })
      .format(new Date(value))
      .replace(' г.', '')
}

export const formatShortDate = (value: string | undefined): string => {
   if (!value) return '—'
   return new Intl.DateTimeFormat('ru-RU', {
      day: 'numeric',
      month: 'long',
   }).format(new Date(value))
}

export const formatCurrency = (value: number): string =>
   new Intl.NumberFormat('ru-RU', {
      currency: 'RUB',
      maximumFractionDigits: 0,
      style: 'currency',
   }).format(value)

export const formatWebsite = (url?: string): string => {
   if (!url) return '—'
   return url.replace(/^https?:\/\//, '')
}

export const formatPhone = (phone: string): string => {
   const digits = phone.replace(/\D/g, '')
   if (digits.length === 11 && digits.startsWith('7')) {
      return `+7 ${digits.slice(1, 4)} ${digits.slice(4, 7)}-${digits.slice(7, 9)}-${digits.slice(9, 11)}`
   }
   return phone
}

export const normalizePhone = (phone: string): string => {
   const digits = phone.replace(/\D/g, '')
   if (digits.length === 11 && digits.startsWith('8')) {
      return '7' + digits.slice(1)
   }
   return digits
}