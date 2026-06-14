import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useRef } from 'react'
import { useForm } from 'react-hook-form'

import {
   useCreateClientMutation,
   useDeleteClientMutation,
   useUpdateClientMutation,
} from '../../api/clientsApi'
import { useAppSelector } from '../../app/hooks'
import { Button } from '../../components/ui/Button/Button'
import { FormField } from '../../components/ui/FormField/FormField'
import { Input } from '../../components/ui/Input/Input'
import { Modal } from '../../components/ui/Modal/Modal'
import { selectCurrentUser } from '../auth/authSelectors'
import { clientSchema, type ClientFormValues } from './clientsSchema'
import type { Client } from '../../types/client'
import { formatDate, formatPhone, normalizePhone } from '../../utils/format'

import styles from './ClientModal.module.css'

type ClientModalProps = {
   client?: Client
   draft?: Partial<ClientFormValues>
   onClose: () => void
   onDraftSave?: (draft: Partial<ClientFormValues>) => void
}

export function ClientModal({ client, draft, onClose, onDraftSave }: ClientModalProps) {
   const currentUser = useAppSelector(selectCurrentUser)
   const [createClient, { isLoading: isCreating }] = useCreateClientMutation()
   const [updateClient, { isLoading: isUpdating }] = useUpdateClientMutation()
   const [deleteClient, { isLoading: isDeleting }] = useDeleteClientMutation()

   const submittedRef = useRef(false)
   const draftRef = useRef(draft)

   const {
      formState: { errors },
      getValues,
      handleSubmit,
      register,
      reset,
   } = useForm<ClientFormValues>({
      defaultValues: { comment: '', company: '', email: '', name: '', phone: '', website: '' },
      resolver: zodResolver(clientSchema),
   })

   useEffect(() => {
      if (client) {
         reset({
            comment: client.comment ?? '',
            company: client.company,
            email: client.email,
            name: client.name,
            phone: formatPhone(client.phone),
            website: client.website ?? '',
         })
      } else if (draftRef.current && Object.keys(draftRef.current).length > 0) {
         const d = draftRef.current
         reset({
            name: d.name ?? '',
            phone: d.phone ?? '',
            company: d.company ?? '',
            email: d.email ?? '',
            website: d.website ?? '',
            comment: d.comment ?? '',
         })
      }
   }, [client, reset])

   useEffect(() => {
      return () => {
         if (!submittedRef.current && onDraftSave) {
            const v = getValues()
            const saved: Partial<ClientFormValues> = {}
            if (v.name.trim()) saved.name = v.name
            if (v.phone.trim()) saved.phone = v.phone
            if (v.company.trim()) saved.company = v.company
            if (v.email.trim()) saved.email = v.email
            if (v.website.trim()) saved.website = v.website
            if (v.comment.trim()) saved.comment = v.comment
            onDraftSave(saved)
         }
      }
   // eslint-disable-next-line react-hooks/exhaustive-deps
   }, [])

   const onSubmit = async (values: ClientFormValues) => {
      const payload = {
         ...values,
         comment: values.comment || undefined,
         phone: normalizePhone(values.phone),
         website: values.website || undefined,
      }

      if (client) {
         await updateClient({ data: payload, id: client.id }).unwrap()
      } else {
         await createClient({ ...payload, createdBy: currentUser!.id }).unwrap()
         onDraftSave?.({})
      }
      submittedRef.current = true
      onClose()
   }

   const handleDelete = async () => {
      if (!client) return
      await deleteClient(client.id).unwrap()
      onClose()
   }

   const isBusy = isCreating || isUpdating || isDeleting
   const isReadOnly = Boolean(client?.deleted)

   return (
      <Modal onClose={onClose}>
         <form className={styles.form} noValidate onSubmit={handleSubmit(onSubmit)}>
            <div className={styles.content}>
               <div className={styles.header}>
                  <h2 className={styles.title} id="modal-title">
                     {client ? 'Карточка клиента' : 'Новый клиент'}
                  </h2>
                  {client && (
                     <span className={styles.date}>добавлен {formatDate(client.createdAt)}</span>
                  )}
               </div>

               <div className={styles.fields}>
                  <FormField error={errors.name?.message} htmlFor="client-name" label="Имя" required={!isReadOnly}>
                     <Input
                        autoFocus={!isReadOnly}
                        disabled={isReadOnly}
                        hasError={Boolean(errors.name)}
                        id="client-name"
                        placeholder="Ярополк Иванов"
                        {...register('name')}
                     />
                  </FormField>

                  <div className={styles.row}>
                     <FormField
                        error={errors.phone?.message}
                        htmlFor="client-phone"
                        label="Телефон"
                        required={!isReadOnly}
                     >
                        <Input
                           disabled={isReadOnly}
                           hasError={Boolean(errors.phone)}
                           id="client-phone"
                           placeholder="+7 900 000-00-00"
                           type="tel"
                           {...register('phone')}
                        />
                     </FormField>

                     <FormField
                        error={errors.company?.message}
                        htmlFor="client-company"
                        label="Компания"
                        required={!isReadOnly}
                     >
                        <Input
                           disabled={isReadOnly}
                           hasError={Boolean(errors.company)}
                           id="client-company"
                           placeholder="ООО Рога и Копыта"
                           {...register('company')}
                        />
                     </FormField>
                  </div>

                  <div className={styles.row}>
                     <FormField
                        error={errors.website?.message}
                        htmlFor="client-website"
                        label="Сайт"
                     >
                        <Input
                           disabled={isReadOnly}
                           hasError={Boolean(errors.website)}
                           id="client-website"
                           placeholder="www.company.ru"
                           {...register('website')}
                        />
                     </FormField>

                     <FormField
                        error={errors.email?.message}
                        htmlFor="client-email"
                        label="Email"
                        required={!isReadOnly}
                     >
                        <Input
                           disabled={isReadOnly}
                           hasError={Boolean(errors.email)}
                           id="client-email"
                           placeholder="ivanov@yandex.ru"
                           type="email"
                           {...register('email')}
                        />
                     </FormField>
                  </div>

                  <FormField
                     error={errors.comment?.message}
                     htmlFor="client-comment"
                     label="Комментарий"
                  >
                     <textarea
                        className={styles.textarea}
                        disabled={isReadOnly}
                        id="client-comment"
                        placeholder="Прогнозируется рост активности"
                        {...register('comment')}
                     />
                  </FormField>
               </div>
            </div>

            <div className={styles.actions}>
               {!isReadOnly && (
                  <Button className={styles.submitBtn} disabled={isBusy} type="submit">
                     {isUpdating || isCreating ? 'Сохранение...' : client ? 'Редактировать' : 'Создать'}
                  </Button>
               )}

               {client && !client.deleted ? (
                  <Button
                     disabled={isBusy}
                     type="button"
                     variant="danger"
                     onClick={handleDelete}
                  >
                     {isDeleting ? 'Удаление...' : 'Удалить клиента'}
                  </Button>
               ) : (
                  <Button type="button" variant="secondary" onClick={onClose}>
                     {isReadOnly ? 'Закрыть' : 'Отменить'}
                  </Button>
               )}
            </div>
         </form>
      </Modal>
   )
}