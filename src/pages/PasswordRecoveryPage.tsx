import { zodResolver } from '@hookform/resolvers/zod'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'

import { Button } from '../components/ui/Button/Button'
import { FormField } from '../components/ui/FormField/FormField'
import { Input } from '../components/ui/Input/Input'
import {
   passwordRecoverySchema,
   type PasswordRecoveryFormValues,
} from '../features/auth/schemas'
import { useGetUsersQuery } from '../api/usersApi'

import styles from './AuthPages.module.css'

export function PasswordRecoveryPage() {
   const navigate = useNavigate()
   const { data: users = [] } = useGetUsersQuery()

   const {
      formState: { errors, isSubmitting },
      handleSubmit,
      register,
      setError,
   } = useForm<PasswordRecoveryFormValues>({
      resolver: zodResolver(passwordRecoverySchema),
      defaultValues: {
         email: '',
      },
   })

   const onSubmit = (values: PasswordRecoveryFormValues) => {
      const exists = users.some((u) => u.email.toLowerCase() === values.email.toLowerCase())
      if (!exists) {
         setError('email', { message: 'Почта не найдена' })
         return
      }
      navigate('/email-confirmation')
   }

   return (
      <div className={`${styles.card} ${styles.recoveryCard}`}>
         <h1 className={styles.title}>Восстановление пароля</h1>

         <p className={styles.description}>
            Укажите почту, на которую вы регистрировали аккаунт, и мы отправим вам инструкцию по
            восстановлению пароля.
         </p>

         <form className={styles.form} noValidate onSubmit={handleSubmit(onSubmit)}>
            <FormField error={errors.email?.message} htmlFor="email" label="Email" required>
               <Input
                  hasError={Boolean(errors.email)}
                  id="email"
                  placeholder="ivanov@yandex.ru"
                  type="email"
                  {...register('email')}
               />
            </FormField>

            <Button
               className={styles.recoverySubmitButton}
               disabled={isSubmitting}
               fullWidth
               type="submit"
            >
               Восстановить
            </Button>
         </form>

         <div className={styles.mobileFooter}>
            <p className={styles.mobileFooterText}>Уже зарегистрированы?</p>
            <Link className={styles.mobileFooterLink} to="/login">Войти в аккаунт</Link>
         </div>
      </div>
   )
}