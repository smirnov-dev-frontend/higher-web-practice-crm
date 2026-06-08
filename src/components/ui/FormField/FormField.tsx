import type { ReactNode } from 'react'

import styles from './FormField.module.css'

type FormFieldProps = {
   children: ReactNode
   error?: string
   htmlFor: string
   label: string
   required?: boolean
}

export function FormField({ children, error, htmlFor, label }: FormFieldProps) {
   return (
      <div className={styles.field}>
         <label className={styles.label} htmlFor={htmlFor}>
            {label}
         </label>

         {children}

         {error && <p className={styles.error}>{error}</p>}
      </div>
   )
}