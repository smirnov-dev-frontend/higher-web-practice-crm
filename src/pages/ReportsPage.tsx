import { useMemo, useState } from 'react'

import { useGetClientsQuery } from '../api/clientsApi'
import { useGetDealsQuery } from '../api/dealsApi'
import { useAppSelector } from '../app/hooks'
import { selectCurrentUser } from '../features/auth/authSelectors'
import type { DealStatus } from '../types/deal'
import { formatCurrency, formatDate } from '../utils/format'

import styles from './ReportsPage.module.css'

type Tab = 'sales' | 'clients' | 'tasks'
type Period = 'week' | 'month' | 'year' | 'all'

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

const PAGE_SIZE = 5

function cutoffDate(period: Period): Date | null {
   if (period === 'all') return null
   const cutoff = new Date()
   if (period === 'week') cutoff.setDate(cutoff.getDate() - 7)
   else if (period === 'month') cutoff.setMonth(cutoff.getMonth() - 1)
   else cutoff.setFullYear(cutoff.getFullYear() - 1)
   return cutoff
}

export function ReportsPage() {
   const [activeTab, setActiveTab] = useState<Tab>('sales')
   const [salesPeriod, setSalesPeriod] = useState<Period>('year')
   const [salesPage, setSalesPage] = useState(1)
   const [stagesPeriod, setStagesPeriod] = useState<Period>('year')
   const [stagesPage, setStagesPage] = useState(1)

   const { data: deals = [] } = useGetDealsQuery()
   const { data: clients = [] } = useGetClientsQuery()
   const currentUser = useAppSelector(selectCurrentUser)

   const userDeals = useMemo(
      () => deals.filter((d) => d.createdBy === currentUser?.id),
      [deals, currentUser?.id],
   )

   const getClientName = (clientId: string) =>
      clients.find((c) => c.id === clientId)?.name ?? '—'

   const salesDeals = useMemo(() => {
      const cutoff = cutoffDate(salesPeriod)
      const completed = userDeals.filter((d) => d.status === 'completed')
      const filtered = cutoff
         ? completed.filter((d) => d.completedAt && new Date(d.completedAt) >= cutoff)
         : completed
      return [...filtered].sort(
         (a, b) =>
            new Date(b.completedAt ?? 0).getTime() - new Date(a.completedAt ?? 0).getTime(),
      )
   }, [userDeals, salesPeriod])

   const salesTotalPages = Math.max(1, Math.ceil(salesDeals.length / PAGE_SIZE))
   const salesPageDeals = salesDeals.slice((salesPage - 1) * PAGE_SIZE, salesPage * PAGE_SIZE)

   const stagesData = useMemo(() => {
      const cutoff = cutoffDate(stagesPeriod)
      const filtered = cutoff
         ? userDeals.filter((d) => new Date(d.createdAt) >= cutoff)
         : userDeals
      return STATUS_ORDER.map((key) => ({
         key,
         label: STATUS_LABELS[key],
         count: filtered.filter((d) => d.status === key).length,
         total: filtered
            .filter((d) => d.status === key)
            .reduce((sum, d) => sum + d.amount, 0),
      })).filter((s) => s.count > 0)
   }, [userDeals, stagesPeriod])

   const stagesTotalPages = Math.max(1, Math.ceil(stagesData.length / PAGE_SIZE))
   const stagesPageData = stagesData.slice(
      (stagesPage - 1) * PAGE_SIZE,
      stagesPage * PAGE_SIZE,
   )

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
                     <span
                        className={
                           activeTab === tab.id ? styles.tabLabelActive : styles.tabLabel
                        }
                     >
                        {tab.label}
                     </span>
                     <span
                        className={
                           activeTab === tab.id
                              ? styles.tabUnderlineActive
                              : styles.tabUnderline
                        }
                     />
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
                     onPeriodChange={(p) => {
                        setSalesPeriod(p)
                        setSalesPage(1)
                     }}
                  />
                  <div className={styles.tableContainer}>
                     <div className={styles.tableHead}>
                        <span className={styles.thCell}>
                           ID сделки
                           <SortIcon />
                        </span>
                        <span className={styles.thCell}>
                           Название
                           <SortIcon />
                        </span>
                        <span className={styles.thCell}>
                           Клиент
                           <SortIcon />
                        </span>
                        <span className={`${styles.thCell} ${styles.thCellRight}`}>
                           Сумма
                           <SortIcon />
                        </span>
                        <span className={`${styles.thCell} ${styles.thCellRight}`}>
                           Дата завершения
                           <SortIcon active />
                        </span>
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
                                    {getClientName(deal.clientId)}
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
                  <PaginationBar
                     page={salesPage}
                     total={salesTotalPages}
                     onChange={setSalesPage}
                  />
               </div>

               <div className={styles.section}>
                  <h2 className={styles.sectionTitle}>Этапы сделок</h2>
                  <SectionToolbar
                     period={stagesPeriod}
                     onPeriodChange={(p) => {
                        setStagesPeriod(p)
                        setStagesPage(1)
                     }}
                  />
                  <div className={styles.tableContainer}>
                     <div className={styles.tableHead}>
                        <span className={styles.thCell}>
                           Этап сделки
                           <SortIcon />
                        </span>
                        <span className={styles.thCell}>
                           Количество сделок на этапе
                           <SortIcon />
                        </span>
                        <span className={`${styles.thCell} ${styles.thCellRight}`}>
                           Общая сумма сделок на этапе
                           <SortIcon />
                        </span>
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
                                 <span
                                    className={`${styles.cell} ${styles[`stageLabel_${stage.key}`]}`}
                                 >
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
                  <PaginationBar
                     page={stagesPage}
                     total={stagesTotalPages}
                     onChange={setStagesPage}
                  />
               </div>
            </div>
         )}

         {activeTab !== 'sales' && (
            <p className={styles.stub}>Раздел в разработке</p>
         )}
      </div>
   )
}

