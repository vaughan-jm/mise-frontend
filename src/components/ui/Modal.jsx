import React, { useEffect, useCallback } from 'react';
import styles from './styles.module.css';

/**
 * Modal component
 *
 * A generic, accessible modal wrapper with backdrop and keyboard support
 *
 * @param {boolean} isOpen - Whether the modal is open
 * @param {function} onClose - Callback function to close the modal
 * @param {React.ReactNode} children - The content to render inside the modal
 * @param {string} title - Optional title for the modal
 * @param {boolean} showCloseButton - Whether to show the close button (default: true)
 * @param {boolean} closeOnBackdrop - Whether clicking the backdrop closes the modal (default: true)
 * @param {boolean} closeOnEscape - Whether pressing Escape closes the modal (default: true)
 * @param {string} size - Size variant: 'small', 'medium', 'large' (default: 'medium')
 * @param {string} className - Additional CSS classes for the modal content
 */
const Modal = ({
  isOpen,
  onClose,
  children,
  title,
  showCloseButton = true,
  closeOnBackdrop = true,
  closeOnEscape = true,
  size = 'medium',
  className = ''
}) => {
  // Handle escape key press
  const handleEscape = useCallback((event) => {
    if (closeOnEscape && event.key === 'Escape') {
      onClose();
    }
  }, [closeOnEscape, onClose]);

  // Add/remove escape key listener
  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, handleEscape]);

  // Handle backdrop click
  const handleBackdropClick = (event) => {
    if (closeOnBackdrop && event.target === event.currentTarget) {
      onClose();
    }
  };

  // Don't render if not open
  if (!isOpen) return null;

  // Size variants
  const maxWidthMap = {
    small: '340px',
    medium: '500px',
    large: '700px'
  };

  const modalStyle = {
    ...{},
    maxWidth: maxWidthMap[size] || maxWidthMap.medium
  };

  return (
    <div
      className={styles.modalOverlay}
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? 'modal-title' : undefined}
    >
      <div
        className={`${styles.modal} ${className}`}
        style={modalStyle}
        onClick={(e) => e.stopPropagation()}
      >
        {(title || showCloseButton) && (
          <div className={styles.modalHeader}>
            {title && (
              <h2
                id="modal-title"
                className={styles.modalTitle}
              >
                {title}
              </h2>
            )}
            {showCloseButton && (
              <button
                className={styles.modalClose}
                onClick={onClose}
                aria-label="Close modal"
                type="button"
              >
                ×
              </button>
            )}
          </div>
        )}
        <div className={styles.modalBody}>
          {children}
        </div>
      </div>
    </div>
  );
};

/**
 * ModalFooter component
 *
 * A footer section for modal buttons and actions
 */
export const ModalFooter = ({ children, className = '' }) => {
  return (
    <div className={`${styles.modalFooter} ${className}`}>
      {children}
    </div>
  );
};

export default Modal;
