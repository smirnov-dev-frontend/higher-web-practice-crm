import { useMemo, useState } from 'react'

import { useGetClientsQuery } from '../api/clientsApi'
import { useGetDealsQuery } from '../api/dealsApi'
import { useAppSelector } from '../app/hooks'
import { Button } from '../components/ui/Button/Button'
import { selectCurrentUser } from '../features/auth/authSelectors'
import { DealModal } from '../features/deals/DealModal'
import type { DealFormValues } from '../features/deals/dealSchema'
import type { Deal, DealStatus } from '../types/deal'
import { formatCurrency, formatDate } from '../utils/format'

import styles from './DealsPage.module.css'

type SortKey =
   | 'title'
   | 'clientName'
   | 'description'
   | 'status'
   | 'amount'
   | 'createdAt'
   | 'completedAt'
type SortDirection = 'asc' | 'desc'

const STATUS_LABELS: Record<DealStatus, string> = {
   cancelled: 'Отменена',
   completed: 'Завершена',
   in_progress: 'В работе',
   new: 'Новая',
}

const COLUMNS: { key: SortKey; label: string; rightAlign?: boolean }[] = [
   { key: 'title', label: 'Название' },
   { key: 'clientName', label: 'Клиент' },
   { key: 'description', label: 'Описание' },
   { key: 'status', label: 'Этап (статус)' },
   { key: 'amount', label: 'Сумма', rightAlign: true },
   { key: 'createdAt', label: 'Дата создания', rightAlign: true },
   { key: 'completedAt', label: 'Дата завершения', rightAlign: true },
]

