import { useEffect, type ReactNode } from 'react'
import { createPortal } from 'react-dom'

import styles from './Modal.module.css'

type ModalProps = {
   children: ReactNode
   onClose: () => void
   panelClassName?: string
}

export function Modal({ children, onClose, panelClassName }: ModalProps) {
   useEffect(() => {
      const handleKeyDown = (e: KeyboardEvent) => {
         if (e.key === 'Escape') onClose()
      }
      document.addEventListener('keydown', handleKeyDown)
      document.body.style.overflow = 'hidden'
      return () => {
         document.removeEventListener('keydown', handleKeyDown)
         document.body.style.overflow = ''
      }
   }, [onClose])

   return createPortal(
      <div
         aria-modal="true"
         className={styles.backdrop}
         role="dialog"
         aria-labelledby="modal-title"
         onClick={onClose}
      >
         <div className={`${styles.panel}${panelClassName ? ` ${panelClassName}` : ''}`} onClick={(e) => e.stopPropagation()}>
            {children}
         </div>
      </div>,
      document.body,
   )
}
