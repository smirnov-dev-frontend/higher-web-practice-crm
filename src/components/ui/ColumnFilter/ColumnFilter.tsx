import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

import SelectDownIcon from '../../../icons/select-down.svg?react'
import SelectIcon from '../../../icons/select.svg?react'
import SelectUpIcon from '../../../icons/select-up.svg?react'

import styles from './ColumnFilter.module.css'

type ColumnFilterProps = {
   className?: string
   filterType?: 'checkbox' | 'radio'
   iconVariant?: 'chevron' | 'select'
   isActive: boolean
   label: string
   onFilterChange: (values: string[]) => void
   onSortAsc: () => void
   onSortDesc: () => void
   options: string[]
   rightAlign?: boolean
   selectedValues: string[]
   sortDirection: 'asc' | 'desc'
}

export function ColumnFilter({
   className,
   filterType = 'checkbox',
   iconVariant = 'chevron',
   isActive,
   label,
   onFilterChange,
   onSortAsc,
   onSortDesc,
   options,
   rightAlign,
   selectedValues,
   sortDirection,
}: ColumnFilterProps) {
   const [isOpen, setIsOpen] = useState(false)
   const [search, setSearch] = useState('')
   const [popoverPos, setPopoverPos] = useState({ top: 0, left: 0 })
   const btnRef = useRef<HTMLButtonElement>(null)
   const popoverRef = useRef<HTMLDivElement>(null)

   useEffect(() => {
      if (!isOpen) return
      const handleMouseDown = (e: MouseEvent) => {
         const target = e.target as Node
         if (
            btnRef.current && !btnRef.current.contains(target) &&
            popoverRef.current && !popoverRef.current.contains(target)
         ) {
            setIsOpen(false)
            setSearch('')
         }
      }
      document.addEventListener('mousedown', handleMouseDown)
      return () => document.removeEventListener('mousedown', handleMouseDown)
   }, [isOpen])

   const open = () => {
      if (!btnRef.current) return
      const rect = btnRef.current.getBoundingClientRect()
      const POPOVER_WIDTH = 194
      const left = rightAlign ? rect.right - POPOVER_WIDTH : rect.left
      setPopoverPos({ top: rect.bottom + 4, left })
      setIsOpen(true)
   }

   const close = () => {
      setIsOpen(false)
      setSearch('')
   }

   const toggle = () => {
      if (isOpen) close()
      else open()
   }

   const filteredOptions = options.filter((o) =>
      o.toLowerCase().includes(search.toLowerCase()),
   )

   const hasFilter = selectedValues.length > 0
   const isHighlighted = isActive || hasFilter

   const toggleValue = (value: string) => {
      if (filterType === 'radio') {
         onFilterChange(selectedValues.includes(value) ? [] : [value])
      } else {
         if (selectedValues.includes(value)) {
            onFilterChange(selectedValues.filter((v) => v !== value))
         } else {
            onFilterChange([...selectedValues, value])
         }
      }
   }

   const renderIcon = () => {
      if (iconVariant === 'select') {
         if (isActive && sortDirection === 'asc') {
            return <SelectUpIcon aria-hidden="true" className={styles.selectIcon} />
         }
         if (isActive && sortDirection === 'desc') {
            return <SelectDownIcon aria-hidden="true" className={styles.selectIcon} />
         }
         return <SelectIcon aria-hidden="true" className={styles.selectIcon} />
      }
      return (
         <svg
            aria-hidden="true"
            className={[
               styles.chevron,
               isActive && sortDirection === 'asc' ? styles.chevronAsc : '',
            ].filter(Boolean).join(' ')}
            fill="none"
            height="16"
            viewBox="0 0 16 16"
            width="16"
         >
            <path
               d="M4 6L8 10L12 6"
               stroke="currentColor"
               strokeLinecap="round"
               strokeLinejoin="round"
               strokeWidth="1.5"
            />
         </svg>
      )
   }

   return (
      <div
         className={[
            styles.container,
            rightAlign ? styles.containerRight : '',
            className,
         ].filter(Boolean).join(' ')}
      >
         <button
            ref={btnRef}
            className={styles.btn}
            type="button"
            onClick={toggle}
         >
            <span
               className={[
                  styles.content,
                  isHighlighted ? styles.contentActive : '',
               ].filter(Boolean).join(' ')}
            >
               {label}
               {renderIcon()}
            </span>
         </button>

         {isOpen && createPortal(
            <div
               ref={popoverRef}
               className={styles.popover}
               style={{ top: popoverPos.top, left: popoverPos.left }}
            >
               <div className={styles.sortSection}>
                  <p className={styles.sortTitle}>Сортировка</p>
                  <button
                     className={[
                        styles.sortOption,
                        isActive && sortDirection === 'asc' ? styles.sortOptionActive : '',
                     ].filter(Boolean).join(' ')}
                     type="button"
                     onClick={() => { onSortAsc(); close() }}
                  >
                     По возрастанию
                  </button>
                  <button
                     className={[
                        styles.sortOption,
                        isActive && sortDirection === 'desc' ? styles.sortOptionActive : '',
                     ].filter(Boolean).join(' ')}
                     type="button"
                     onClick={() => { onSortDesc(); close() }}
                  >
                     По убыванию
                  </button>
               </div>

               <div className={styles.divider} />

               <div className={styles.filterSection}>
                  <div className={styles.searchWrapper}>
                     <svg aria-hidden="true" className={styles.searchIcon} fill="none" height="16" viewBox="0 0 16 16" width="16">
                        <circle cx="7" cy="7" r="4.5" stroke="#9CA3AF" strokeWidth="1.5" />
                        <path d="M11 11L14 14" stroke="#9CA3AF" strokeLinecap="round" strokeWidth="1.5" />
                     </svg>
                     <input
                        className={styles.searchInput}
                        placeholder="Искать"
                        type="search"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                     />
                  </div>

                  <div className={styles.checkboxList}>
                     {filteredOptions.length === 0 ? (
                        <span className={styles.noOptions}>Ничего не найдено</span>
                     ) : (
                        filteredOptions.map((option) => (
                           <label key={option} className={styles.checkboxItem}>
                              <input
                                 checked={selectedValues.includes(option)}
                                 className={filterType === 'radio' ? styles.radio : styles.checkbox}
                                 type={filterType === 'radio' ? 'radio' : 'checkbox'}
                                 onChange={() => toggleValue(option)}
                              />
                              <span className={styles.checkboxLabel}>{option}</span>
                           </label>
                        ))
                     )}
                  </div>
               </div>
            </div>,
            document.body,
         )}
      </div>
   )
}