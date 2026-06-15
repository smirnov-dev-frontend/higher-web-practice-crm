import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

import { useGetUsersQuery, useUpdateUserMutation } from '../api/usersApi'
import { useAppDispatch, useAppSelector } from '../app/hooks'
import { Button } from '../components/ui/Button/Button'
import { FormField } from '../components/ui/FormField/FormField'
import { Input } from '../components/ui/Input/Input'
import { setCurrentUser, logout } from '../features/auth/authSlice'
import { selectCurrentUser } from '../features/auth/authSelectors'
import type { UpdateProfilePayload } from '../types/user'
import AddAvatarIcon from '../icons/add-avatar.svg?react'

import styles from './ProfilePage.module.css'

const profileSchema = z
   .object({
      firstName: z.string().trim().min(1, 'Введите имя'),
      lastName: z.string().trim().min(1, 'Введите фамилию'),
      email: z.string().trim().email('Введите корректный email'),
      accountName: z.string().trim(),
      currentPassword: z.string(),
      newPassword: z.string(),
      confirmPassword: z.string(),
   })
   .refine((d) => !d.newPassword || !!d.currentPassword, {
      message: 'Введите текущий пароль',
      path: ['currentPassword'],
   })
   .refine((d) => !d.newPassword || d.newPassword === d.confirmPassword, {
      message: 'Пароли не совпадают',
      path: ['confirmPassword'],
   })

type ProfileFormValues = z.infer<typeof profileSchema>

