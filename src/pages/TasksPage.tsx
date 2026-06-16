import { useEffect, useMemo, useState } from 'react'
import { useLocation } from 'react-router-dom'

import { useGetDealsQuery } from '../api/dealsApi'
import { useGetTasksQuery } from '../api/tasksApi'
import { useGetUsersQuery } from '../api/usersApi'
import { useAppSelector } from '../app/hooks'
import { Button } from '../components/ui/Button/Button'
import { ColumnFilter } from '../components/ui/ColumnFilter/ColumnFilter'
import { selectCurrentUser } from '../features/auth/authSelectors'
import { TaskModal } from '../features/tasks/TaskModal'
import type { TaskFormValues } from '../features/tasks/taskSchema'
import type { Task, TaskStatus } from '../types/task'
import { formatDate } from '../utils/format'

import styles from './TasksPage.module.css'

type SortKey = 'title' | 'dealTitle' | 'description' | 'dueDate' | 'assigneeName' | 'status' | 'createdAt'
type SortDirection = 'asc' | 'desc'

const STATUS_LABELS: Record<TaskStatus, string> = {
   new: 'Новая',
   in_progress: 'В работе',
   completed: 'Завершена',
}

const COLUMNS: { key: SortKey; label: string; rightAlign?: boolean }[] = [
   { key: 'title', label: 'Название' },
   { key: 'dealTitle', label: 'Сделка' },
   { key: 'description', label: 'Описание' },
   { key: 'dueDate', label: 'Выполнить до' },
   { key: 'assigneeName', label: 'Исполнитель' },
   { key: 'status', label: 'Статус' },
   { key: 'createdAt', label: 'Дата создания', rightAlign: true },
]

type TaskRow = Task & { dealTitle: string; assigneeName: string; isOverdue: boolean }

function getTaskDisplayVal(row: TaskRow, key: SortKey): string {
   if (key === 'title') return row.title
   if (key === 'dealTitle') return row.dealTitle
   if (key === 'description') return row.description ?? ''
   if (key === 'dueDate') return formatDate(row.dueDate)
   if (key === 'assigneeName') return row.assigneeName
   if (key === 'status') return row.isOverdue ? 'Просрочена' : STATUS_LABELS[row.status]
   if (key === 'createdAt') return formatDate(row.createdAt)
   return ''
}

export function TasksPage() {
   const currentUser = useAppSelector(selectCurrentUser)
   const { data: tasks = [], isLoading } = useGetTasksQuery()
   const { data: deals = [] } = useGetDealsQuery()
   const { data: users = [] } = useGetUsersQuery()

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
   const [editingTask, setEditingTask] = useState<Task | null>(null)
   const [addDraft, setAddDraft] = useState<Partial<TaskFormValues>>({})

   const dealMap = useMemo(() => new Map(deals.map((d) => [d.id, d])), [deals])
   const userMap = useMemo(() => new Map(users.map((u) => [u.id, u])), [users])

   const userTasks = useMemo(
      () => tasks.filter((t) => t.createdBy === currentUser?.id),
      [tasks, currentUser?.id],
   )

   const taskRows = useMemo((): TaskRow[] =>
      userTasks.map((t) => ({
         ...t,
         dealTitle: t.dealId ? (dealMap.get(t.dealId)?.title ?? '—') : '—',
         assigneeName: userMap.get(t.assigneeId)?.name.split(' ')[0] ?? '—',
         isOverdue: Boolean(t.dueDate && new Date(t.dueDate) < new Date() && t.status !== 'completed'),
      })),
   [userTasks, dealMap, userMap])

   const columnOptions = useMemo(() => {
      const opts: Partial<Record<SortKey, string[]>> = {}
      for (const { key } of COLUMNS) {
         opts[key] = [...new Set(taskRows.map((r) => getTaskDisplayVal(r, key)))]
            .filter(Boolean)
            .sort()
      }
      return opts
   }, [taskRows])

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
         ? taskRows.filter((r) =>
              [r.title, r.dealTitle, r.description, r.assigneeName, STATUS_LABELS[r.status]].some(
                 (f) => f?.toLowerCase().includes(query),
              ),
           )
         : taskRows

      for (const [key, values] of Object.entries(columnFilters)) {
         if (!values || values.length === 0) continue
         result = result.filter((r) => values.includes(getTaskDisplayVal(r, key as SortKey)))
      }

      return [...result].sort((a, b) => {
         let cmp: number
         if (sortKey === 'dueDate') {
            const aTime = a.dueDate ? new Date(a.dueDate).getTime() : 0
            const bTime = b.dueDate ? new Date(b.dueDate).getTime() : 0
            cmp = aTime - bTime
         } else if (sortKey === 'createdAt') {
            cmp = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
         } else {
            cmp = getTaskDisplayVal(a, sortKey).localeCompare(getTaskDisplayVal(b, sortKey), 'ru')
         }
         return sortDirection === 'asc' ? cmp : -cmp
      })
   }, [taskRows, search, sortKey, sortDirection, columnFilters])

   if (isLoading) {
      return <p className={styles.message}>Загрузка...</p>
   }

   return (
      <div className={styles.page}>
         <h1 className={styles.title}>Задачи</h1>

         <div className={styles.toolbar}>
            <div className={styles.toolbarAddBtn}>
               <Button onClick={() => setIsAddModalOpen(true)}>Новая задача</Button>
            </div>
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
               {filteredAndSorted.map((row) => (
                  <div
                     key={row.id}
                     className={`${styles.row} ${row.isOverdue ? styles.row_overdue : styles[`row_${row.status}`]}`}
                     role="row"
                     onClick={() => setEditingTask(row)}
                  >
                     <span className={styles.cellTitle}>{row.title}</span>
                     <span className={`${styles.cell} ${styles.cellDeal}`}>{row.dealTitle}</span>
                     <span className={styles.cellDesc}>{row.description || '—'}</span>
                     <span className={`${styles.cell} ${styles.cellDue}${row.dueDate ? ` ${styles.cellDueWithDate}` : ''}`}>{formatDate(row.dueDate)}</span>
                     <span className={`${styles.cell} ${styles.cellAssignee}`}>{row.assigneeName}</span>
                     <span className={`${styles.cell} ${styles.cellStatus} ${row.isOverdue ? styles.status_overdue : styles[`status_${row.status}`]}`}>
                        {row.isOverdue ? 'Просрочена' : STATUS_LABELS[row.status]}
                     </span>
                     <span className={styles.cellDate}>{formatDate(row.createdAt)}</span>
                  </div>
               ))}
            </div>

            {filteredAndSorted.length === 0 && (
               <p className={styles.empty}>
                  {search ? 'По вашему запросу ничего не найдено' : 'Задачи ещё не добавлены'}
               </p>
            )}
         </div>

         <div className={styles.mobileAdd}>
            <Button onClick={() => setIsAddModalOpen(true)}>Новая задача</Button>
         </div>

         {isAddModalOpen && (
            <TaskModal
               draft={addDraft}
               onClose={() => setIsAddModalOpen(false)}
               onDraftSave={setAddDraft}
            />
         )}

         {editingTask && (
            <TaskModal task={editingTask} onClose={() => setEditingTask(null)} />
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