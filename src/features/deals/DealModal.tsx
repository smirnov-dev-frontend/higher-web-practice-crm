import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useMemo, useRef } from 'react'
import { Controller, useForm } from 'react-hook-form'

import { useGetClientsQuery } from '../../api/clientsApi'
import { useCreateDealMutation, useUpdateDealMutation } from '../../api/dealsApi'
import { useAppSelector } from '../../app/hooks'
import { Button } from '../../components/ui/Button/Button'
import { Combobox } from '../../components/ui/Combobox/Combobox'
import { FormField } from '../../components/ui/FormField/FormField'
import { Input } from '../../components/ui/Input/Input'
import { Modal } from '../../components/ui/Modal/Modal'
import { selectCurrentUser } from '../auth/authSelectors'
import type { Deal } from '../../types/deal'
import { formatDate } from '../../utils/format'
import { dealSchema, type DealFormValues } from './dealSchema'

import RowIcon from '../../icons/row.svg?react'
import styles from './DealModal.module.css'

const STATUS_OPTIONS = [
   { value: 'new', label: 'Новая' },
   { value: 'in_progress', label: 'В работе' },
   { value: 'completed', label: 'Завершена' },
   { value: 'cancelled', label: 'Отменена' },
]

const SELECTABLE_STATUS_OPTIONS = STATUS_OPTIONS.filter((o) => o.value !== 'completed')

type DealModalProps = {
   deal?: Deal
   draft?: Partial<DealFormValues>
   onClose: () => void
   onDraftSave?: (draft: Partial<DealFormValues>) => void
}

