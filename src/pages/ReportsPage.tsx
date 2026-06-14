import { useMemo, useState } from 'react'

import RowIcon from '../icons/row.svg?react'
import { useGetClientsQuery } from '../api/clientsApi'
import { useGetDealsQuery } from '../api/dealsApi'
import { useGetTasksQuery } from '../api/tasksApi'
import { useAppSelector } from '../app/hooks'
import { ColumnFilter } from '../components/ui/ColumnFilter/ColumnFilter'
import { Select } from '../components/ui/Select/Select'
import { selectCurrentUser } from '../features/auth/authSelectors'
import type { Client } from '../types/client'
import type { Deal, DealStatus } from '../types/deal'
import { exportToExcel, exportToPDF, type ExportRow } from '../utils/export'
import { formatCurrency, formatDate } from '../utils/format'

import styles from './ReportsPage.module.css'

type Tab = 'sales' | 'clients' | 'tasks'
type Period = 'week' | 'month' | 'year' | 'all'
type SortDirection = 'asc' | 'desc'

type SalesSortKey = 'index' | 'title' | 'clientName' | 'amount' | 'completedAt'
type StagesSortKey = 'label' | 'count' | 'total'
type StageRow = { count: number; key: DealStatus; label: string; total: number }

type NewClientsSortKey = 'clientId' | 'name' | 'company' | 'createdAt'
type ActivitySortKey = 'clientId' | 'name' | 'dealCount' | 'completedTasks'
type ActivityRow = { clientId: string; completedTasks: number; createdAt: string; dealCount: number; name: string }

const TABS: { id: Tab; label: string }[] = [
   { id: 'sales', label: 'Отчёты по продажам' },
   { id: 'clients', label: 'Отчёты по клиентам' },
   { id: 'tasks', label: 'Отчёты по задачам' },
]

const PERIOD_OPTIONS: { value: Period; label: string }[] = [
   { value: 'week', label: 'За неделю' },
   { value: 'month', label: 'За месяц' },
   { value: 'year', label: 'За год' },
   { value: 'all', label: 'Всё время' },
]

const STATUS_ORDER: DealStatus[] = ['in_progress', 'new', 'completed', 'cancelled']

const STATUS_LABELS: Record<DealStatus, string> = {
   in_progress: 'В работе',
   new: 'Новая',
   completed: 'Завершена',
   cancelled: 'Отменена',
}

const SALES_COLUMNS: { key: SalesSortKey; label: string; rightAlign?: boolean }[] = [
   { key: 'index', label: 'ID сделки' },
   { key: 'title', label: 'Название' },
   { key: 'clientName', label: 'Клиент' },
   { key: 'amount', label: 'Сумма', rightAlign: true },
   { key: 'completedAt', label: 'Дата завершения', rightAlign: true },
]

const STAGES_COLUMNS: { key: StagesSortKey; label: string; rightAlign?: boolean }[] = [
   { key: 'label', label: 'Этап сделки' },
   { key: 'count', label: 'Количество сделок на этапе' },
   { key: 'total', label: 'Общая сумма сделок на этапе', rightAlign: true },
]

const NEW_CLIENTS_COLUMNS: { key: NewClientsSortKey; label: string; rightAlign?: boolean }[] = [
   { key: 'clientId', label: 'ID клиента' },
   { key: 'name', label: 'Имя клиента' },
   { key: 'company', label: 'Компания' },
   { key: 'createdAt', label: 'Дата добавления', rightAlign: true },
]

const ACTIVITY_COLUMNS: { key: ActivitySortKey; label: string; rightAlign?: boolean }[] = [
   { key: 'clientId', label: 'ID клиента' },
   { key: 'name', label: 'Имя клиента' },
   { key: 'dealCount', label: 'Количество сделок' },
   { key: 'completedTasks', label: 'Завершённые задачи' },
]

const PAGE_SIZE = 5

function cutoffDate(period: Period): Date | null {
   if (period === 'all') return null
   const cutoff = new Date()
   if (period === 'week') cutoff.setDate(cutoff.getDate() - 7)
   else if (period === 'month') cutoff.setMonth(cutoff.getMonth() - 1)
   else cutoff.setFullYear(cutoff.getFullYear() - 1)
   return cutoff
}

function firstName(fullName: string): string {
   return fullName.split(' ')[0]
}

function getSalesDisplayVal(deal: Deal, key: SalesSortKey, clientMap: Map<string, Client>): string {
   if (key === 'index') return ''
   if (key === 'title') return deal.title
   if (key === 'clientName') return firstName(clientMap.get(deal.clientId)?.name ?? '')
   if (key === 'amount') return formatCurrency(deal.amount)
   if (key === 'completedAt') return formatDate(deal.completedAt)
   return ''
}

function getStagesDisplayVal(stage: StageRow, key: StagesSortKey): string {
   if (key === 'label') return stage.label
   if (key === 'count') return String(stage.count)
   if (key === 'total') return formatCurrency(stage.total)
   return ''
}

function getNewClientDisplayVal(client: Client, key: NewClientsSortKey): string {
   if (key === 'clientId') return ''
   if (key === 'name') return firstName(client.name)
   if (key === 'company') return client.company
   if (key === 'createdAt') return formatDate(client.createdAt)
   return ''
}