type ToolbarProps = { period: Period; onPeriodChange: (p: Period) => void }

function SectionToolbar({ period, onPeriodChange }: ToolbarProps) {
   return (
      <div className={styles.toolbar}>
         <div className={styles.filterSelectWrapper}>
            <select
               className={styles.filterSelect}
               value={period}
               onChange={(e) => onPeriodChange(e.target.value as Period)}
            >
               {PERIOD_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                     {o.label}
                  </option>
               ))}
            </select>
            <SelectChevron />
         </div>
         <div className={styles.filterSelectWrapper}>
            <select className={styles.filterSelect} defaultValue="list">
               <option value="list">Списком</option>
            </select>
            <SelectChevron />
         </div>
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

type PaginationBarProps = { onChange: (page: number) => void; page: number; total: number }

function PaginationBar({ onChange, page, total }: PaginationBarProps) {
   return (
      <div className={styles.pagination}>
         <button
            className={styles.pageNavBtn}
            disabled={page <= 1}
            type="button"
            onClick={() => onChange(page - 1)}
         >
            <svg fill="none" height="16" viewBox="0 0 16 16" width="16">
               <path
                  d="M10 12L6 8L10 4"
                  stroke="#D1D5DB"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="1.5"
               />
            </svg>
         </button>
         <span className={styles.pageCurrent}>{page}</span>
         <button
            className={styles.pageNavBtn}
            disabled={page >= total}
            type="button"
            onClick={() => onChange(page + 1)}
         >
            <svg fill="none" height="16" viewBox="0 0 16 16" width="16">
               <path
                  d="M6 4L10 8L6 12"
                  stroke="#D1D5DB"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="1.5"
               />
            </svg>
         </button>
      </div>
   )
}

function SortIcon({ active = false }: { active?: boolean }) {
   return (
      <svg aria-hidden="true" fill="none" height="12" viewBox="0 0 12 12" width="12">
         <path
            d="M2 3.5h8M3.5 6h5M5 8.5h2"
            stroke={active ? '#3B82F6' : '#9CA3AF'}
            strokeLinecap="round"
            strokeWidth={active ? '1.5' : '1'}
         />
      </svg>
   )
}

function SelectChevron() {
   return (
      <svg
         aria-hidden="true"
         className={styles.filterSelectChevron}
         fill="none"
         height="16"
         viewBox="0 0 16 16"
         width="16"
      >
         <path
            d="M4 6L8 10L12 6"
            stroke="#6B7280"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.5"
         />
      </svg>
   )
}