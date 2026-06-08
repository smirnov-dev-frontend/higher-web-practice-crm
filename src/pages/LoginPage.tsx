import { zodResolver } from '@hookform/resolvers/zod'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { useState } from 'react'

import { Button } from '../components/ui/Button/Button'
import { FormField } from '../components/ui/FormField/FormField'
import { Input } from '../components/ui/Input/Input'
import { loginSchema, type LoginFormValues } from '../features/auth/schemas'
import { selectIsAuthenticated } from '../features/auth/authSelectors'
import { setCurrentUser } from '../features/auth/authSlice'
import { useAppDispatch, useAppSelector } from '../app/hooks'
import { useGetUsersQuery } from '../api/usersApi'

import styles from './AuthPages.module.css'

export function LoginPage() {
   const dispatch = useAppDispatch()
   const isAuthenticated = useAppSelector(selectIsAuthenticated)
   const navigate = useNavigate()
   const [formError, setFormError] = useState('')

   const { data: users = [], isLoading } = useGetUsersQuery()

   const {
      formState: { errors, isSubmitting },
      handleSubmit,
      register,
   } = useForm<LoginFormValues>({
      resolver: zodResolver(loginSchema),
      defaultValues: {
         email: '',
         password: '',
      },
   })

   const onSubmit = (values: LoginFormValues) => {
      setFormError('')

      const user = users.find(
         (item) => item.email === values.email && item.password === values.password,
      )

      if (!user) {
         setFormError('Пользователь с такими данными не найден')
         return
      }

      dispatch(setCurrentUser(user))
      navigate('/dashboard')
   }

   if (isAuthenticated) {
      return <Navigate replace to="/dashboard" />
   }

   return (
      <div className={styles.card}>
         <h1 className={styles.title}>Вход в аккаунт</h1>

         <form className={styles.form} noValidate onSubmit={handleSubmit(onSubmit)}>
            <FormField error={errors.email?.message} htmlFor="email" label="Email или логин" required>
               <Input
                  hasError={Boolean(errors.email)}
                  id="email"
                  placeholder="ivanov@yandex.ru"
                  type="email"
                  {...register('email')}
               />
            </FormField>

            <div className={styles.passwordGroup}>
               <FormField error={errors.password?.message} htmlFor="password" label="Пароль" required>
                  <Input
                     hasError={Boolean(errors.password)}
                     id="password"
                     placeholder="******"
                     type="password"
                     {...register('password')}
                  />
               </FormField>

               <Link className={styles.forgotLink} to="/password-recovery">
                  Забыли пароль?
               </Link>
            </div>

            {formError && <p className={styles.error}>{formError}</p>}

            <Button className={styles.submitButton} disabled={isSubmitting || isLoading} fullWidth type="submit">
               {isLoading ? 'Загрузка...' : 'Войти'}
            </Button>
         </form>
      </div>
   )
}