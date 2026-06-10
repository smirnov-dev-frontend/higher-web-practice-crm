import { useState } from 'react'
import { NavLink, Outlet } from 'react-router-dom'

import { useAppSelector } from '../../app/hooks'
import { selectCurrentUser } from '../../features/auth/authSelectors'
import ClientsIcon from '../../icons/sidebar-clients.svg?react'
import CollapseIcon from '../../icons/sidebar-collapse.svg?react'
import DealsIcon from '../../icons/sidebar-deals.svg?react'
import HomeIcon from '../../icons/sidebar-home.svg?react'
import ReportsIcon from '../../icons/sidebar-reports.svg?react'
import TasksIcon from '../../icons/sidebar-tasks.svg?react'

import styles from './AppLayout.module.css'

const navigationItems = [
   {
      Icon: HomeIcon,
      label: 'Главная',
      to: '/dashboard',
   },
   {
      Icon: ClientsIcon,
      label: 'Клиенты',
      to: '/clients',
   },
   {
      Icon: DealsIcon,
      label: 'Сделки',
      to: '/deals',
   },
   {
      Icon: ReportsIcon,
      label: 'Отчёты',
      to: '/reports',
   },
   {
      Icon: TasksIcon,
      label: 'Задачи',
      to: '/tasks',
   },
]

export function AppLayout() {
   const currentUser = useAppSelector(selectCurrentUser)
   const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)

   const handleToggleSidebar = () => {
      setIsSidebarCollapsed((currentValue) => !currentValue)
   }

   return (
      <div
         className={
            isSidebarCollapsed
               ? `${styles.layout} ${styles.layoutCollapsed}`
               : styles.layout
         }
      >
         <aside
            className={
               isSidebarCollapsed
                  ? `${styles.sidebar} ${styles.sidebarCollapsed}`
                  : styles.sidebar
            }
         >
            <div className={styles.sidebarTop}>
               <div className={styles.logo}>
                  <img className={styles.logoImage} src="/yaplex-logo.svg" alt="YaPlex" />
               </div>

               <button
                  aria-label={isSidebarCollapsed ? 'Развернуть меню' : 'Свернуть меню'}
                  aria-expanded={!isSidebarCollapsed}
                  className={styles.collapseButton}
                  type="button"
                  onClick={handleToggleSidebar}
               >
                  <CollapseIcon
                     aria-hidden="true"
                     className={
                        isSidebarCollapsed
                           ? `${styles.collapseIcon} ${styles.collapseIconMirrored}`
                           : styles.collapseIcon
                     }
                  />
               </button>
            </div>

            <nav className={styles.navigation} aria-label="Основная навигация">
               {navigationItems.map(({ Icon, label, to }) => (
                  <NavLink
                     aria-label={label}
                     className={({ isActive }) =>
                        isActive ? `${styles.navLink} ${styles.navLinkActive}` : styles.navLink
                     }
                     key={to}
                     title={isSidebarCollapsed ? label : undefined}
                     to={to}
                  >
                     <Icon className={styles.navIcon} aria-hidden="true" />
                     <span className={styles.navText}>{label}</span>
                  </NavLink>
               ))}
            </nav>

            <div className={styles.sidebarBottom}>
               <NavLink
                  aria-label="Настройки аккаунта"
                  className={({ isActive }) =>
                     isActive ? `${styles.profileButton} ${styles.profileButtonActive}` : styles.profileButton
                  }
                  title={isSidebarCollapsed ? 'Настройки аккаунта' : undefined}
                  to="/profile"
               >
                  <span className={styles.avatar}>{currentUser?.name?.[0] ?? 'П'}</span>

                  <span className={styles.profileInfo}>
                     <span className={styles.profileName}>{currentUser?.name.split(' ')[0] ?? 'Пользователь'}</span>
                  </span>
               </NavLink>
            </div>
         </aside>

         <main className={styles.content}>
            <Outlet />
         </main>
      </div>
   )
}