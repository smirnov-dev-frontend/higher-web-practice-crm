import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom'

import { Button } from '../ui/Button/Button'
import styles from './AuthLayout.module.css'

export function AuthLayout() {
   const location = useLocation()
   const navigate = useNavigate()
   const isWelcomePath = location.pathname === '/'
   const isRegisterPage = location.pathname === '/register'

   return (
      <main className={styles.layout}>
         <div aria-hidden className={styles.blobs}>
            <div className={`${styles.blob} ${styles.blobBlue1}`} />
            <div className={`${styles.blob} ${styles.blobGreen}`} />
            <div className={`${styles.blob} ${styles.blobBlue2}`} />
            <div className={`${styles.blob} ${styles.blobYellow}`} />
         </div>

         <section className={`${styles.info} ${!isWelcomePath ? styles.infoHidden : ''}`}>
            <div className={styles.infoContent}>
               <img alt="YaPlex" className={styles.logo} src="/yaplex-logo.svg" />

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
                     {isRegisterPage ? 'Уже зарегистрированы?' : 'У вас ещё нет аккаунта?'}
                  </p>

                  <Link className={styles.registerLink} to={isRegisterPage ? '/login' : '/register'}>
                     {isRegisterPage ? 'Войти в аккаунт' : 'Зарегистрироваться'}
                  </Link>
               </div>

               <div className={styles.mobileButtons}>
                  <Button fullWidth onClick={() => navigate('/login')}>Войти</Button>
                  <Link className={styles.mobileRegLink} to="/register">
                     <Button fullWidth variant="secondary">Регистрация</Button>
                  </Link>
               </div>
            </div>
         </section>

         <section className={`${styles.content} ${isWelcomePath ? styles.contentHiddenMobile : ''}`}>
            <Outlet />
         </section>
      </main>
   )
}