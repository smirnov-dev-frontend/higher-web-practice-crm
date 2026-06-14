import { forwardRef } from 'react'
import type { InputHTMLAttributes } from 'react'

import styles from './Input.module.css'

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
   hasError?: boolean
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
   ({ className = '', hasError = false, ...props }, ref) => {
      const inputClassName = [styles.input, hasError ? styles.error : '', className]
         .filter(Boolean)
         .join(' ')

      return <input ref={ref} className={inputClassName} {...props} />
   },
)

Input.displayName = 'Input'