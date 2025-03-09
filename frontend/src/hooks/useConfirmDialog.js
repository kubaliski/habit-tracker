// hooks/useConfirmDialog.js
import { useState, useCallback } from 'react';

/**
 * Hook personalizado para manejar diálogos de confirmación
 *
 * @param {Object} options - Opciones iniciales del diálogo
 * @param {string} options.title - Título del diálogo
 * @param {string} options.message - Mensaje del diálogo
 * @param {string} options.confirmText - Texto del botón de confirmación
 * @param {string} options.cancelText - Texto del botón de cancelación
 * @param {string} options.confirmButtonClass - Clase CSS adicional para el botón de confirmación
 * @returns {Array} - [dialogProps, confirm, setOptions]
 */
function useConfirmDialog(options = {}) {
  // Estado para controlar la visibilidad del diálogo
  const [isOpen, setIsOpen] = useState(false);

  // Estado para almacenar la promesa de confirmación
  const [promiseCallbacks, setPromiseCallbacks] = useState(null);

  // Estado para manejar las opciones del diálogo
  const [dialogOptions, setDialogOptions] = useState({
    title: "Confirmar acción",
    message: "¿Estás seguro de que quieres realizar esta acción?",
    confirmText: "Confirmar",
    cancelText: "Cancelar",
    confirmButtonClass: "btn-danger",
    ...options
  });

  // Estado para indicar si hay una operación en curso
  const [isLoading, setIsLoading] = useState(false);

  // Función para abrir el diálogo de confirmación
  const confirm = useCallback((customOptions = {}) => {
    // Actualizar opciones si se proporcionan
    if (Object.keys(customOptions).length > 0) {
      setDialogOptions(prevOptions => ({
        ...prevOptions,
        ...customOptions
      }));
    }

    // Abrir el diálogo
    setIsOpen(true);

    // Crear y devolver una promesa que se resolverá cuando el usuario responda
    return new Promise((resolve, reject) => {
      setPromiseCallbacks({ resolve, reject });
    });
  }, []);

  // Manejador para la confirmación
  const handleConfirm = useCallback(async () => {
    if (!promiseCallbacks) return;

    try {
      setIsLoading(true);
      promiseCallbacks.resolve(true);
    } catch (error) {
      promiseCallbacks.reject(error);
    } finally {
      setIsLoading(false);
      setIsOpen(false);
    }
  }, [promiseCallbacks]);

  // Manejador para la cancelación
  const handleCancel = useCallback(() => {
    if (promiseCallbacks) {
      promiseCallbacks.resolve(false);
    }
    setIsOpen(false);
  }, [promiseCallbacks]);

  // Props para pasar al componente ConfirmDialog
  const dialogProps = {
    isOpen,
    onClose: handleCancel,
    onConfirm: handleConfirm,
    title: dialogOptions.title,
    children: dialogOptions.message,
    confirmText: dialogOptions.confirmText,
    cancelText: dialogOptions.cancelText,
    confirmButtonClass: dialogOptions.confirmButtonClass,
    isLoading
  };

  // Función para actualizar las opciones del diálogo
  const setOptions = useCallback((newOptions) => {
    setDialogOptions(prevOptions => ({
      ...prevOptions,
      ...newOptions
    }));
  }, []);

  return [dialogProps, confirm, setOptions];
}

export default useConfirmDialog;