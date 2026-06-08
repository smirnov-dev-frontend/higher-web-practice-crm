import { zodResolver } from '@hookform/resolvers/zod'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'

import { Button } from '../components/ui/Button/Button'
import { FormField } from '../components/ui/FormField/FormField'
import { Input } from '../components/ui/Input/Input'
import {
   passwordRecoverySchema,
   type PasswordRecoveryFormValues,
} from '../features/auth/schemas'

import styles from './AuthPages.module.css'

export function PasswordRecoveryPage() {
   const navigate = useNavigate()

   const {
      formState: { errors, isSubmitting },
      handleSubmit,
      register,
   } = useForm<PasswordRecoveryFormValues>({
      resolver: zodResolver(passwordRecoverySchema),
      defaultValues: {
         email: '',
      },
   })

   const onSubmit = () => {
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
      </div>
   )
}