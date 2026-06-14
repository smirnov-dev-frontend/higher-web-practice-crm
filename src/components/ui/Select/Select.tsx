import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

import SelectRowIcon from '../../../icons/select-row.svg?react'

import styles from './Select.module.css'

export type SelectOption = { label: string; value: string }

type SelectProps = {
   disabled?: boolean
   onChange: (value: string) => void
   options: SelectOption[]
   value: string
}

export function Select({ disabled, onChange, options, value }: SelectProps) {
   const [isOpen, setIsOpen] = useState(false)
   const [pos, setPos] = useState({ left: 0, top: 0, width: 0 })
   const triggerRef = useRef<HTMLButtonElement>(null)
   const listRef = useRef<HTMLDivElement>(null)

   useEffect(() => {
      if (!isOpen) return
      const handleMouseDown = (e: MouseEvent) => {
         const t = e.target as Node
         if (
            triggerRef.current && !triggerRef.current.contains(t) &&
            listRef.current && !listRef.current.contains(t)
         ) {
            setIsOpen(false)
         }
      }
      document.addEventListener('mousedown', handleMouseDown)
      return () => document.removeEventListener('mousedown', handleMouseDown)
   }, [isOpen])

   const toggle = () => {
      if (disabled) return
      if (isOpen) {
         setIsOpen(false)
         return
      }
      if (!triggerRef.current) return
      const rect = triggerRef.current.getBoundingClientRect()
      setPos({ top: rect.bottom + 2, left: rect.left, width: rect.width })
      setIsOpen(true)
   }

   const selectedLabel = options.find((o) => o.value === value)?.label ?? ''

   return (
      <div className={styles.container}>
         <button
            ref={triggerRef}
            className={[styles.trigger, isOpen ? styles.triggerOpen : ''].filter(Boolean).join(' ')}
            disabled={disabled}
            type="button"
            onClick={toggle}
         >
            <span className={styles.triggerText}>{selectedLabel}</span>
            <SelectRowIcon
               aria-hidden="true"
               className={[styles.chevron, isOpen ? styles.chevronOpen : ''].filter(Boolean).join(' ')}
            />
         </button>

         {isOpen && createPortal(
            <div
               ref={listRef}
               className={styles.list}
               style={{ left: pos.left, top: pos.top, width: pos.width }}
            >
               {options.map((option) => (
                  <button
                     key={option.value}
                     className={[
                        styles.option,
                        option.value === value ? styles.optionSelected : '',
                     ].filter(Boolean).join(' ')}
                     type="button"
                     onClick={() => { onChange(option.value); setIsOpen(false) }}
                  >
                     {option.label}
                  </button>
               ))}
            </div>,
            document.body,
         )}
      </div>
   )
}