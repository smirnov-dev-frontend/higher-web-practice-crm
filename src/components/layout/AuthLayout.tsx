import { Link, Outlet, useLocation } from 'react-router-dom'

import styles from './AuthLayout.module.css'

export function AuthLayout() {
   const location = useLocation()
   const isLoginPage = location.pathname === '/'

   return (
      <main className={styles.layout}>
         <section className={styles.info}>
            <img className={styles.logo} src="/yaplex-logo.svg" alt="YaPlex" />

            <p className={styles.description}>
               Платформа для управления клиентами,
               <br />
               сделками и задачами.
               <br />
               Эффективно управляйте бизнес-процессами, отслеживайте ключевые показатели и
               выстраивайте продуктивные отношения с клиентами.
            </p>

            <div className={styles.registerBlock}>
               <p className={styles.registerText}>
                  {isLoginPage ? 'У вас ещё нет аккаунта?' : 'Уже зарегистрированы?'}
               </p>

               <Link className={styles.registerLink} to={isLoginPage ? '/register' : '/'}>
                  {isLoginPage ? 'Зарегистрироваться' : 'Войти в аккаунт'}
               </Link>
            </div>
         </section>

         <section className={styles.content}>
            <Outlet />
         </section>
      </main>
   )
}