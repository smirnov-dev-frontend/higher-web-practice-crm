import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useMemo, useRef } from 'react'
import { Controller, useForm } from 'react-hook-form'

import { useGetDealsQuery } from '../../api/dealsApi'
import { useCreateTaskMutation, useUpdateTaskMutation } from '../../api/tasksApi'
import { useGetUsersQuery } from '../../api/usersApi'
import { useAppSelector } from '../../app/hooks'
import { Button } from '../../components/ui/Button/Button'
import { Combobox } from '../../components/ui/Combobox/Combobox'
import { FormField } from '../../components/ui/FormField/FormField'
import { Input } from '../../components/ui/Input/Input'
import { Modal } from '../../components/ui/Modal/Modal'
import { selectCurrentUser } from '../auth/authSelectors'
import type { Task } from '../../types/task'
import { formatDate } from '../../utils/format'
import { taskSchema, type TaskFormValues } from './taskSchema'

import styles from './TaskModal.module.css'

const STATUS_OPTIONS = [
   { value: 'new', label: 'Новая' },
   { value: 'in_progress', label: 'В работе' },
   { value: 'completed', label: 'Завершена' },
]

const ACTIVE_STATUS_OPTIONS = [
   { value: 'new', label: 'Новая' },
   { value: 'in_progress', label: 'В работе' },
]

type TaskModalProps = {
   task?: Task
   draft?: Partial<TaskFormValues>
   onClose: () => void
   onDraftSave?: (draft: Partial<TaskFormValues>) => void
}