export function DealModal({ deal, draft, onClose, onDraftSave }: DealModalProps) {
   const currentUser = useAppSelector(selectCurrentUser)
   const { data: clients = [] } = useGetClientsQuery()
   const [createDeal, { isLoading: isCreating }] = useCreateDealMutation()
   const [updateDeal, { isLoading: isUpdating }] = useUpdateDealMutation()

   const userClients = useMemo(
      () => clients.filter((c) => c.createdBy === currentUser?.id && !c.deleted),
      [clients, currentUser?.id],
   )

   const amountRef = useRef<HTMLInputElement>(null)
   const submittedRef = useRef(false)
   const draftRef = useRef(draft)

   const setCursorBeforeSymbol = () => {
      requestAnimationFrame(() => {
         const el = amountRef.current
         if (!el) return
         const pos = el.value.endsWith(' ₽') ? el.value.length - 2 : el.value.length
         el.setSelectionRange(pos, pos)
      })
   }

   const {
      control,
      formState: { errors },
      getValues,
      handleSubmit,
      register,
      reset,
   } = useForm<DealFormValues>({
      defaultValues: {
         title: '',
         clientId: '',
         amount: 0,
         status: 'new',
         description: '',
      },
      resolver: zodResolver(dealSchema),
   })

   useEffect(() => {
      if (deal) {
         reset({
            title: deal.title,
            clientId: deal.clientId,
            amount: deal.amount,
            status: deal.status,
            description: deal.description ?? '',
         })
      } else if (draftRef.current && Object.keys(draftRef.current).length > 0) {
         const d = draftRef.current
         reset({
            title: d.title ?? '',
            clientId: d.clientId ?? '',
            amount: d.amount ?? 0,
            status: d.status ?? 'new',
            description: d.description ?? '',
         })
      }
   }, [deal, reset])

   useEffect(() => {
      return () => {
         if (!submittedRef.current && onDraftSave) {
            const v = getValues()
            const saved: Partial<DealFormValues> = { status: v.status }
            if (v.title.trim()) saved.title = v.title
            if (v.clientId) saved.clientId = v.clientId
            if (v.amount > 0) saved.amount = v.amount
            if (v.description.trim()) saved.description = v.description
            onDraftSave(saved)
         }
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
   }, [])

   const onSubmit = async (values: DealFormValues) => {
      if (deal) {
         await updateDeal({
            id: deal.id,
            data: {
               title: values.title,
               clientId: values.clientId,
               amount: values.amount,
               status: values.status,
               description: values.description || undefined,
            },
         }).unwrap()
      } else {
         await createDeal({
            title: values.title,
            clientId: values.clientId,
            amount: values.amount,
            description: values.description || undefined,
            createdBy: currentUser!.id,
         }).unwrap()
         onDraftSave?.({})
      }
      submittedRef.current = true
      onClose()
   }

   const handleComplete = async () => {
      if (!deal) return
      await updateDeal({
         id: deal.id,
         data: { status: 'completed', completedAt: new Date().toISOString() },
      }).unwrap()
      onClose()
   }

   const isBusy = isCreating || isUpdating
   const isReadOnly = deal?.status === 'completed'

   return (
      <Modal onClose={onClose} panelClassName={isReadOnly ? styles.panelCompleted : undefined}>
         <form className={styles.form} noValidate onSubmit={handleSubmit(onSubmit)}>
            <div className={styles.content}>
               <div className={styles.header}>
                  <div className={styles.headerTop}>
                     <button aria-label="Назад" className={styles.backBtn} type="button" onClick={onClose}>
                        <RowIcon aria-hidden className={styles.backIcon} />
                     </button>
                     <h2 className={styles.title} id="modal-title">
                        {deal ? 'Карточка сделки' : 'Новая сделка'}
                     </h2>
                  </div>
                  {deal && (
                     <span className={styles.date}>Создана {formatDate(deal.createdAt)}</span>
                  )}
               </div>

               <div className={styles.fields}>
                  <div className={styles.row}>
                     <FormField
                        error={errors.title?.message}
                        htmlFor="deal-title"
                        label="Название"
                        required={!isReadOnly}
                     >
                        <Input
                           autoFocus={!isReadOnly}
                           disabled={isReadOnly}
                           hasError={Boolean(errors.title)}
                           id="deal-title"
                           placeholder="Разработка сайта"
                           {...register('title')}
                        />
                     </FormField>

                     <FormField
                        error={errors.clientId?.message}
                        htmlFor="deal-client"
                        label="Клиент"
                        required={!isReadOnly}
                     >
                        <Controller
                           control={control}
                           name="clientId"
                           render={({ field }) => (
                              <Combobox
                                 disabled={isReadOnly}
                                 hasError={Boolean(errors.clientId)}
                                 id="deal-client"
                                 options={userClients.map((c) => ({ value: c.id, label: c.name }))}
                                 placeholder="Велимир Долгорукий"
                                 value={field.value}
                                 onBlur={field.onBlur}
                                 onChange={field.onChange}
                              />
                           )}
                        />
                     </FormField>
                  </div>

                  <div className={styles.row}>
                     <FormField
                        error={errors.amount?.message}
                        htmlFor="deal-amount"
                        label="Сумма"
                        required={!isReadOnly}
                     >
                        <Controller
                           control={control}
                           name="amount"
                           render={({ field }) => {
                              const num = Number(field.value)
                              const displayValue = num > 0
                                 ? new Intl.NumberFormat('ru-RU').format(num) + ' ₽'
                                 : ''
                              return (
                                 <Input
                                    ref={amountRef}
                                    disabled={isReadOnly}
                                    hasError={Boolean(errors.amount)}
                                    id="deal-amount"
                                    inputMode="numeric"
                                    placeholder="50 000 ₽"
                                    type="text"
                                    value={displayValue}
                                    onBlur={field.onBlur}
                                    onChange={() => { }}
                                    onClick={setCursorBeforeSymbol}
                                    onFocus={setCursorBeforeSymbol}
                                    onKeyDown={(e) => {
                                       if (isReadOnly) return
                                       if (/^\d$/.test(e.key)) {
                                          e.preventDefault()
                                          const s = num > 0 ? String(num) : ''
                                          if (s.length < 15) {
                                             field.onChange(parseInt(s + e.key, 10))
                                          }
                                          setCursorBeforeSymbol()
                                       } else if (e.key === 'Backspace' || e.key === 'Delete') {
                                          e.preventDefault()
                                          const s = num > 0 ? String(num) : ''
                                          const shorter = s.slice(0, -1)
                                          field.onChange(shorter ? parseInt(shorter, 10) : 0)
                                          setCursorBeforeSymbol()
                                       }
                                    }}
                                    onPaste={(e) => {
                                       if (isReadOnly) return
                                       e.preventDefault()
                                       const digits = e.clipboardData.getData('text').replace(/\D/g, '')
                                       if (digits) field.onChange(parseInt(digits.slice(0, 15), 10))
                                       setCursorBeforeSymbol()
                                    }}
                                 />
                              )
                           }}
                        />
                     </FormField>

                     <FormField htmlFor="deal-status" label="Статус">
                        <Controller
                           control={control}
                           name="status"
                           render={({ field }) => (
                              <Combobox
                                 disabled={isReadOnly || !deal}
                                 id="deal-status"
                                 inputClassName={styles[`selectStatus_${field.value}`]}
                                 options={isReadOnly ? STATUS_OPTIONS : SELECTABLE_STATUS_OPTIONS}
                                 value={field.value}
                                 onBlur={field.onBlur}
                                 onChange={field.onChange}
                              />
                           )}
                        />
                     </FormField>
                  </div>

                  <FormField
                     error={errors.description?.message}
                     htmlFor="deal-description"
                     label="Описание"
                  >
                     <textarea
                        className={styles.textarea}
                        disabled={isReadOnly}
                        id="deal-description"
                        placeholder="Подготовка финальных условий для долгосрочного контракта."
                        {...register('description')}
                     />
                  </FormField>
               </div>
            </div>

            <div className={styles.actions}>
               {!isReadOnly && (
                  <Button className={styles.submitBtn} disabled={isBusy} type="submit">
                     {isBusy ? 'Сохранение...' : deal ? 'Редактировать' : 'Создать сделку'}
                  </Button>
               )}

               {isReadOnly ? (
                  <Button type="button" variant="secondary" onClick={onClose}>
                     Закрыть
                  </Button>
               ) : deal && deal.status !== 'cancelled' ? (
                  <Button
                     disabled={isBusy}
                     type="button"
                     variant="complete"
                     onClick={handleComplete}
                  >
                     Завершить сделку
                  </Button>
               ) : (
                  <Button type="button" variant="secondary" onClick={onClose}>
                     Отменить
                  </Button>
               )}
            </div>
         </form>
      </Modal>
   )
}