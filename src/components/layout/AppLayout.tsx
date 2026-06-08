import { NavLink, Outlet } from 'react-router-dom'

import { useAppDispatch, useAppSelector } from '../../app/hooks'
import { selectCurrentUser } from '../../features/auth/authSelectors'
import { logout } from '../../features/auth/authSlice'

const navigationItems = [
   { to: '/dashboard', label: 'Главная' },
   { to: '/clients', label: 'Клиенты' },
   { to: '/deals', label: 'Сделки' },
   { to: '/tasks', label: 'Задачи' },
   { to: '/reports', label: 'Отчёты' },
   { to: '/profile', label: 'Профиль' },
]

export function AppLayout() {
   const dispatch = useAppDispatch()
   const currentUser = useAppSelector(selectCurrentUser)

   const handleLogout = () => {
      dispatch(logout())
   }

   return (
      <div className="app-layout">
         <aside className="sidebar">
            <div className="sidebar__logo">CRM</div>

            <nav className="sidebar__nav" aria-label="Основная навигация">
               {navigationItems.map((item) => (
                  <NavLink
                     className={({ isActive }) =>
                        isActive ? 'sidebar__link sidebar__link_active' : 'sidebar__link'
                     }
                     key={item.to}
                     to={item.to}
                  >
                     {item.label}
                  </NavLink>
               ))}
            </nav>
         </aside>

         <div className="app-layout__content">
            <header className="header">
               <div>
                  <p className="header__caption">CRM-платформа</p>
                  <h1 className="header__title">Панель управления</h1>
               </div>

               <div className="header__user">
                  <span>{currentUser?.name ?? 'Пользователь'}</span>
                  <button className="button button_secondary" type="button" onClick={handleLogout}>
                     Выйти
                  </button>
               </div>
            </header>

            <main className="page">
               <Outlet />
            </main>
         </div>
      </div>
   )
}