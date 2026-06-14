import { useMemo, useState } from 'react'

import RowIcon from '../icons/row.svg?react'
import { useGetClientsQuery } from '../api/clientsApi'
import { useGetDealsQuery } from '../api/dealsApi'
import { useAppSelector } from '../app/hooks'
import { ColumnFilter } from '../components/ui/ColumnFilter/ColumnFilter'
import { Select } from '../components/ui/Select/Select'
import { selectCurrentUser } from '../features/auth/authSelectors'
import type { Client } from '../types/client'
import type { Deal, DealStatus } from '../types/deal'
import { formatCurrency, formatDate } from '../utils/format'

import styles from './ReportsPage.module.css'

type Tab = 'sales' | 'clients' | 'tasks'
type Period = 'week' | 'month' | 'year' | 'all'
type SortDirection = 'asc' | 'desc'

type SalesSortKey = 'index' | 'title' | 'clientName' | 'amount' | 'completedAt'
type StagesSortKey = 'label' | 'count' | 'total'
type StageRow = { count: number; key: DealStatus; label: string; total: number }

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

   const { data: deals = [] } = useGetDealsQuery()
   const { data: clients = [] } = useGetClientsQuery()
   const currentUser = useAppSelector(selectCurrentUser)

   const userDeals = useMemo(
      () => deals.filter((d) => d.createdBy === currentUser?.id),
      [deals, currentUser?.id],
   )

   const clientMap = useMemo(() => new Map(clients.map((c) => [c.id, c])), [clients])

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
                                       <span className={styles.cardId}>{(salesPage - 1) * PAGE_SIZE + i + 1}</span>
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
                                       {(salesPage - 1) * PAGE_SIZE + i + 1}
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

         {activeTab !== 'sales' && (
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
   onPeriodChange: (p: Period) => void
   onViewModeChange: (v: 'list' | 'cards') => void
   period: Period
   viewMode: 'list' | 'cards'
}

function SectionToolbar({ onPeriodChange, onViewModeChange, period, viewMode }: ToolbarProps) {
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
         <button className={styles.exportBtn} type="button">
            Экспорт в PDF
         </button>
         <button className={styles.exportBtn} type="button">
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