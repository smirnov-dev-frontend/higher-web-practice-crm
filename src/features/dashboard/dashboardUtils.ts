import type { Client } from '../../types/client'
import type { Deal } from '../../types/deal'
import type { Task } from '../../types/task'

const startOfDay = (date: Date) => new Date(date.getFullYear(), date.getMonth(), date.getDate())

const startOfWeek = (date: Date) => {
   const result = startOfDay(date)
   const day = result.getDay() || 7
   result.setDate(result.getDate() - day + 1)
   return result
}

const startOfMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth(), 1)

const startOfQuarter = (date: Date) => {
   const quarterMonth = Math.floor(date.getMonth() / 3) * 3
   return new Date(date.getFullYear(), quarterMonth, 1)
}

const isAfterDate = (value: string | undefined, date: Date) => {
   if (!value) {
      return false
   }

   return new Date(value) >= date
}

export const formatCurrency = (value: number) =>
   new Intl.NumberFormat('ru-RU', {
      currency: 'RUB',
      maximumFractionDigits: 0,
      style: 'currency',
   }).format(value)

export const formatDate = (value: string | undefined) => {
   if (!value) {
      return '—'
   }

   return new Intl.DateTimeFormat('ru-RU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
   }).format(new Date(value))
}

export const getDashboardStats = (clients: Client[], deals: Deal[]) => {
   const now = new Date()
   const today = startOfDay(now)
   const week = startOfWeek(now)
   const month = startOfMonth(now)
   const quarter = startOfQuarter(now)

   const activeDeals = deals.filter((deal) => deal.status === 'new' || deal.status === 'in_progress')
   const completedDeals = deals.filter((deal) => deal.status === 'completed')

   return {
      activeDeals: {
         month: activeDeals.filter((deal) => isAfterDate(deal.createdAt, month)).length,
         quarter: activeDeals.filter((deal) => isAfterDate(deal.createdAt, quarter)).length,
         today: activeDeals.length,
         todayAdded: activeDeals.filter((deal) => isAfterDate(deal.createdAt, today)).length,
         week: activeDeals.filter((deal) => isAfterDate(deal.createdAt, week)).length,
      },
      clients: {
         month: clients.filter((client) => isAfterDate(client.createdAt, month)).length,
         quarter: clients.filter((client) => isAfterDate(client.createdAt, quarter)).length,
         today: clients.length,
         todayAdded: clients.filter((client) => isAfterDate(client.createdAt, today)).length,
         week: clients.filter((client) => isAfterDate(client.createdAt, week)).length,
      },
      completedDeals: {
         month: completedDeals.filter((deal) => isAfterDate(deal.completedAt ?? deal.createdAt, month)).length,
         quarter: completedDeals.filter((deal) => isAfterDate(deal.completedAt ?? deal.createdAt, quarter))
            .length,
         today: completedDeals.length,
         todayAdded: completedDeals.filter((deal) => isAfterDate(deal.completedAt ?? deal.createdAt, today))
            .length,
         week: completedDeals.filter((deal) => isAfterDate(deal.completedAt ?? deal.createdAt, week)).length,
      },
   }
}

export const getTopClients = (clients: Client[], deals: Deal[]) =>
   clients
      .map((client) => ({
         client,
         dealsCount: deals.filter((deal) => deal.clientId === client.id).length,
      }))
      .filter((item) => item.dealsCount > 0)
      .sort((first, second) => second.dealsCount - first.dealsCount)
      .slice(0, 10)

export const getRecentDeals = (deals: Deal[]) =>
   [...deals].sort((first, second) => Number(new Date(second.createdAt)) - Number(new Date(first.createdAt))).slice(0, 10)

export const getRecentTasks = (tasks: Task[]) =>
   [...tasks].sort((first, second) => Number(new Date(second.createdAt)) - Number(new Date(first.createdAt))).slice(0, 10)