export function ProfilePage() {
   const currentUser = useAppSelector(selectCurrentUser)
   const dispatch = useAppDispatch()
   const navigate = useNavigate()
   const [updateUser, { isLoading }] = useUpdateUserMutation()

   const handleLogout = () => {
      dispatch(logout())
      navigate('/login')
   }
   const { data: allUsers = [] } = useGetUsersQuery()

   const [pendingAvatar, setPendingAvatar] = useState<string | null>(null)

   const {
      formState: { errors, isDirty },
      handleSubmit,
      register,
      reset,
      setError,
      watch,
   } = useForm<ProfileFormValues>({
      resolver: zodResolver(profileSchema),
      defaultValues: {
         firstName: '',
         lastName: '',
         email: '',
         accountName: '',
         currentPassword: '',
         newPassword: '',
         confirmPassword: '',
      },
   })

   useEffect(() => {
      if (!currentUser) return
      const parts = currentUser.name.split(' ')
      reset({
         firstName: parts[0] ?? '',
         lastName: parts.slice(1).join(' '),
         email: currentUser.email,
         accountName: currentUser.username ?? '',
         currentPassword: '',
         newPassword: '',
         confirmPassword: '',
      })
   }, [currentUser, reset])

   const fileInputRef = useRef<HTMLInputElement>(null)

   const watchedEmail = watch('email')
   const emailChanged = watchedEmail !== (currentUser?.email ?? '')
   const showEmailVerify = emailChanged || !currentUser?.emailVerified

   const [codeSent, setCodeSent] = useState(false)
   const [mockCode, setMockCode] = useState('')
   const [codeSentEmail, setCodeSentEmail] = useState('')
   const [codeInput, setCodeInput] = useState('')
   const [codeError, setCodeError] = useState('')
   const [isVerifying, setIsVerifying] = useState(false)

   useEffect(() => {
      if (currentUser?.emailVerified) {
         setCodeSent(false)
         setCodeInput('')
         setCodeError('')
         setMockCode('')
      }
   }, [currentUser?.emailVerified])

   const handleSendCode = () => {
      const code = String(Math.floor(100000 + Math.random() * 900000))
      setMockCode(code)
      setCodeSent(true)
      setCodeSentEmail(watchedEmail)
      setCodeInput('')
      setCodeError('')
   }

   const handleVerifyCode = async () => {
      if (!currentUser) return
      if (codeInput.trim() !== mockCode) {
         setCodeError('Неверный код')
         return
      }
      setIsVerifying(true)
      try {
         const updated = await updateUser({ id: currentUser.id, data: { emailVerified: true } }).unwrap()
         dispatch(setCurrentUser(updated))
         setCodeSent(false)
         setCodeInput('')
         setMockCode('')
      } finally {
         setIsVerifying(false)
      }
   }

   const handleAvatarClick = () => fileInputRef.current?.click()

   const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (!file) return
      const reader = new FileReader()
      reader.onload = () => setPendingAvatar(reader.result as string)
      reader.readAsDataURL(file)
      e.target.value = ''
   }

   const onSubmit = async (values: ProfileFormValues) => {
      if (!currentUser) return

      const trimmedAccountName = values.accountName.trim()
      if (trimmedAccountName) {
         const isTaken = allUsers.some(
            (u) => u.id !== currentUser.id && u.username === trimmedAccountName
         )
         if (isTaken) {
            setError('accountName', { message: 'Это имя уже занято' })
            return
         }
      }

      if (values.newPassword && values.currentPassword !== currentUser.password) {
         setError('currentPassword', { message: 'Неверный пароль' })
         return
      }

      const update: UpdateProfilePayload = {}
      const newName = [values.firstName.trim(), values.lastName.trim()].filter(Boolean).join(' ')

      if (newName !== currentUser.name) update.name = newName
      if (values.email !== currentUser.email) {
         update.email = values.email
         update.emailVerified = false
      }
      if (trimmedAccountName !== (currentUser.username ?? '')) update.username = trimmedAccountName || undefined
      if (values.newPassword) update.password = values.newPassword
      if (pendingAvatar) update.avatar = pendingAvatar

      if (Object.keys(update).length === 0) return

      const updated = await updateUser({ id: currentUser.id, data: update }).unwrap()
      dispatch(setCurrentUser(updated))
      setPendingAvatar(null)
      const updatedParts = updated.name.split(' ')
      reset({
         firstName: updatedParts[0] ?? '',
         lastName: updatedParts.slice(1).join(' '),
         email: updated.email,
         accountName: updated.username ?? '',
         currentPassword: '',
         newPassword: '',
         confirmPassword: '',
      })
   }

   const initials = (currentUser?.name ?? '')
      .split(' ')
      .slice(0, 2)
      .map((w) => w[0] ?? '')
      .join('')
      .toUpperCase()

   return (
      <div className={styles.page}>
         <h1 className={styles.title}>Настройка аккаунта</h1>

         <div className={styles.card}>
            <form className={styles.form} noValidate onSubmit={handleSubmit(onSubmit)}>
               <div className={styles.section}>
                  <div className={styles.avatarArea}>
                     {(pendingAvatar ?? currentUser?.avatar)
                        ? <img alt="Аватар" className={styles.avatarImg} src={pendingAvatar ?? currentUser!.avatar!} />
                        : <div className={styles.avatar}>{initials}</div>
                     }
                     <div className={styles.avatarBtnWrapper}>
                        <input
                           ref={fileInputRef}
                           accept="image/*"
                           aria-hidden="true"
                           className={styles.fileInput}
                           tabIndex={-1}
                           type="file"
                           onChange={handleFileChange}
                        />
                        <button
                           aria-label="Изменить фото"
                           className={styles.avatarBtn}
                           type="button"
                           onClick={handleAvatarClick}
                        >
                           <AddAvatarIcon aria-hidden="true" />
                        </button>
                     </div>
                  </div>

                  <div className={styles.fieldRow}>
                     <FormField error={errors.firstName?.message} htmlFor="firstName" label="Имя">
                        <Input hasError={!!errors.firstName} id="firstName" {...register('firstName')} />
                     </FormField>
                     <FormField error={errors.lastName?.message} htmlFor="lastName" label="Фамилия">
                        <Input hasError={!!errors.lastName} id="lastName" {...register('lastName')} />
                     </FormField>
                  </div>

                  <div className={styles.fieldRow}>
                     <FormField error={errors.email?.message} htmlFor="email" label="Email">
                        <Input
                           hasError={!!errors.email || showEmailVerify}
                           id="email"
                           type="email"
                           {...register('email')}
                        />
                     </FormField>
                     <FormField error={errors.accountName?.message} htmlFor="accountName" label="Имя аккаунта">
                        <Input
                           hasError={!!errors.accountName}
                           id="accountName"
                           {...register('accountName')}
                        />
                     </FormField>
                  </div>

                  {showEmailVerify && (
                     <div className={styles.emailVerify}>
                        {codeSent ? (
                           <>
                              <p className={styles.emailVerifyHint}>
                                 Код отправлен на {codeSentEmail}
                              </p>
                              <p className={styles.emailVerifyDemo}>Демо-код: {mockCode}</p>
                              <div className={styles.emailVerifyCodeRow}>
                                 <Input
                                    hasError={!!codeError}
                                    placeholder="Введите код"
                                    value={codeInput}
                                    onChange={(e) => { setCodeInput(e.target.value); setCodeError('') }}
                                 />
                                 <Button
                                    disabled={isVerifying || !codeInput.trim()}
                                    type="button"
                                    onClick={handleVerifyCode}
                                 >
                                    {isVerifying ? 'Проверка...' : 'Подтвердить'}
                                 </Button>
                              </div>
                              {codeError && <p className={styles.emailVerifyError}>{codeError}</p>}
                              <button className={styles.emailVerifyResend} type="button" onClick={handleSendCode}>
                                 Отправить повторно
                              </button>
                           </>
                        ) : (
                           <>
                              <p className={styles.emailVerifyHint}>
                                 Подтвердите почту, чтобы пользоваться всеми возможностями системы
                              </p>
                              <Button className={styles.emailVerifyBtn} type="button" onClick={handleSendCode}>
                                 Отправить ссылку
                              </Button>
                           </>
                        )}
                     </div>
                  )}
               </div>

               <div className={styles.passwordSection}>
                  <p className={styles.passwordTitle}>Пароль</p>
                  <div className={styles.passwordFields}>
                     <FormField
                        error={errors.currentPassword?.message}
                        htmlFor="currentPassword"
                        label="Существующий пароль"
                     >
                        <Input
                           hasError={!!errors.currentPassword}
                           id="currentPassword"
                           placeholder="•••••••"
                           type="password"
                           {...register('currentPassword')}
                        />
                     </FormField>
                     <div className={styles.fieldRow}>
                        <FormField
                           error={errors.newPassword?.message}
                           htmlFor="newPassword"
                           label="Новый пароль"
                        >
                           <Input
                              hasError={!!errors.newPassword}
                              id="newPassword"
                              placeholder="•••••••"
                              type="password"
                              {...register('newPassword')}
                           />
                        </FormField>
                        <FormField
                           error={errors.confirmPassword?.message}
                           htmlFor="confirmPassword"
                           label="Повторите пароль"
                        >
                           <Input
                              hasError={!!errors.confirmPassword}
                              id="confirmPassword"
                              placeholder="•••••••"
                              type="password"
                              {...register('confirmPassword')}
                           />
                        </FormField>
                     </div>
                  </div>
               </div>

               <div className={styles.bottomSection}>
                  <Button disabled={isLoading || (!isDirty && !pendingAvatar)} fullWidth type="submit">
                     {isLoading ? 'Сохранение...' : 'Сохранить изменения'}
                  </Button>
                  <div className={styles.linkRow}>
                     <button className={styles.deleteLink} type="button">
                        Удалить аккаунт
                     </button>
                     <button className={styles.deleteLink} type="button" onClick={handleLogout}>
                        Выйти из аккаунта
                     </button>
                  </div>
               </div>
            </form>
         </div>
      </div>
   )
}