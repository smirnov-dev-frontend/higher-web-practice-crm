import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { useState } from 'react'

const generateCode = () => String(Math.floor(100000 + Math.random() * 900000))

import { Button } from '../components/ui/Button/Button'
import { FormField } from '../components/ui/FormField/FormField'
import { Input } from '../components/ui/Input/Input'
import {
   emailConfirmationSchema,
   type EmailConfirmationFormValues,
} from '../features/auth/schemas'

import styles from './AuthPages.module.css'

export function EmailConfirmationPage() {
   const [successMessage, setSuccessMessage] = useState('')
   const [mockCode, setMockCode] = useState(generateCode)

   const {
      formState: { errors, isSubmitting },
      handleSubmit,
      register,
      setError,
   } = useForm<EmailConfirmationFormValues>({
      resolver: zodResolver(emailConfirmationSchema),
      defaultValues: {
         confirmationLink: '',
      },
   })

   const onSubmit = (values: EmailConfirmationFormValues) => {
      if (values.confirmationLink.trim() !== mockCode) {
         setError('confirmationLink', { message: 'Неверный код' })
         return
      }
      setSuccessMessage('Почта успешно подтверждена')
   }

   const handleResend = () => {
      setMockCode(generateCode())
      setSuccessMessage('Письмо с подтверждением отправлено повторно')
   }

   return (
      <div className={`${styles.card} ${styles.confirmationCard}`}>
         <h1 className={styles.title}>Подтверждение почты</h1>

         <p className={styles.description}>
            Вставьте ссылку из полученного письма
            <br />
            <span className={styles.demoCode}>Демо-код: {mockCode}</span>
         </p>

         <form className={styles.form} noValidate onSubmit={handleSubmit(onSubmit)}>
            <FormField
               error={errors.confirmationLink?.message}
               htmlFor="confirmationLink"
               label="Ссылка подтверждения"
               required
            >
               <Input
                  hasError={Boolean(errors.confirmationLink)}
                  id="confirmationLink"
                  type="text"
                  {...register('confirmationLink')}
               />
            </FormField>

            {successMessage && <p className={styles.success}>{successMessage}</p>}

            <Button className={styles.confirmationSubmitButton} disabled={isSubmitting} fullWidth type="submit">
               Подтвердить
            </Button>

            <div className={styles.resendBlock}>
               <p className={styles.resendText}>Не пришло письмо?</p>

               <Button fullWidth type="button" variant="secondary" onClick={handleResend}>
                  Отправить повторно
               </Button>
            </div>
         </form>
      </div>
   )
}