function getActivityDisplayVal(row: ActivityRow, key: ActivitySortKey): string {
   if (key === 'clientId') return ''
   if (key === 'name') return row.name
   if (key === 'dealCount') return String(row.dealCount)
   if (key === 'completedTasks') return String(row.completedTasks)
   return ''
}

export function ReportsPage() {
   const [activeTab, setActiveTab] = useState<Tab>('sales')

   const [salesPeriod, setSalesPeriod] = useState<Period>('year')
   const [salesPage, setSalesPage] = useState(1)
   const [salesSortKey, setSalesSortKey] = useState<SalesSortKey>('completedAt')
   const [salesSortDir, setSalesSortDir] = useState<SortDirection>('desc')
   const [salesSortActive, setSalesSortActive] = useState(false)
   const [salesColFilters, setSalesColFilters] = useState<Partial<Record<SalesSortKey, string[]>>>({})

   const [salesViewMode, setSalesViewMode] = useState<'list' | 'cards'>('list')

   const [stagesPeriod, setStagesPeriod] = useState<Period>('year')
   const [stagesPage, setStagesPage] = useState(1)
   const [stagesViewMode, setStagesViewMode] = useState<'list' | 'cards'>('list')
   const [stagesSortKey, setStagesSortKey] = useState<StagesSortKey>('label')
   const [stagesSortDir, setStagesSortDir] = useState<SortDirection>('asc')
   const [stagesSortActive, setStagesSortActive] = useState(false)
   const [stagesColFilters, setStagesColFilters] = useState<Partial<Record<StagesSortKey, string[]>>>({})

   const [newClientsPeriod, setNewClientsPeriod] = useState<Period>('year')
   const [newClientsPage, setNewClientsPage] = useState(1)
   const [newClientsSortKey, setNewClientsSortKey] = useState<NewClientsSortKey>('createdAt')
   const [newClientsSortDir, setNewClientsSortDir] = useState<SortDirection>('desc')
   const [newClientsSortActive, setNewClientsSortActive] = useState(false)
   const [newClientsColFilters, setNewClientsColFilters] = useState<Partial<Record<NewClientsSortKey, string[]>>>({})
   const [newClientsViewMode, setNewClientsViewMode] = useState<'list' | 'cards'>('list')

   const [activityPeriod, setActivityPeriod] = useState<Period>('year')
   const [activityPage, setActivityPage] = useState(1)
   const [activitySortKey, setActivitySortKey] = useState<ActivitySortKey>('name')
   const [activitySortDir, setActivitySortDir] = useState<SortDirection>('asc')
   const [activitySortActive, setActivitySortActive] = useState(false)
   const [activityColFilters, setActivityColFilters] = useState<Partial<Record<ActivitySortKey, string[]>>>({})
   const [activityViewMode, setActivityViewMode] = useState<'list' | 'cards'>('list')

   const { data: deals = [] } = useGetDealsQuery()
   const { data: clients = [] } = useGetClientsQuery()
   const { data: tasks = [] } = useGetTasksQuery()
   const currentUser = useAppSelector(selectCurrentUser)

   const userDeals = useMemo(
      () => deals.filter((d) => d.createdBy === currentUser?.id),
      [deals, currentUser?.id],
   )

   const clientMap = useMemo(() => new Map(clients.map((c) => [c.id, c])), [clients])

   const dealIndexMap = useMemo(() => {
      const sorted = [...userDeals].sort(
         (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
      )
      return new Map(sorted.map((d, i) => [d.id, i + 1]))
   }, [userDeals])

   const salesDealsBase = useMemo(() => {
      const cutoff = cutoffDate(salesPeriod)
      const completed = userDeals.filter((d) => d.status === 'completed')
      return cutoff
         ? completed.filter((d) => d.completedAt && new Date(d.completedAt) >= cutoff)
         : completed
   }, [userDeals, salesPeriod])

   const salesColOptions = useMemo(() => {
      const opts: Partial<Record<SalesSortKey, string[]>> = {}
      for (const { key } of SALES_COLUMNS) {
         opts[key] = [...new Set(salesDealsBase.map((d) => getSalesDisplayVal(d, key, clientMap)))]
            .filter(Boolean)
            .sort()
      }
      return opts
   }, [salesDealsBase, clientMap])

   const salesDeals = useMemo(() => {
      let result = salesDealsBase
      for (const [key, values] of Object.entries(salesColFilters)) {
         if (!values || values.length === 0) continue
         result = result.filter((d) =>
            values.includes(getSalesDisplayVal(d, key as SalesSortKey, clientMap)),
         )
      }
      return [...result].sort((a, b) => {
         if (!salesSortActive) {
            return new Date(b.completedAt ?? 0).getTime() - new Date(a.completedAt ?? 0).getTime()
         }
         const dir = salesSortDir === 'asc' ? 1 : -1
         if (salesSortKey === 'index' || salesSortKey === 'completedAt') {
            return dir * (new Date(a.completedAt ?? 0).getTime() - new Date(b.completedAt ?? 0).getTime())
         }
         if (salesSortKey === 'amount') return dir * (a.amount - b.amount)
         if (salesSortKey === 'clientName') {
            const aN = clientMap.get(a.clientId)?.name ?? ''
            const bN = clientMap.get(b.clientId)?.name ?? ''
            return dir * aN.localeCompare(bN, 'ru')
         }
         return dir * a.title.localeCompare(b.title, 'ru')
      })
   }, [salesDealsBase, salesColFilters, salesSortKey, salesSortDir, salesSortActive, clientMap])

   const salesTotalPages = Math.max(1, Math.ceil(salesDeals.length / PAGE_SIZE))
   const salesPageDeals = salesDeals.slice((salesPage - 1) * PAGE_SIZE, salesPage * PAGE_SIZE)

   const stagesDataBase = useMemo(() => {
      const cutoff = cutoffDate(stagesPeriod)
      const filtered = cutoff
         ? userDeals.filter((d) => new Date(d.createdAt) >= cutoff)
         : userDeals
      return STATUS_ORDER.map((key) => ({
         key,
         label: STATUS_LABELS[key],
         count: filtered.filter((d) => d.status === key).length,
         total: filtered.filter((d) => d.status === key).reduce((sum, d) => sum + d.amount, 0),
      })).filter((s) => s.count > 0)
   }, [userDeals, stagesPeriod])

   const stagesColOptions = useMemo(() => {
      const opts: Partial<Record<StagesSortKey, string[]>> = {}
      for (const { key } of STAGES_COLUMNS) {
         opts[key] = [...new Set(stagesDataBase.map((s) => getStagesDisplayVal(s, key)))]
            .filter(Boolean)
            .sort()
      }
      return opts
   }, [stagesDataBase])

   const stagesData = useMemo(() => {
      let result = stagesDataBase
      for (const [key, values] of Object.entries(stagesColFilters)) {
         if (!values || values.length === 0) continue
         result = result.filter((s) =>
            values.includes(getStagesDisplayVal(s, key as StagesSortKey)),
         )
      }
      if (!stagesSortActive) return result
      return [...result].sort((a, b) => {
         const dir = stagesSortDir === 'asc' ? 1 : -1
         if (stagesSortKey === 'count') return dir * (a.count - b.count)
         if (stagesSortKey === 'total') return dir * (a.total - b.total)
         return dir * a.label.localeCompare(b.label, 'ru')
      })
   }, [stagesDataBase, stagesColFilters, stagesSortKey, stagesSortDir, stagesSortActive])

   const stagesTotalPages = Math.max(1, Math.ceil(stagesData.length / PAGE_SIZE))
   const stagesPageData = stagesData.slice((stagesPage - 1) * PAGE_SIZE, stagesPage * PAGE_SIZE)

   const userClients = useMemo(
      () => clients.filter((c) => c.createdBy === currentUser?.id && !c.deleted),
      [clients, currentUser?.id],
   )

   const clientIndexMap = useMemo(() => {
      const sorted = [...userClients].sort(
         (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
      )
      return new Map(sorted.map((c, i) => [c.id, i + 1]))
   }, [userClients])

   const newClientsBase = useMemo(() => {
      const cutoff = cutoffDate(newClientsPeriod)
      return cutoff ? userClients.filter((c) => new Date(c.createdAt) >= cutoff) : userClients
   }, [userClients, newClientsPeriod])

   const newClientsColOptions = useMemo(() => {
      const opts: Partial<Record<NewClientsSortKey, string[]>> = {}
      for (const { key } of NEW_CLIENTS_COLUMNS) {
         opts[key] = [...new Set(newClientsBase.map((c) => getNewClientDisplayVal(c, key)))]
            .filter(Boolean).sort()
      }
      return opts
   }, [newClientsBase])

   const newClientsData = useMemo(() => {
      let result = newClientsBase
      for (const [key, values] of Object.entries(newClientsColFilters)) {
         if (!values || values.length === 0) continue
         result = result.filter((c) =>
            values.includes(getNewClientDisplayVal(c, key as NewClientsSortKey)),
         )
      }
      return [...result].sort((a, b) => {
         if (!newClientsSortActive)
            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
         const dir = newClientsSortDir === 'asc' ? 1 : -1
         if (newClientsSortKey === 'clientId' || newClientsSortKey === 'createdAt')
            return dir * (new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
         if (newClientsSortKey === 'company') return dir * a.company.localeCompare(b.company, 'ru')
         return dir * firstName(a.name).localeCompare(firstName(b.name), 'ru')
      })
   }, [newClientsBase, newClientsColFilters, newClientsSortKey, newClientsSortDir, newClientsSortActive])

   const newClientsTotalPages = Math.max(1, Math.ceil(newClientsData.length / PAGE_SIZE))
   const newClientsPageData = newClientsData.slice((newClientsPage - 1) * PAGE_SIZE, newClientsPage * PAGE_SIZE)

   const activityDataBase = useMemo((): ActivityRow[] => {
      const cutoff = cutoffDate(activityPeriod)
      const filtered = cutoff
         ? userClients.filter((c) => new Date(c.createdAt) >= cutoff)
         : userClients
      return filtered.map((client) => {
         const clientDeals = userDeals.filter((d) => d.clientId === client.id)
         const dealIds = new Set(clientDeals.map((d) => d.id))
         const completedTasks = tasks.filter(
            (t) => t.dealId && dealIds.has(t.dealId) && t.status === 'completed',
         ).length
         return { clientId: client.id, name: firstName(client.name), createdAt: client.createdAt, dealCount: clientDeals.length, completedTasks }
      })
   }, [userClients, userDeals, tasks, activityPeriod])

   const activityColOptions = useMemo(() => {
      const opts: Partial<Record<ActivitySortKey, string[]>> = {}
      for (const { key } of ACTIVITY_COLUMNS) {
         opts[key] = [...new Set(activityDataBase.map((r) => getActivityDisplayVal(r, key)))]
            .filter(Boolean).sort()
      }
      return opts
   }, [activityDataBase])

   const activityData = useMemo(() => {
      let result = activityDataBase
      for (const [key, values] of Object.entries(activityColFilters)) {
         if (!values || values.length === 0) continue
         result = result.filter((r) =>
            values.includes(getActivityDisplayVal(r, key as ActivitySortKey)),
         )
      }
      if (!activitySortActive) return result
      return [...result].sort((a, b) => {
         const dir = activitySortDir === 'asc' ? 1 : -1
         if (activitySortKey === 'clientId')
            return dir * (new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
         if (activitySortKey === 'dealCount') return dir * (a.dealCount - b.dealCount)
         if (activitySortKey === 'completedTasks') return dir * (a.completedTasks - b.completedTasks)
         return dir * a.name.localeCompare(b.name, 'ru')
      })
   }, [activityDataBase, activityColFilters, activitySortKey, activitySortDir, activitySortActive])

   const activityTotalPages = Math.max(1, Math.ceil(activityData.length / PAGE_SIZE))
   const activityPageData = activityData.slice((activityPage - 1) * PAGE_SIZE, activityPage * PAGE_SIZE)

   const handleSalesSortAsc = (key: SalesSortKey) => {
      setSalesSortActive(true); setSalesSortKey(key); setSalesSortDir('asc'); setSalesPage(1)
   }
   const handleSalesSortDesc = (key: SalesSortKey) => {
      setSalesSortActive(true); setSalesSortKey(key); setSalesSortDir('desc'); setSalesPage(1)
   }
   const handleSalesFilter = (key: SalesSortKey, values: string[]) => {
      setSalesColFilters((prev) => ({ ...prev, [key]: values })); setSalesPage(1)
   }

   const handleStagesSortAsc = (key: StagesSortKey) => {
      setStagesSortActive(true); setStagesSortKey(key); setStagesSortDir('asc'); setStagesPage(1)
   }
   const handleStagesSortDesc = (key: StagesSortKey) => {
      setStagesSortActive(true); setStagesSortKey(key); setStagesSortDir('desc'); setStagesPage(1)
   }
   const handleStagesFilter = (key: StagesSortKey, values: string[]) => {
      setStagesColFilters((prev) => ({ ...prev, [key]: values })); setStagesPage(1)
   }

   const handleSalesExportExcel = () => {
      const columns = [
         { key: 'index', label: 'ID сделки' },
         { key: 'title', label: 'Название' },
         { key: 'clientName', label: 'Клиент' },
         { key: 'amount', label: 'Сумма, ₽', numFmt: '#,##0' },
         { key: 'completedAt', label: 'Дата завершения', numFmt: 'dd.mm.yyyy' },
      ]
      const rows: ExportRow[] = salesDeals.map((deal, i) => ({
         index: dealIndexMap.get(deal.id) ?? i + 1,
         title: deal.title,
         clientName: firstName(clientMap.get(deal.clientId)?.name ?? '—'),
         amount: deal.amount,
         completedAt: deal.completedAt ? new Date(deal.completedAt) : '',
      }))
      const periodLabel = PERIOD_OPTIONS.find((o) => o.value === salesPeriod)?.label ?? ''
      exportToExcel(`Отчёт по продажам — ${periodLabel}`, columns, rows)
   }

   const handleSalesExportPDF = () => {
      const columns = SALES_COLUMNS.map((c) => ({ key: c.key, label: c.label }))
      const rows: ExportRow[] = salesDeals.map((deal, i) => ({
         index: String(dealIndexMap.get(deal.id) ?? i + 1),
         title: deal.title,
         clientName: firstName(clientMap.get(deal.clientId)?.name ?? '—'),
         amount: formatCurrency(deal.amount),
         completedAt: formatDate(deal.completedAt),
      }))
      const periodLabel = PERIOD_OPTIONS.find((o) => o.value === salesPeriod)?.label ?? ''
      void exportToPDF(`Отчёт по продажам — ${periodLabel}`, columns, rows)
   }

   const handleStagesExportExcel = () => {
      const columns = STAGES_COLUMNS.map((c) => ({ key: c.key, label: c.label }))
      const rows: ExportRow[] = stagesData.map((stage) => ({
         label: stage.label,
         count: String(stage.count),
         total: formatCurrency(stage.total),
      }))
      const periodLabel = PERIOD_OPTIONS.find((o) => o.value === stagesPeriod)?.label ?? ''
      exportToExcel(`Этапы сделок — ${periodLabel}`, columns, rows)
   }

   const handleStagesExportPDF = () => {
      const columns = STAGES_COLUMNS.map((c) => ({ key: c.key, label: c.label }))
      const rows: ExportRow[] = stagesData.map((stage) => ({
         label: stage.label,
         count: String(stage.count),
         total: formatCurrency(stage.total),
      }))
      const periodLabel = PERIOD_OPTIONS.find((o) => o.value === stagesPeriod)?.label ?? ''
      void exportToPDF(`Этапы сделок — ${periodLabel}`, columns, rows)
   }

   const handleNewClientsSortAsc = (key: NewClientsSortKey) => {
      setNewClientsSortActive(true); setNewClientsSortKey(key); setNewClientsSortDir('asc'); setNewClientsPage(1)
   }
   const handleNewClientsSortDesc = (key: NewClientsSortKey) => {
      setNewClientsSortActive(true); setNewClientsSortKey(key); setNewClientsSortDir('desc'); setNewClientsPage(1)
   }
   const handleNewClientsFilter = (key: NewClientsSortKey, values: string[]) => {
      setNewClientsColFilters((prev) => ({ ...prev, [key]: values })); setNewClientsPage(1)
   }

   const handleActivitySortAsc = (key: ActivitySortKey) => {
      setActivitySortActive(true); setActivitySortKey(key); setActivitySortDir('asc'); setActivityPage(1)
   }
   const handleActivitySortDesc = (key: ActivitySortKey) => {
      setActivitySortActive(true); setActivitySortKey(key); setActivitySortDir('desc'); setActivityPage(1)
   }
   const handleActivityFilter = (key: ActivitySortKey, values: string[]) => {
      setActivityColFilters((prev) => ({ ...prev, [key]: values })); setActivityPage(1)
   }

   const handleNewClientsExportExcel = () => {
      const columns = [
         { key: 'clientId', label: 'ID клиента' },
         { key: 'name', label: 'Имя клиента' },
         { key: 'company', label: 'Компания' },
         { key: 'createdAt', label: 'Дата добавления', numFmt: 'dd.mm.yyyy' },
      ]
      const rows: ExportRow[] = newClientsData.map((c, i) => ({
         clientId: clientIndexMap.get(c.id) ?? i + 1,
         name: c.name,
         company: c.company,
         createdAt: new Date(c.createdAt),
      }))
      const periodLabel = PERIOD_OPTIONS.find((o) => o.value === newClientsPeriod)?.label ?? ''
      exportToExcel(`Новые клиенты — ${periodLabel}`, columns, rows)
   }

   const handleNewClientsExportPDF = () => {
      const columns = NEW_CLIENTS_COLUMNS.map((c) => ({ key: c.key, label: c.label }))
      const rows: ExportRow[] = newClientsData.map((c, i) => ({
         clientId: String(clientIndexMap.get(c.id) ?? i + 1),
         name: c.name,
         company: c.company,
         createdAt: formatDate(c.createdAt),
      }))
      const periodLabel = PERIOD_OPTIONS.find((o) => o.value === newClientsPeriod)?.label ?? ''
      void exportToPDF(`Новые клиенты — ${periodLabel}`, columns, rows)
   }

   const handleActivityExportExcel = () => {
      const fullNameMap = new Map(userClients.map((c) => [c.id, c.name]))
      const columns = [
         { key: 'clientId', label: 'ID клиента' },
         { key: 'name', label: 'Имя клиента' },
         { key: 'dealCount', label: 'Количество сделок', numFmt: '#,##0' },
         { key: 'completedTasks', label: 'Завершённые задачи', numFmt: '#,##0' },
      ]
      const rows: ExportRow[] = activityData.map((r, i) => ({
         clientId: clientIndexMap.get(r.clientId) ?? i + 1,
         name: fullNameMap.get(r.clientId) ?? r.name,
         dealCount: r.dealCount,
         completedTasks: r.completedTasks,
      }))
      const periodLabel = PERIOD_OPTIONS.find((o) => o.value === activityPeriod)?.label ?? ''
      exportToExcel(`Активности клиентов — ${periodLabel}`, columns, rows)
   }

   const handleActivityExportPDF = () => {
      const fullNameMap = new Map(userClients.map((c) => [c.id, c.name]))
      const columns = ACTIVITY_COLUMNS.map((c) => ({ key: c.key, label: c.label }))
      const rows: ExportRow[] = activityData.map((r, i) => ({
         clientId: String(clientIndexMap.get(r.clientId) ?? i + 1),
         name: fullNameMap.get(r.clientId) ?? r.name,
         dealCount: String(r.dealCount),
         completedTasks: String(r.completedTasks),
      }))
      const periodLabel = PERIOD_OPTIONS.find((o) => o.value === activityPeriod)?.label ?? ''
      void exportToPDF(`Активности клиентов — ${periodLabel}`, columns, rows)
   }

   return (
      <div className={styles.page}>
         <h1 className={styles.pageTitle}>Отчёты</h1>

         <div className={styles.tabsSection}>
            <div className={styles.tabList}>
               {TABS.map((tab) => (
                  <button
                     key={tab.id}
                     className={styles.tab}
                     type="button"
                     onClick={() => setActiveTab(tab.id)}
                  >
                     <span className={activeTab === tab.id ? styles.tabLabelActive : styles.tabLabel}>
                        {tab.label}
                     </span>
                     <span className={activeTab === tab.id ? styles.tabUnderlineActive : styles.tabUnderline} />
                  </button>
               ))}
            </div>
            <div className={styles.tabSeparator} />
         </div>

         {activeTab === 'sales' && (
            <div className={styles.content}>
               <div className={styles.section}>
                  <h2 className={styles.sectionTitle}>Общий, продажи</h2>
                  <SectionToolbar
                     period={salesPeriod}
                     viewMode={salesViewMode}
                     onExportExcel={handleSalesExportExcel}
                     onExportPDF={handleSalesExportPDF}
                     onPeriodChange={(p) => { setSalesPeriod(p); setSalesPage(1) }}
                     onViewModeChange={setSalesViewMode}
                  />
                  {salesViewMode === 'cards' ? (
                     salesPageDeals.length === 0
                        ? <p className={styles.empty}>Нет данных за выбранный период</p>
                        : (
                           <div className={styles.cardsGrid}>
                              {salesPageDeals.map((deal, i) => (
                                 <div key={deal.id} className={styles.card}>
                                    <div className={styles.cardTop}>
                                       <span className={styles.cardId}>{dealIndexMap.get(deal.id) ?? i + 1}</span>
                                       <span className={styles.cardClient}>{firstName(clientMap.get(deal.clientId)?.name ?? '—')}</span>
                                       <span className={styles.cardMeta}>{deal.title}</span>
                                    </div>
                                    <div className={styles.cardBottom}>
                                       <span className={styles.cardPrimary}>{formatCurrency(deal.amount)}</span>
                                       <span className={styles.cardSecondary}>{formatDate(deal.completedAt)}</span>
                                    </div>
                                 </div>
                              ))}
                           </div>
                        )
                  ) : (
                     <div className={styles.tableContainer}>
                        <div className={styles.tableHead}>
                           {SALES_COLUMNS.map(({ key, label, rightAlign }) => (
                              <ColumnFilter
                                 key={key}
                                 className={styles.thFilter}
                                 iconVariant="select"
                                 isActive={salesSortKey === key && salesSortActive}
                                 label={label}
                                 options={salesColOptions[key] ?? []}
                                 rightAlign={rightAlign}
                                 selectedValues={salesColFilters[key] ?? []}
                                 sortDirection={salesSortDir}
                                 onFilterChange={(values) => handleSalesFilter(key, values)}
                                 onSortAsc={() => handleSalesSortAsc(key)}
                                 onSortDesc={() => handleSalesSortDesc(key)}
                              />
                           ))}
                        </div>
                        <div className={styles.tableRows}>
                           {salesPageDeals.length === 0 ? (
                              <p className={styles.empty}>Нет данных за выбранный период</p>
                           ) : (
                              salesPageDeals.map((deal, i) => (
                                 <div key={deal.id} className={styles.tableRow}>
                                    <span className={styles.cell}>
                                       {dealIndexMap.get(deal.id) ?? i + 1}
                                    </span>
                                    <span className={styles.cell}>{deal.title}</span>
                                    <span className={styles.cell}>
                                       {firstName(clientMap.get(deal.clientId)?.name ?? '—')}
                                    </span>
                                    <span className={`${styles.cell} ${styles.cellRight}`}>
                                       {formatCurrency(deal.amount)}
                                    </span>
                                    <span className={`${styles.cell} ${styles.cellRight}`}>
                                       {formatDate(deal.completedAt)}
                                    </span>
                                 </div>
                              ))
                           )}
                        </div>
                     </div>
                  )}
                  <PaginationBar page={salesPage} total={salesTotalPages} onChange={setSalesPage} />
               </div>

               <div className={styles.section}>
                  <h2 className={styles.sectionTitle}>Этапы сделок</h2>
                  <SectionToolbar
                     period={stagesPeriod}
                     viewMode={stagesViewMode}
                     onExportExcel={handleStagesExportExcel}
                     onExportPDF={handleStagesExportPDF}
                     onPeriodChange={(p) => { setStagesPeriod(p); setStagesPage(1) }}
                     onViewModeChange={setStagesViewMode}
                  />
                  {stagesViewMode === 'cards' ? (
                     stagesPageData.length === 0
                        ? <p className={styles.empty}>Нет данных за выбранный период</p>
                        : (
                           <div className={styles.cardsGrid}>
                              {stagesPageData.map((stage) => (
                                 <div key={stage.key} className={`${styles.card} ${styles[`stageRow_${stage.key}`]}`}>
                                    <div className={styles.cardTop}>
                                       <span className={`${styles.cardClient} ${styles[`stageLabel_${stage.key}`]}`}>{stage.label}</span>
                                    </div>
                                    <div className={styles.cardBottom}>
                                       <span className={styles.cardPrimary}>{formatCurrency(stage.total)}</span>
                                       <span className={styles.cardSecondary}>{stage.count} сделок</span>
                                    </div>
                                 </div>
                              ))}
                           </div>
                        )
                  ) : (
                     <div className={styles.tableContainer}>
                        <div className={styles.tableHead}>
                           {STAGES_COLUMNS.map(({ key, label, rightAlign }) => (
                              <ColumnFilter
                                 key={key}
                                 className={styles.thFilter}
                                 iconVariant="select"
                                 isActive={stagesSortKey === key && stagesSortActive}
                                 label={label}
                                 options={stagesColOptions[key] ?? []}
                                 rightAlign={rightAlign}
                                 selectedValues={stagesColFilters[key] ?? []}
                                 sortDirection={stagesSortDir}
                                 onFilterChange={(values) => handleStagesFilter(key, values)}
                                 onSortAsc={() => handleStagesSortAsc(key)}
                                 onSortDesc={() => handleStagesSortDesc(key)}
                              />
                           ))}
                        </div>
                        <div className={styles.tableRows}>
                           {stagesPageData.length === 0 ? (
                              <p className={styles.empty}>Нет данных за выбранный период</p>
                           ) : (
                              stagesPageData.map((stage) => (
                                 <div
                                    key={stage.key}
                                    className={`${styles.tableRow} ${styles[`stageRow_${stage.key}`]}`}
                                 >
                                    <span className={`${styles.cell} ${styles[`stageLabel_${stage.key}`]}`}>
                                       {stage.label}
                                    </span>
                                    <span className={styles.cell}>{stage.count}</span>
                                    <span className={`${styles.cell} ${styles.cellRight}`}>
                                       {formatCurrency(stage.total)}
                                    </span>
                                 </div>
                              ))
                           )}
                        </div>
                     </div>
                  )}
                  <PaginationBar page={stagesPage} total={stagesTotalPages} onChange={setStagesPage} />
               </div>
            </div>
         )}

         {activeTab === 'clients' && (
            <div className={styles.content}>
               <div className={styles.section}>
                  <h2 className={styles.sectionTitle}>Новые клиенты</h2>
                  <SectionToolbar
                     period={newClientsPeriod}
                     viewMode={newClientsViewMode}
                     onExportExcel={handleNewClientsExportExcel}
                     onExportPDF={handleNewClientsExportPDF}
                     onPeriodChange={(p) => { setNewClientsPeriod(p); setNewClientsPage(1) }}
                     onViewModeChange={setNewClientsViewMode}
                  />
                  {newClientsViewMode === 'cards' ? (
                     newClientsPageData.length === 0
                        ? <p className={styles.empty}>Нет данных за выбранный период</p>
                        : (
                           <div className={styles.cardsGrid}>
                              {newClientsPageData.map((client, i) => (
                                 <div key={client.id} className={styles.card}>
                                    <div className={styles.cardTop}>
                                       <span className={styles.cardId}>{clientIndexMap.get(client.id) ?? i + 1}</span>
                                       <span className={styles.cardClient}>{firstName(client.name)}</span>
                                       <span className={styles.cardMeta}>{client.company}</span>
                                    </div>
                                    <div className={styles.cardBottom}>
                                       <span className={styles.cardPrimary}>{formatDate(client.createdAt)}</span>
                                    </div>
                                 </div>
                              ))}
                           </div>
                        )
                  ) : (
                     <div className={styles.tableContainer}>
                        <div className={styles.tableHead}>
                           {NEW_CLIENTS_COLUMNS.map(({ key, label, rightAlign }) => (
                              <ColumnFilter
                                 key={key}
                                 className={styles.thFilter}
                                 iconVariant="select"
                                 isActive={newClientsSortKey === key && newClientsSortActive}
                                 label={label}
                                 options={newClientsColOptions[key] ?? []}
                                 rightAlign={rightAlign}
                                 selectedValues={newClientsColFilters[key] ?? []}
                                 sortDirection={newClientsSortDir}
                                 onFilterChange={(values) => handleNewClientsFilter(key, values)}
                                 onSortAsc={() => handleNewClientsSortAsc(key)}
                                 onSortDesc={() => handleNewClientsSortDesc(key)}
                              />
                           ))}
                        </div>
                        <div className={styles.tableRows}>
                           {newClientsPageData.length === 0 ? (
                              <p className={styles.empty}>Нет данных за выбранный период</p>
                           ) : (
                              newClientsPageData.map((client, i) => (
                                 <div key={client.id} className={styles.tableRow}>
                                    <span className={styles.cell}>{clientIndexMap.get(client.id) ?? i + 1}</span>
                                    <span className={styles.cell}>{firstName(client.name)}</span>
                                    <span className={styles.cell}>{client.company}</span>
                                    <span className={`${styles.cell} ${styles.cellRight}`}>{formatDate(client.createdAt)}</span>
                                 </div>
                              ))
                           )}
                        </div>
                     </div>
                  )}
                  <PaginationBar page={newClientsPage} total={newClientsTotalPages} onChange={setNewClientsPage} />
               </div>

               <div className={styles.section}>
                  <h2 className={styles.sectionTitle}>Активности клиентов</h2>
                  <SectionToolbar
                     period={activityPeriod}
                     viewMode={activityViewMode}
                     onExportExcel={handleActivityExportExcel}
                     onExportPDF={handleActivityExportPDF}
                     onPeriodChange={(p) => { setActivityPeriod(p); setActivityPage(1) }}
                     onViewModeChange={setActivityViewMode}
                  />
                  {activityViewMode === 'cards' ? (
                     activityPageData.length === 0
                        ? <p className={styles.empty}>Нет данных за выбранный период</p>
                        : (
                           <div className={styles.cardsGrid}>
                              {activityPageData.map((row, i) => (
                                 <div key={row.clientId} className={styles.card}>
                                    <div className={styles.cardTop}>
                                       <span className={styles.cardId}>{clientIndexMap.get(row.clientId) ?? i + 1}</span>
                                       <span className={styles.cardClient}>{row.name}</span>
                                    </div>
                                    <div className={styles.cardBottom}>
                                       <span className={styles.cardPrimary}>{row.dealCount} сделок</span>
                                       <span className={styles.cardSecondary}>{row.completedTasks} задач</span>
                                    </div>
                                 </div>
                              ))}
                           </div>
                        )
                  ) : (
                     <div className={styles.tableContainer}>
                        <div className={styles.tableHead}>
                           {ACTIVITY_COLUMNS.map(({ key, label, rightAlign }) => (
                              <ColumnFilter
                                 key={key}
                                 className={styles.thFilter}
                                 iconVariant="select"
                                 isActive={activitySortKey === key && activitySortActive}
                                 label={label}
                                 options={activityColOptions[key] ?? []}
                                 rightAlign={rightAlign}
                                 selectedValues={activityColFilters[key] ?? []}
                                 sortDirection={activitySortDir}
                                 onFilterChange={(values) => handleActivityFilter(key, values)}
                                 onSortAsc={() => handleActivitySortAsc(key)}
                                 onSortDesc={() => handleActivitySortDesc(key)}
                              />
                           ))}
                        </div>
                        <div className={styles.tableRows}>
                           {activityPageData.length === 0 ? (
                              <p className={styles.empty}>Нет данных за выбранный период</p>
                           ) : (
                              activityPageData.map((row, i) => (
                                 <div key={row.clientId} className={styles.tableRow}>
                                    <span className={styles.cell}>{clientIndexMap.get(row.clientId) ?? i + 1}</span>
                                    <span className={styles.cell}>{row.name}</span>
                                    <span className={styles.cell}>{row.dealCount}</span>
                                    <span className={styles.cell}>{row.completedTasks}</span>
                                 </div>
                              ))
                           )}
                        </div>
                     </div>
                  )}
                  <PaginationBar page={activityPage} total={activityTotalPages} onChange={setActivityPage} />
               </div>
            </div>
         )}

         {activeTab === 'tasks' && (
            <p className={styles.stub}>Раздел в разработке</p>
         )}
      </div>
   )
}

const VIEW_OPTIONS: { value: 'list' | 'cards'; label: string }[] = [
   { value: 'list', label: 'Списком' },
   { value: 'cards', label: 'Карточками' },
]

type ToolbarProps = {
   onExportExcel: () => void
   onExportPDF: () => void
   onPeriodChange: (p: Period) => void
   onViewModeChange: (v: 'list' | 'cards') => void
   period: Period
   viewMode: 'list' | 'cards'
}

function SectionToolbar({ onExportExcel, onExportPDF, onPeriodChange, onViewModeChange, period, viewMode }: ToolbarProps) {
   return (
      <div className={styles.toolbar}>
         <Select
            options={PERIOD_OPTIONS}
            value={period}
            onChange={(v) => onPeriodChange(v as Period)}
         />
         <Select
            options={VIEW_OPTIONS}
            value={viewMode}
            onChange={(v) => onViewModeChange(v as 'list' | 'cards')}
         />
         <div className={styles.toolbarSpacer} />
         <button className={styles.exportBtn} type="button" onClick={onExportPDF}>
            Экспорт в PDF
         </button>
         <button className={styles.exportBtn} type="button" onClick={onExportExcel}>
            Экспорт в XLSX
         </button>
      </div>
   )
}

function getPageNumbers(current: number, total: number): (number | '...')[] {
   if (total <= 5) return Array.from({ length: total }, (_, i) => i + 1)
   const result: (number | '...')[] = [1]
   const start = Math.max(2, current - 1)
   const end = Math.min(total - 1, current + 1)
   if (start > 2) result.push('...')
   for (let i = start; i <= end; i++) result.push(i)
   if (end < total - 1) result.push('...')
   result.push(total)
   return result
}

type PaginationBarProps = { onChange: (page: number) => void; page: number; total: number }

function PaginationBar({ onChange, page, total }: PaginationBarProps) {
   const [jumpValue, setJumpValue] = useState('')

   const handleJump = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key !== 'Enter') return
      const n = parseInt(jumpValue, 10)
      if (!isNaN(n) && n >= 1 && n <= total) onChange(n)
      setJumpValue('')
   }

   const pages = getPageNumbers(page, total)

   return (
      <div className={styles.pagination}>
         <div className={styles.paginationPages}>
            <button
               className={styles.pageNavBtn}
               disabled={page <= 1}
               type="button"
               onClick={() => onChange(page - 1)}
            >
               <RowIcon aria-hidden="true" className={styles.arrowLeft} />
            </button>

            {pages.map((p, i) =>
               p === '...'
                  ? <span key={`dots-${i}`} className={styles.pageEllipsis}>...</span>
                  : (
                     <button
                        key={p}
                        className={[styles.pageBtn, p === page ? styles.pageBtnActive : ''].filter(Boolean).join(' ')}
                        type="button"
                        onClick={() => onChange(p)}
                     >
                        {p}
                     </button>
                  )
            )}

            <button
               className={styles.pageNavBtn}
               disabled={page >= total}
               type="button"
               onClick={() => onChange(page + 1)}
            >
               <RowIcon aria-hidden="true" className={styles.arrowRight} />
            </button>
         </div>

         <div className={styles.paginationJump}>
            <input
               className={styles.pageJumpInput}
               placeholder={String(total)}
               type="text"
               value={jumpValue}
               onChange={(e) => setJumpValue(e.target.value)}
               onKeyDown={handleJump}
            />
            <span className={styles.pageJumpLabel}>Переход на страницу</span>
         </div>
      </div>
   )
}