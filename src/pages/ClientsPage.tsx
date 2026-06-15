import { useEffect, useMemo, useState } from 'react'
import { useLocation } from 'react-router-dom'

import { useGetClientsQuery } from '../api/clientsApi'
import { useAppSelector } from '../app/hooks'
import { Button } from '../components/ui/Button/Button'
import { ColumnFilter } from '../components/ui/ColumnFilter/ColumnFilter'
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

const COLUMNS: { key: SortKey; label: string; rightAlign?: boolean }[] = [
   { key: 'name', label: 'Имя' },
   { key: 'phone', label: 'Телефон' },
   { key: 'email', label: 'Email' },
   { key: 'company', label: 'Название компании' },
   { key: 'website', label: 'Сайт' },
   { key: 'comment', label: 'Комментарий' },
   { key: 'createdAt', label: 'Добавлен', rightAlign: true },
]

function getClientDisplayVal(c: Client, key: SortKey): string {
   if (key === 'name') return c.name.split(' ')[0]
   if (key === 'phone') return formatPhone(c.phone)
   if (key === 'email') return c.email
   if (key === 'company') return c.company ?? ''
   if (key === 'website') return formatWebsite(c.website)
   if (key === 'comment') return c.comment ?? ''
   if (key === 'createdAt') return formatDate(c.createdAt)
   return ''
}

export function ClientsPage() {
   const currentUser = useAppSelector(selectCurrentUser)
   const { data: clients = [], isLoading } = useGetClientsQuery()

   const [search, setSearch] = useState('')
   const [sortKey, setSortKey] = useState<SortKey>('createdAt')
   const [sortDirection, setSortDirection] = useState<SortDirection>('desc')
   const [isSortActive, setIsSortActive] = useState(false)
   const [columnFilters, setColumnFilters] = useState<Partial<Record<SortKey, string[]>>>({})
   const [isAddModalOpen, setIsAddModalOpen] = useState(false)
   const location = useLocation()
   useEffect(() => {
      if (location.state?.openModal) setIsAddModalOpen(true)
   }, [location.state])
   const [editingClient, setEditingClient] = useState<Client | null>(null)
   const [addDraft, setAddDraft] = useState<Partial<ClientFormValues>>({})

   const userClients = useMemo(
      () => clients.filter((c) => c.createdBy === currentUser?.id),
      [clients, currentUser?.id],
   )

   const columnOptions = useMemo(() => {
      const opts: Partial<Record<SortKey, string[]>> = {}
      for (const { key } of COLUMNS) {
         opts[key] = [...new Set(userClients.map((c) => getClientDisplayVal(c, key)))]
            .filter(Boolean)
            .sort()
      }
      return opts
   }, [userClients])

   const handleSortAsc = (key: SortKey) => {
      setIsSortActive(true)
      setSortKey(key)
      setSortDirection('asc')
   }

   const handleSortDesc = (key: SortKey) => {
      setIsSortActive(true)
      setSortKey(key)
      setSortDirection('desc')
   }

   const handleFilterChange = (key: SortKey, values: string[]) => {
      setColumnFilters((prev) => ({ ...prev, [key]: values }))
   }

   const filteredAndSorted = useMemo(() => {
      const query = search.toLowerCase().trim()

      let result = query
         ? userClients.filter((c) =>
              [c.name, c.phone, c.email, c.company, c.website, c.comment].some((f) =>
                 f?.toLowerCase().includes(query),
              ),
           )
         : userClients

      for (const [key, values] of Object.entries(columnFilters)) {
         if (!values || values.length === 0) continue
         result = result.filter((c) =>
            values.includes(getClientDisplayVal(c, key as SortKey)),
         )
      }

      return [...result].sort((a, b) => {
         if (a.deleted !== b.deleted) return a.deleted ? 1 : -1
         const aVal = a[sortKey] ?? ''
         const bVal = b[sortKey] ?? ''
         const cmp = String(aVal).localeCompare(String(bVal), 'ru')
         return sortDirection === 'asc' ? cmp : -cmp
      })
   }, [userClients, search, sortKey, sortDirection, columnFilters])

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
               {COLUMNS.map(({ key, label, rightAlign }) => (
                  <ColumnFilter
                     key={key}
                     isActive={sortKey === key && isSortActive}
                     label={label}
                     options={columnOptions[key] ?? []}
                     rightAlign={rightAlign}
                     selectedValues={columnFilters[key] ?? []}
                     sortDirection={sortDirection}
                     onFilterChange={(values) => handleFilterChange(key, values)}
                     onSortAsc={() => handleSortAsc(key)}
                     onSortDesc={() => handleSortDesc(key)}
                  />
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