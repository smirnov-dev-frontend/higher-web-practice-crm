import { z } from 'zod'

export const loginSchema = z.object({
   email: z.string().trim().min(1, 'Введите email').email('Введите корректный email'),
   password: z.string().min(1, 'Введите пароль'),
})

export const registerSchema = z
   .object({
      accountName: z.string().trim().min(2, 'Имя аккаунта должно содержать минимум 2 символа'),
      confirmPassword: z.string().min(1, 'Повторите пароль'),
      email: z.string().trim().min(1, 'Введите email').email('Введите корректный email'),
      firstName: z.string().trim().min(2, 'Имя должно содержать минимум 2 символа'),
      lastName: z.string().trim().min(2, 'Фамилия должна содержать минимум 2 символа'),
      password: z.string().min(6, 'Пароль должен содержать минимум 6 символов'),
   })
   .refine((data) => data.password === data.confirmPassword, {
      message: 'Пароли не совпадают',
      path: ['confirmPassword'],
   })

export type LoginFormValues = z.infer<typeof loginSchema>
export type RegisterFormValues = z.infer<typeof registerSchema>

export const passwordRecoverySchema = z.object({
   email: z.string().trim().min(1, 'Введите email').email('Введите корректный email'),
})

export const emailConfirmationSchema = z.object({
   confirmationLink: z.string().trim().min(1, 'Введите ссылку подтверждения'),
})

export type PasswordRecoveryFormValues = z.infer<typeof passwordRecoverySchema>
export type EmailConfirmationFormValues = z.infer<typeof emailConfirmationSchema>