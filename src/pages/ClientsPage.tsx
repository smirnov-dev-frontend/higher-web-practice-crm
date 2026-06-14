import { useMemo, useState } from 'react'

import { useGetClientsQuery } from '../api/clientsApi'
import { useAppSelector } from '../app/hooks'
import { Button } from '../components/ui/Button/Button'
import { selectCurrentUser } from '../features/auth/authSelectors'
import { ClientModal } from '../features/clients/ClientModal'
import type { ClientFormValues } from '../features/clients/clientsSchema'
import type { Client } from '../types/client'
import { formatDate, formatPhone, formatWebsite } from '../utils/format'

import styles from './ClientsPage.module.css'

type SortKey = keyof Pick<
   Client,
   'comment' | 'company' | 'createdAt' | 'email' | 'name' | 'phone' | 'website'
>
type SortDirection = 'asc' | 'desc'

const COLUMNS: { key: SortKey; label: string }[] = [
   { key: 'name', label: 'Имя' },
   { key: 'phone', label: 'Телефон' },
   { key: 'email', label: 'Email' },
   { key: 'company', label: 'Название компании' },
   { key: 'website', label: 'Сайт' },
   { key: 'comment', label: 'Комментарий' },
   { key: 'createdAt', label: 'Добавлен' },
]

export function ClientsPage() {
   const currentUser = useAppSelector(selectCurrentUser)
   const { data: clients = [], isLoading } = useGetClientsQuery()

   const [search, setSearch] = useState('')
   const [sortKey, setSortKey] = useState<SortKey>('createdAt')
   const [sortDirection, setSortDirection] = useState<SortDirection>('desc')
   const [isSortActive, setIsSortActive] = useState(false)
   const [isAddModalOpen, setIsAddModalOpen] = useState(false)
   const [editingClient, setEditingClient] = useState<Client | null>(null)
   const [addDraft, setAddDraft] = useState<Partial<ClientFormValues>>({})

   const userClients = useMemo(
      () => clients.filter((c) => c.createdBy === currentUser?.id),
      [clients, currentUser?.id],
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
         ? userClients.filter((c) =>
              [c.name, c.phone, c.email, c.company, c.website, c.comment].some((field) =>
                 field?.toLowerCase().includes(query),
              ),
           )
         : userClients

      return [...filtered].sort((a, b) => {
         if (a.deleted !== b.deleted) return a.deleted ? 1 : -1
         const aVal = a[sortKey] ?? ''
         const bVal = b[sortKey] ?? ''
         const cmp = String(aVal).localeCompare(String(bVal), 'ru')
         return sortDirection === 'asc' ? cmp : -cmp
      })
   }, [userClients, search, sortKey, sortDirection])

   if (isLoading) {
      return <p className={styles.message}>Загрузка...</p>
   }

   return (
      <div className={styles.page}>
         <h1 className={styles.title}>Клиенты</h1>

         <div className={styles.toolbar}>
            <Button onClick={() => setIsAddModalOpen(true)}>Новый клиент</Button>
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
               {COLUMNS.map(({ key, label }) => (
                  <button
                     key={key}
                     className={`${styles.thBtn} ${key === 'createdAt' ? styles.thBtnRight : ''}`}
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
               {filteredAndSorted.map((client) => (
                  <div
                     key={client.id}
                     className={
                        client.deleted ? `${styles.row} ${styles.rowDeleted}` : styles.row
                     }
                     role="row"
                     onClick={() => setEditingClient(client)}
                  >
                     <span className={styles.cellName}>{client.name.split(' ')[0]}</span>
                     <span className={styles.cell}>{formatPhone(client.phone)}</span>
                     <span
                        className={`${styles.cell} ${client.deleted ? '' : styles.cellEmail}`}
                     >
                        {client.email}
                     </span>
                     <span className={styles.cell}>{client.company}</span>
                     <span className={styles.cell}>{formatWebsite(client.website)}</span>
                     <span className={`${styles.cell} ${styles.cellComment}`}>
                        {client.comment || '—'}
                     </span>
                     <span className={`${styles.cell} ${styles.cellDate}`}>
                        {formatDate(client.createdAt)}
                     </span>
                  </div>
               ))}
            </div>

            {filteredAndSorted.length === 0 && (
               <p className={styles.empty}>
                  {search ? 'По вашему запросу ничего не найдено' : 'Клиенты ещё не добавлены'}
               </p>
            )}
         </div>

         {isAddModalOpen && (
            <ClientModal
               draft={addDraft}
               onClose={() => setIsAddModalOpen(false)}
               onDraftSave={setAddDraft}
            />
         )}

         {editingClient && (
            <ClientModal client={editingClient} onClose={() => setEditingClient(null)} />
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