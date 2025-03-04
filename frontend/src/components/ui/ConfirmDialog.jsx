// components/ui/ConfirmDialog.jsx
import React from 'react';
import Modal from './Modal';

/**
 * Componente de diálogo de confirmación
 *
 * @param {Object} props
 * @param {boolean} props.isOpen - Controla si el diálogo está abierto
 * @param {Function} props.onClose - Función a ejecutar cuando se cierra sin confirmar
 * @param {Function} props.onConfirm - Función a ejecutar cuando se confirma la acción
 * @param {string} props.title - Título del diálogo
 * @param {React.ReactNode} props.children - Contenido/mensaje del diálogo
 * @param {string} props.confirmText - Texto del botón de confirmación
 * @param {string} props.cancelText - Texto del botón de cancelación
 * @param {string} props.confirmButtonClass - Clase CSS adicional para el botón de confirmación
 * @param {boolean} props.isLoading - Indica si hay una acción en proceso
 */
const ConfirmDialog = ({
  isOpen,
  onClose,
  onConfirm,
  title = "Confirmar acción",
  children = "¿Estás seguro de que quieres realizar esta acción?",
  confirmText = "Confirmar",
  cancelText = "Cancelar",
  confirmButtonClass = "btn-danger",
  isLoading = false
}) => {
  // Renderizar los botones de acción en el footer
  const renderFooter = () => (
    <>
      <button
        type="button"
        className="btn btn-secondary"
        onClick={onClose}
        disabled={isLoading}
      >
        {cancelText}
      </button>
      <button
        type="button"
        className={`btn ${confirmButtonClass}`}
        onClick={onConfirm}
        disabled={isLoading}
      >
        {isLoading ? 'Procesando...' : confirmText}
      </button>
    </>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      footer={renderFooter()}
      size="sm"
    >
      <div className="confirm-dialog-content">
        {typeof children === 'string' ? (
          <p>{children}</p>
        ) : (
          children
        )}
      </div>
    </Modal>
  );
};

export default ConfirmDialog;