export function TaskModal({ task, draft, onClose, onDraftSave }: TaskModalProps) {
   const currentUser = useAppSelector(selectCurrentUser)
   const { data: deals = [] } = useGetDealsQuery()
   const { data: users = [] } = useGetUsersQuery()
   const [createTask, { isLoading: isCreating }] = useCreateTaskMutation()
   const [updateTask, { isLoading: isUpdating }] = useUpdateTaskMutation()

   const userDeals = useMemo(
      () => deals.filter((d) => d.createdBy === currentUser?.id),
      [deals, currentUser?.id],
   )

   const submittedRef = useRef(false)
   const draftRef = useRef(draft)

   const {
      control,
      formState: { errors },
      getValues,
      handleSubmit,
      register,
      reset,
      watch,
   } = useForm<TaskFormValues>({
      defaultValues: {
         title: '',
         dealId: '',
         description: '',
         dueDate: '',
         assigneeId: '',
         status: 'new',
      },
      resolver: zodResolver(taskSchema),
   })

   useEffect(() => {
      if (task) {
         reset({
            title: task.title,
            dealId: task.dealId ?? '',
            description: task.description ?? '',
            dueDate: task.dueDate ? task.dueDate.slice(0, 10) : '',
            assigneeId: task.assigneeId,
            status: task.status,
         })
      } else if (draftRef.current && Object.keys(draftRef.current).length > 0) {
         const d = draftRef.current
         reset({
            title: d.title ?? '',
            dealId: d.dealId ?? '',
            description: d.description ?? '',
            dueDate: d.dueDate ?? '',
            assigneeId: d.assigneeId ?? '',
            status: 'new',
         })
      }
   }, [task, reset])

   useEffect(() => {
      return () => {
         if (!submittedRef.current && onDraftSave) {
            const v = getValues()
            const saved: Partial<TaskFormValues> = {}
            if (v.title.trim()) saved.title = v.title
            if (v.dealId) saved.dealId = v.dealId
            if (v.description?.trim()) saved.description = v.description
            if (v.dueDate) saved.dueDate = v.dueDate
            if (v.assigneeId) saved.assigneeId = v.assigneeId
            onDraftSave(saved)
         }
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
   }, [])

   const onSubmit = async (values: TaskFormValues) => {
      if (task) {
         await updateTask({
            id: task.id,
            data: {
               title: values.title,
               dealId: values.dealId,
               description: values.description || undefined,
               dueDate: values.dueDate ? new Date(values.dueDate).toISOString() : undefined,
               assigneeId: values.assigneeId,
               status: values.status,
            },
         }).unwrap()
      } else {
         await createTask({
            title: values.title,
            dealId: values.dealId,
            description: values.description || undefined,
            dueDate: values.dueDate ? new Date(values.dueDate).toISOString() : undefined,
            assigneeId: values.assigneeId,
            createdBy: currentUser!.id,
         }).unwrap()
         onDraftSave?.({})
      }
      submittedRef.current = true
      onClose()
   }

   const handleComplete = async () => {
      if (!task) return
      await updateTask({ id: task.id, data: { status: 'completed' } }).unwrap()
      onClose()
   }

   const watchedDueDate = watch('dueDate')
   const today = new Date().toISOString().slice(0, 10)
   const isTaskOverdue = task
      ? Boolean(task.dueDate && task.dueDate.slice(0, 10) < today && task.status !== 'completed')
      : false
   const dueDateFixed = Boolean(watchedDueDate && watchedDueDate >= today)
   const statusDisabled = !task || task.status === 'completed' || (isTaskOverdue && !dueDateFixed)
   const overdueAndUnfixed = isTaskOverdue && !dueDateFixed
   const statusOptions = task?.status === 'completed'
      ? STATUS_OPTIONS
      : overdueAndUnfixed
        ? [{ value: task!.status, label: 'Просрочена' }]
        : ACTIVE_STATUS_OPTIONS

   const isBusy = isCreating || isUpdating

   return (
      <Modal onClose={onClose}>
         <form className={styles.form} noValidate onSubmit={handleSubmit(onSubmit)}>
            <div className={styles.content}>
               <div className={styles.header}>
                  <h2 className={styles.title} id="modal-title">
                     {task ? 'Карточка задачи' : 'Новая задача'}
                  </h2>
                  {task && (
                     <span className={styles.date}>Создана {formatDate(task.createdAt)}</span>
                  )}
               </div>

               <div className={styles.fields}>
                  <div className={styles.row}>
                     <FormField
                        error={errors.title?.message}
                        htmlFor="task-title"
                        label="Название"
                        required
                     >
                        <Input
                           autoFocus
                           hasError={Boolean(errors.title)}
                           id="task-title"
                           placeholder="Подготовить договор"
                           {...register('title')}
                        />
                     </FormField>

                     <FormField
                        error={errors.dealId?.message}
                        htmlFor="task-deal"
                        label="Сделка"
                        required
                     >
                        <Controller
                           control={control}
                           name="dealId"
                           render={({ field }) => (
                              <Combobox
                                 hasError={Boolean(errors.dealId)}
                                 id="task-deal"
                                 options={userDeals.map((d) => ({ value: d.id, label: d.title }))}
                                 placeholder="Выберите сделку"
                                 value={field.value ?? ''}
                                 onBlur={field.onBlur}
                                 onChange={field.onChange}
                              />
                           )}
                        />
                     </FormField>
                  </div>

                  <div className={styles.row}>
                     <FormField htmlFor="task-dueDate" label="Выполнить до">
                        <Input
                           id="task-dueDate"
                           min={new Date().toISOString().slice(0, 10)}
                           type="date"
                           {...register('dueDate')}
                        />
                     </FormField>

                     <FormField
                        error={errors.assigneeId?.message}
                        htmlFor="task-assignee"
                        label="Исполнитель"
                        required
                     >
                        <Controller
                           control={control}
                           name="assigneeId"
                           render={({ field }) => (
                              <Combobox
                                 hasError={Boolean(errors.assigneeId)}
                                 id="task-assignee"
                                 options={users.map((u) => ({
                                    value: u.id,
                                    label: u.name.split(' ')[0],
                                 }))}
                                 placeholder="Выберите исполнителя"
                                 value={field.value}
                                 onBlur={field.onBlur}
                                 onChange={field.onChange}
                              />
                           )}
                        />
                     </FormField>
                  </div>

                  <FormField htmlFor="task-status" label="Статус">
                     <Controller
                        control={control}
                        name="status"
                        render={({ field }) => (
                           <Combobox
                              disabled={statusDisabled}
                              id="task-status"
                              inputClassName={overdueAndUnfixed ? styles.selectStatus_overdue : styles[`selectStatus_${field.value}`]}
                              options={statusOptions}
                              value={field.value}
                              onBlur={field.onBlur}
                              onChange={field.onChange}
                           />
                        )}
                     />
                  </FormField>

                  <FormField htmlFor="task-description" label="Описание">
                     <textarea
                        className={styles.textarea}
                        id="task-description"
                        placeholder="Подготовить и отправить договор клиенту для согласования."
                        {...register('description')}
                     />
                  </FormField>
               </div>
            </div>

            <div className={styles.actions}>
               <Button className={styles.submitBtn} disabled={isBusy} type="submit">
                  {isBusy ? 'Сохранение...' : task ? 'Редактировать' : 'Создать задачу'}
               </Button>

               {task && task.status !== 'completed' ? (
                  <Button
                     disabled={isBusy}
                     type="button"
                     variant="complete"
                     onClick={handleComplete}
                  >
                     Завершить задачу
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