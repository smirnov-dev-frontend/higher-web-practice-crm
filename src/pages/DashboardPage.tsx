import { Link } from 'react-router-dom'

import { useGetClientsQuery } from '../api/clientsApi'
import { useGetDealsQuery } from '../api/dealsApi'
import { useGetTasksQuery } from '../api/tasksApi'
import { useAppSelector } from '../app/hooks'
import { Button } from '../components/ui/Button/Button'
import { selectCurrentUser } from '../features/auth/authSelectors'
import {
   formatCurrency,
   formatDate,
   formatShortDate,
   getDashboardStats,
   getRecentDeals,
   getRecentTasks,
   getTopClients,
} from '../features/dashboard/dashboardUtils'
import type { DealStatus } from '../types/deal'
import type { TaskStatus } from '../types/task'

import styles from './DashboardPage.module.css'

const dealStatusLabels: Record<DealStatus, string> = {
   cancelled: 'Отменена',
   completed: 'Завершена',
   in_progress: 'В работе',
   new: 'Новая',
}

const taskStatusLabels: Record<TaskStatus, string> = {
   completed: 'Завершена',
   in_progress: 'В работе',
   new: 'Новая',
}

export function DashboardPage() {
   const currentUser = useAppSelector(selectCurrentUser)

   const { data: clients = [], isLoading: isClientsLoading } = useGetClientsQuery()
   const { data: deals = [], isLoading: isDealsLoading } = useGetDealsQuery()
   const { data: tasks = [], isLoading: isTasksLoading } = useGetTasksQuery()

   const isLoading = isClientsLoading || isDealsLoading || isTasksLoading

   const userClients = clients.filter((client) => client.createdBy === currentUser?.id && !client.deleted)
   const userDeals = deals.filter((deal) => deal.createdBy === currentUser?.id)
   const userTasks = tasks.filter((task) => task.createdBy === currentUser?.id)

   const stats = getDashboardStats(userClients, userDeals)
   const topClients = getTopClients(userClients, userDeals)
   const recentDeals = getRecentDeals(userDeals)
   const recentTasks = getRecentTasks(userTasks)

   if (isLoading) {
      return <p className={styles.message}>Загрузка данных...</p>
   }

   return (
      <div className={styles.dashboard}>
         <header className={styles.header}>
            <h1 className={styles.title}>Добро пожаловать, {currentUser?.name.split(' ')[0] ?? 'Пользователь'}!</h1>
            <p className={styles.subtitle}>
               Посмотрите сводную информацию по вашим клиентам, сделкам и задачам
            </p>
         </header>

         <section className={styles.stats} aria-label="Сводная статистика">
            <div className={styles.statsHeader}>
               <span />
               <span>на сегодня</span>
               <span>за сегодня</span>
               <span>за неделю</span>
               <span>за месяц</span>
               <span>за квартал</span>
            </div>

            <StatRow
               label="Клиенты"
               month={stats.clients.month}
               quarter={stats.clients.quarter}
               today={stats.clients.today}
               todayAdded={stats.clients.todayAdded}
               week={stats.clients.week}
            />

            <StatRow
               label="Активные сделки"
               month={stats.activeDeals.month}
               quarter={stats.activeDeals.quarter}
               today={stats.activeDeals.today}
               todayAdded={stats.activeDeals.todayAdded}
               week={stats.activeDeals.week}
            />

            <StatRow
               label="Завершённые сделки"
               month={stats.completedDeals.month}
               quarter={stats.completedDeals.quarter}
               today={stats.completedDeals.today}
               todayAdded={stats.completedDeals.todayAdded}
               week={stats.completedDeals.week}
            />
         </section>

         <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Топ 10 активных клиентов</h2>

            <div className={styles.clientsGrid}>
               {topClients.map(({ client, dealsCount }) => (
                  <article className={styles.clientCard} key={client.id}>
                     <h3>{client.name}</h3>
                     <p>«{client.company}»</p>
                     <strong>{dealsCount}</strong>
                     <span>сделок</span>
                  </article>
               ))}
            </div>

            <Link to="/clients">
               <Button>Новый клиент</Button>
            </Link>
         </section>

         <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Топ 10 активных сделок</h2>

            <div className={styles.dealsList}>
               {recentDeals.map((deal) => {
                  const client = userClients.find((item) => item.id === deal.clientId)

                  return (
                     <article
                        className={
                           deal.status === 'new'
                              ? `${styles.dealRow} ${styles.dealRowNew}`
                              : styles.dealRow
                        }
                        key={deal.id}
                     >
                        <span>{deal.title}</span>
                        <span className={styles.clientNameCell}>{client?.name ?? '—'}</span>
                        <strong>{formatCurrency(deal.amount)}</strong>
                        <span
                           className={
                              deal.status === 'new'
                                 ? `${styles.status} ${styles.statusNew}`
                                 : styles.status
                           }
                        >
                           {dealStatusLabels[deal.status]}
                        </span>
                        <span className={styles.dateCell}>{formatDate(deal.completedAt ?? deal.createdAt)}</span>
                     </article>
                  )
               })}
            </div>

            <Link to="/deals">
               <Button>Новая сделка</Button>
            </Link>
         </section>

         <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Последние 10 задач</h2>

            <div className={styles.tasksGrid}>
               {recentTasks.map((task) => {
                  const deal = userDeals.find((item) => item.id === task.dealId)

                  return (
                     <article
                        className={
                           task.status === 'new'
                              ? `${styles.taskCard} ${styles.taskCardNew}`
                              : task.status === 'completed'
                                 ? `${styles.taskCard} ${styles.taskCardCompleted}`
                                 : styles.taskCard
                        }
                        key={task.id}
                     >
                        <h3>{task.title}</h3>
                        <p>сделка</p>
                        <span>{deal?.title ?? 'Без сделки'}</span>

                        <div className={styles.taskFooter}>
                           <span>до {formatShortDate(task.dueDate)}</span>
                           <strong
                              className={
                                 task.status === 'new'
                                    ? styles.taskStatusNew
                                    : task.status === 'in_progress'
                                       ? styles.taskStatusInProgress
                                       : styles.taskStatusCompleted
                              }
                           >
                              {taskStatusLabels[task.status]}
                           </strong>
                        </div>
                     </article>
                  )
               })}
            </div>

            <Link to="/tasks">
               <Button>Новая задача</Button>
            </Link>
         </section>
      </div>
   )
}

type StatRowProps = {
   label: string
   month: number
   quarter: number
   today: number
   todayAdded: number
   week: number
}

function StatRow({ label, month, quarter, today, todayAdded, week }: StatRowProps) {
   return (
      <div className={styles.statsRow}>
         <strong>{label}</strong>
         <span className={styles.mainNumber}>{today}</span>
         <span>+{todayAdded}</span>
         <span>+{week}</span>
         <span>+{month}</span>
         <span>+{quarter}</span>
      </div>
   )
}