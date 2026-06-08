import type { InputHTMLAttributes } from 'react'

import styles from './Input.module.css'

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
   hasError?: boolean
}

export function Input({ className = '', hasError = false, ...props }: InputProps) {
   const inputClassName = [styles.input, hasError ? styles.error : '', className]
      .filter(Boolean)
      .join(' ')

   return <input className={inputClassName} {...props} />
}