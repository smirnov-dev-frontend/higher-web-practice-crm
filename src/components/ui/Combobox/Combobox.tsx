import { useEffect, useRef, useState } from 'react'

import styles from './Combobox.module.css'

export type ComboboxOption = { value: string; label: string }

type ComboboxProps = {
   disabled?: boolean
   hasError?: boolean
   id?: string
   inputClassName?: string
   onBlur?: () => void
   onChange: (value: string) => void
   options: ComboboxOption[]
   placeholder?: string
   value: string
}

export function Combobox({ disabled, hasError, id, inputClassName, onBlur, onChange, options, placeholder, value }: ComboboxProps) {
   const selectedLabel = options.find((o) => o.value === value)?.label ?? ''
   const [inputValue, setInputValue] = useState(selectedLabel)
   const [isOpen, setIsOpen] = useState(false)
   const [activeIndex, setActiveIndex] = useState(-1)
   const containerRef = useRef<HTMLDivElement>(null)

   useEffect(() => {
      setInputValue(selectedLabel)
   }, [selectedLabel])

   const filtered = options.filter((o) =>
      o.label.toLowerCase().includes(inputValue.toLowerCase()),
   )

   const handleSelect = (option: ComboboxOption) => {
      onChange(option.value)
      setInputValue(option.label)
      setIsOpen(false)
      setActiveIndex(-1)
   }

   const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setInputValue(e.target.value)
      setIsOpen(true)
      setActiveIndex(-1)
      onChange('')
   }

   const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (!isOpen && (e.key === 'ArrowDown' || e.key === 'ArrowUp')) {
         setIsOpen(true)
         return
      }
      if (e.key === 'ArrowDown') {
         e.preventDefault()
         setActiveIndex((i) => Math.min(i + 1, filtered.length - 1))
      } else if (e.key === 'ArrowUp') {
         e.preventDefault()
         setActiveIndex((i) => Math.max(i - 1, 0))
      } else if (e.key === 'Enter') {
         e.preventDefault()
         if (activeIndex >= 0 && filtered[activeIndex]) {
            handleSelect(filtered[activeIndex])
         }
      } else if (e.key === 'Escape') {
         setIsOpen(false)
         setInputValue(selectedLabel)
         setActiveIndex(-1)
      }
   }

   useEffect(() => {
      const handleMouseDown = (e: MouseEvent) => {
         if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
            setIsOpen(false)
            setInputValue(selectedLabel)
            onBlur?.()
         }
      }
      document.addEventListener('mousedown', handleMouseDown)
      return () => document.removeEventListener('mousedown', handleMouseDown)
   }, [selectedLabel, onBlur])

   return (
      <div ref={containerRef} className={styles.container}>
         <input
            autoComplete="off"
            className={[styles.input, hasError ? styles.error : '', disabled ? styles.inputDisabled : '', inputClassName ?? ''].filter(Boolean).join(' ')}
            disabled={disabled}
            id={id}
            placeholder={placeholder}
            type="text"
            value={inputValue}
            onChange={handleInputChange}
            onFocus={() => setIsOpen(true)}
            onKeyDown={handleKeyDown}
         />
         {isOpen && (
            <ul className={styles.dropdown} role="listbox">
               {filtered.length > 0 ? (
                  filtered.map((option, i) => (
                     <li
                        key={option.value}
                        aria-selected={option.value === value}
                        className={[
                           styles.option,
                           i === activeIndex ? styles.optionActive : '',
                           option.value === value ? styles.optionSelected : '',
                        ]
                           .filter(Boolean)
                           .join(' ')}
                        role="option"
                        onMouseDown={(e) => {
                           e.preventDefault()
                           handleSelect(option)
                        }}
                        onMouseEnter={() => setActiveIndex(i)}
                     >
                        {option.label}
                     </li>
                  ))
               ) : (
                  <li className={styles.optionEmpty}>Ничего не найдено</li>
               )}
            </ul>
         )}
      </div>
   )
}