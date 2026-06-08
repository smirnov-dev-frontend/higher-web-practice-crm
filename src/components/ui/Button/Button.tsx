import type { ButtonHTMLAttributes, ReactNode } from 'react'

import styles from './Button.module.css'

type ButtonVariant = 'primary' | 'secondary' | 'danger'

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
   children: ReactNode
   fullWidth?: boolean
   variant?: ButtonVariant
}

export function Button({
   children,
   className = '',
   fullWidth = false,
   type = 'button',
   variant = 'primary',
   ...props
}: ButtonProps) {
   const buttonClassName = [
      styles.button,
      styles[variant],
      fullWidth ? styles.fullWidth : '',
      className,
   ]
      .filter(Boolean)
      .join(' ')

   return (
      <button className={buttonClassName} type={type} {...props}>
         {children}
      </button>
   )
}