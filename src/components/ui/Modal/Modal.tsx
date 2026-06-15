import { useEffect, type CSSProperties, type ReactNode } from 'react'
import { createPortal } from 'react-dom'

import styles from './Modal.module.css'

type ModalProps = {
   children: ReactNode
   onClose: () => void
   panelStyle?: CSSProperties
}

export function Modal({ children, onClose, panelStyle }: ModalProps) {
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
         <div className={styles.panel} style={panelStyle} onClick={(e) => e.stopPropagation()}>
            {children}
         </div>
      </div>,
      document.body,
   )
}
