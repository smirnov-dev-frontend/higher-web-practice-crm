import { zodResolver } from '@hookform/resolvers/zod'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { useState } from 'react'

import { Button } from '../components/ui/Button/Button'
import { FormField } from '../components/ui/FormField/FormField'
import { Input } from '../components/ui/Input/Input'
import { registerSchema, type RegisterFormValues } from '../features/auth/schemas'
import { selectIsAuthenticated } from '../features/auth/authSelectors'
import { setCurrentUser } from '../features/auth/authSlice'
import { useAppDispatch, useAppSelector } from '../app/hooks'
import { useGetUsersQuery, useRegisterUserMutation } from '../api/usersApi'

import styles from './AuthPages.module.css'

export function RegisterPage() {
   const dispatch = useAppDispatch()
   const isAuthenticated = useAppSelector(selectIsAuthenticated)
   const navigate = useNavigate()
   const [formError, setFormError] = useState('')

   const { data: users = [], isLoading: isUsersLoading } = useGetUsersQuery()
   const [registerUser, { isLoading: isRegistering }] = useRegisterUserMutation()

   const {
      formState: { errors, isSubmitting },
      handleSubmit,
      register,
   } = useForm<RegisterFormValues>({
      resolver: zodResolver(registerSchema),
      defaultValues: {
         accountName: '',
         confirmPassword: '',
         email: '',
         firstName: '',
         lastName: '',
         password: '',
      },
   })

   const onSubmit = async (values: RegisterFormValues) => {
      setFormError('')

      const normalizedEmail = values.email.toLowerCase()
      const userExists = users.some((user) => user.email.toLowerCase() === normalizedEmail)

      if (userExists) {
         setFormError('Пользователь с таким email уже зарегистрирован')
         return
      }

      const accountNameTaken = users.some((user) => user.username === values.accountName.trim())

      if (accountNameTaken) {
         setFormError('Это имя аккаунта уже занято')
         return
      }

      try {
         const createdUser = await registerUser({
            email: normalizedEmail,
            name: `${values.firstName} ${values.lastName}`,
            password: values.password,
            username: values.accountName.trim(),
         }).unwrap()

         dispatch(setCurrentUser(createdUser))
         navigate('/dashboard')
      } catch {
         setFormError('Не удалось зарегистрироваться. Попробуйте ещё раз')
      }
   }

   if (isAuthenticated) {
      return <Navigate replace to="/dashboard" />
   }

   return (
      <div className={`${styles.card} ${styles.registerCard}`}>
         <h1 className={styles.title}>Регистрация</h1>

         <form className={styles.form} noValidate onSubmit={handleSubmit(onSubmit)}>
            <FormField error={errors.firstName?.message} htmlFor="firstName" label="Имя" required>
               <Input
                  hasError={Boolean(errors.firstName)}
                  id="firstName"
                  placeholder="Ярополк"
                  type="text"
                  {...register('firstName')}
               />
            </FormField>

            <FormField error={errors.lastName?.message} htmlFor="lastName" label="Фамилия" required>
               <Input
                  hasError={Boolean(errors.lastName)}
                  id="lastName"
                  placeholder="Иванов"
                  type="text"
                  {...register('lastName')}
               />
            </FormField>

            <FormField error={errors.email?.message} htmlFor="email" label="Email" required>
               <Input
                  hasError={Boolean(errors.email)}
                  id="email"
                  placeholder="ivanov@yandex.ru"
                  type="email"
                  {...register('email')}
               />
            </FormField>

            <FormField
               error={errors.accountName?.message}
               htmlFor="accountName"
               label="Имя аккаунта"
               required
            >
               <Input
                  hasError={Boolean(errors.accountName)}
                  id="accountName"
                  placeholder="Yaropolk"
                  type="text"
                  {...register('accountName')}
               />
            </FormField>

            <FormField
               error={errors.password?.message}
               htmlFor="password"
               label="Придумайте пароль"
               required
            >
               <Input
                  hasError={Boolean(errors.password)}
                  id="password"
                  placeholder="******"
                  type="password"
                  {...register('password')}
               />
            </FormField>

            <FormField
               error={errors.confirmPassword?.message}
               htmlFor="confirmPassword"
               label="Повторите пароль"
               required
            >
               <Input
                  hasError={Boolean(errors.confirmPassword)}
                  id="confirmPassword"
                  placeholder="******"
                  type="password"
                  {...register('confirmPassword')}
               />
            </FormField>

            {formError && <p className={styles.error}>{formError}</p>}

            <Button
               className={styles.registerSubmitButton}
               disabled={isSubmitting || isUsersLoading || isRegistering}
               fullWidth
               type="submit"
            >
               {isRegistering ? 'Регистрация...' : 'Зарегистрироваться'}
            </Button>
         </form>

         <div className={styles.mobileFooter}>
            <p className={styles.mobileFooterText}>Уже зарегистрированы?</p>
            <Link className={styles.mobileFooterLink} to="/login">Войти в аккаунт</Link>
         </div>
      </div>
   )
}