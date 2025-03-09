// components/ui/Modal.jsx
import React, { useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';

/**
 * Componente Modal reutilizable
 *
 * @param {Object} props
 * @param {boolean} props.isOpen - Controla si el modal está abierto o cerrado
 * @param {Function} props.onClose - Función a ejecutar cuando se cierra el modal
 * @param {string} props.title - Título del modal
 * @param {React.ReactNode} props.children - Contenido del modal
 * @param {React.ReactNode} props.footer - Contenido del pie del modal (opcional)
 * @param {string} props.size - Tamaño del modal ('sm', 'md', 'lg', 'xl', 'full')
 * @param {boolean} props.closeOnOutsideClick - Si el modal se cierra al hacer clic fuera (por defecto true)
 * @param {boolean} props.showCloseButton - Si se muestra el botón de cerrar (por defecto true)
 */
const Modal = ({
  isOpen,
  onClose,
  title,
  children,
  footer,
  size = 'md',
  closeOnOutsideClick = true,
  showCloseButton = true
}) => {
  const modalRef = useRef(null);

  // Prevenir scroll del body cuando el modal está abierto
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Manejar cierre con tecla Escape
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  // Manejar cierre al hacer clic fuera del modal
  const handleOutsideClick = (e) => {
    if (closeOnOutsideClick && modalRef.current && !modalRef.current.contains(e.target)) {
      onClose();
    }
  };

  // Determinar la clase CSS según el tamaño
  const getSizeClass = () => {
    switch (size) {
      case 'sm': return 'modal-sm';
      case 'lg': return 'modal-lg';
      case 'xl': return 'modal-xl';
      case 'full': return 'modal-full';
      default: return 'modal-md';
    }
  };

  if (!isOpen) return null;

  return ReactDOM.createPortal(
    <div className="modal-overlay" onClick={handleOutsideClick}>
      <div
        className={`modal-container ${getSizeClass()}`}
        ref={modalRef}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <h3 className="modal-title">{title}</h3>
          {showCloseButton && (
            <button
              className="btn btn-icon"
              onClick={onClose}
              aria-label="Cerrar"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          )}
        </div>

        <div className="modal-body">
          {children}
        </div>

        {footer && (
          <div className="modal-footer">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body
  );
};

export default Modal;