export function DealsPage() {
   const currentUser = useAppSelector(selectCurrentUser)
   const { data: deals = [], isLoading: dealsLoading } = useGetDealsQuery()
   const { data: clients = [] } = useGetClientsQuery()

   const [search, setSearch] = useState('')
   const [sortKey, setSortKey] = useState<SortKey>('createdAt')
   const [sortDirection, setSortDirection] = useState<SortDirection>('desc')
   const [isSortActive, setIsSortActive] = useState(false)
   const [isAddModalOpen, setIsAddModalOpen] = useState(false)
   const [editingDeal, setEditingDeal] = useState<Deal | null>(null)
   const [addDraft, setAddDraft] = useState<Partial<DealFormValues>>({})

   const clientMap = useMemo(
      () => new Map(clients.map((c) => [c.id, c])),
      [clients],
   )

   const userDeals = useMemo(
      () => deals.filter((d) => d.createdBy === currentUser?.id),
      [deals, currentUser?.id],
   )

   const handleSort = (key: SortKey) => {
      setIsSortActive(true)
      if (key === sortKey) {
         setSortDirection((d) => (d === 'asc' ? 'desc' : 'asc'))
      } else {
         setSortKey(key)
         setSortDirection('asc')
      }
   }

   const filteredAndSorted = useMemo(() => {
      const query = search.toLowerCase().trim()

      const filtered = query
         ? userDeals.filter((d) => {
              const clientName = clientMap.get(d.clientId)?.name ?? ''
              return [d.title, d.description, clientName, STATUS_LABELS[d.status]].some((f) =>
                 f?.toLowerCase().includes(query),
              )
           })
         : userDeals

      return [...filtered].sort((a, b) => {
         const clientA = clientMap.get(a.clientId)?.name.split(' ')[0] ?? ''
         const clientB = clientMap.get(b.clientId)?.name.split(' ')[0] ?? ''

         let cmp: number
         if (sortKey === 'clientName') {
            cmp = clientA.localeCompare(clientB, 'ru')
         } else if (sortKey === 'amount') {
            cmp = a.amount - b.amount
         } else {
            const aVal = (a as unknown as Record<string, unknown>)[sortKey] ?? ''
            const bVal = (b as unknown as Record<string, unknown>)[sortKey] ?? ''
            cmp = String(aVal).localeCompare(String(bVal), 'ru')
         }

         return sortDirection === 'asc' ? cmp : -cmp
      })
   }, [userDeals, search, sortKey, sortDirection, clientMap])

   if (dealsLoading) {
      return <p className={styles.message}>Загрузка...</p>
   }

   return (
      <div className={styles.page}>
         <h1 className={styles.title}>Сделки</h1>

         <div className={styles.toolbar}>
            <Button onClick={() => setIsAddModalOpen(true)}>Новая сделка</Button>
            <div className={styles.searchWrapper}>
               <SearchIcon className={styles.searchIcon} />
               <input
                  className={styles.searchInput}
                  placeholder="Искать"
                  type="search"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
               />
            </div>
         </div>

         <div className={styles.tableWrapper}>
            <div className={styles.tableHeader} role="row">
               {COLUMNS.map(({ key, label, rightAlign }) => (
                  <button
                     key={key}
                     className={`${styles.thBtn} ${rightAlign ? styles.thBtnRight : ''}`}
                     type="button"
                     onClick={() => handleSort(key)}
                  >
                     <span
                        className={`${styles.thContent} ${sortKey === key && isSortActive ? styles.thContentActive : ''}`}
                     >
                        {label}
                        <SortChevron active={sortKey === key && isSortActive} direction={sortDirection} />
                     </span>
                  </button>
               ))}
            </div>

            <div className={styles.rows} role="rowgroup">
               {filteredAndSorted.map((deal) => {
                  const clientName = clientMap.get(deal.clientId)?.name.split(' ')[0] ?? '—'

                  return (
                     <div
                        key={deal.id}
                        className={`${styles.row} ${styles[`row_${deal.status}`]}`}
                        role="row"
                        onClick={() => setEditingDeal(deal)}
                     >
                        <span className={styles.cellTitle}>{deal.title}</span>
                        <span className={styles.cell}>{clientName}</span>
                        <span className={styles.cellDesc}>{deal.description || '—'}</span>
                        <span className={`${styles.cell} ${styles[`status_${deal.status}`]}`}>
                           {STATUS_LABELS[deal.status]}
                        </span>
                        <span className={styles.cellAmount}>{formatCurrency(deal.amount)}</span>
                        <span className={styles.cellDate}>{formatDate(deal.createdAt)}</span>
                        <span className={styles.cellDate}>{formatDate(deal.completedAt)}</span>
                     </div>
                  )
               })}
            </div>

            {filteredAndSorted.length === 0 && (
               <p className={styles.empty}>
                  {search ? 'По вашему запросу ничего не найдено' : 'Сделки ещё не добавлены'}
               </p>
            )}
         </div>

         {isAddModalOpen && (
         <DealModal
            draft={addDraft}
            onClose={() => setIsAddModalOpen(false)}
            onDraftSave={setAddDraft}
         />
      )}

         {editingDeal && (
            <DealModal deal={editingDeal} onClose={() => setEditingDeal(null)} />
         )}
      </div>
   )
}

function SearchIcon({ className }: { className?: string }) {
   return (
      <svg
         aria-hidden="true"
         className={className}
         fill="none"
         height="18"
         viewBox="0 0 18 18"
         width="18"
      >
         <circle cx="8" cy="8" r="5.5" stroke="currentColor" strokeWidth="1.5" />
         <path d="M13 13L16 16" stroke="currentColor" strokeLinecap="round" strokeWidth="1.5" />
      </svg>
   )
}

type SortChevronProps = { active: boolean; direction: SortDirection }

function SortChevron({ active, direction }: SortChevronProps) {
   return (
      <svg
         aria-hidden="true"
         className={[
            styles.sortIcon,
            active && direction === 'asc' ? styles.sortIconAsc : '',
         ]
            .filter(Boolean)
            .join(' ')}
         fill="none"
         height="16"
         viewBox="0 0 16 16"
         width="16"
      >
         <path
            d="M4 6L8 10L12 6"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.5"
         />
      </svg>
   )
}