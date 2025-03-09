import React, { useState } from 'react';
import Modal from '../ui/Modal';
import ConfirmDialog from '../ui/ConfirmDialog';
import { ClearAllData } from '@api/DatabaseController';


const SettingsModal = ({ isOpen, onClose, onDataCleared }) => {
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [reinitializeDefaults, setReinitializeDefaults] = useState(true);
  const [result, setResult] = useState({ success: false, error: null });

  const handleClearDataClick = () => {
    setShowConfirmDialog(true);
    // Reiniciar el estado del resultado al abrir el diálogo
    setResult({ success: false, error: null });
  };

  const handleConfirmClearData = async () => {
    setIsLoading(true);
    setResult({ success: false, error: null });

    try {
      await ClearAllData(reinitializeDefaults);
      setResult({ success: true, error: null });

      // Cerrar el diálogo de confirmación después de 2 segundos
      setTimeout(() => {
        setShowConfirmDialog(false);
        // Recargar datos en la aplicación
        if (typeof onDataCleared === 'function') {
          onDataCleared();
        }
      }, 2000);
    } catch (error) {
      console.error("Error al borrar datos:", error);
      setResult({ success: false, error: error.toString() });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelClearData = () => {
    setShowConfirmDialog(false);
    setResult({ success: false, error: null });
  };

  // Renderizar el contenido del diálogo de confirmación
  const renderConfirmDialogContent = () => (
    <div className="confirm-dialog-content">
      <p className="warning-text">¡ADVERTENCIA! Esta acción eliminará permanentemente todos tus datos y no se puede deshacer.</p>

      <p>Se borrarán:</p>
      <ul>
        <li>Todos los hábitos y sus registros</li>
        <li>Todos los registros de estado de ánimo</li>
        <li>Todos los registros de consumo de cafeína</li>
        <li>Todas las bebidas con cafeína personalizadas</li>
      </ul>

      <div className="form-group">
        <label className="checkbox-container">
          <input
            type="checkbox"
            checked={reinitializeDefaults}
            onChange={(e) => setReinitializeDefaults(e.target.checked)}
          />
          <span className="checkbox-label">Reinicializar bebidas con cafeína predeterminadas</span>
        </label>
      </div>

      {result.success && (
        <div className="alert alert-success">
          ¡Los datos se han borrado correctamente!
        </div>
      )}

      {result.error && (
        <div className="alert alert-error">
          Error al borrar datos: {result.error}
        </div>
      )}
    </div>
  );

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title="Ajustes"
        size="lg"
      >
        <div className="settings-container">
          <h3 className="settings-section-title">Gestión de datos</h3>

          <div className="settings-section">
            <div className="settings-item">
              <div className="settings-item-content">
                <h4>Borrar datos</h4>
                <p>Elimina permanentemente todos los datos de la aplicación. Esta acción no se puede deshacer.</p>
              </div>
              <div className="settings-item-action">
                <button
                  className="btn-danger"
                  onClick={handleClearDataClick}
                >
                  Borrar todos los datos
                </button>
              </div>
            </div>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={showConfirmDialog}
        onClose={handleCancelClearData}
        onConfirm={handleConfirmClearData}
        title="Borrar todos los datos"
        confirmText="Borrar datos"
        cancelText="Cancelar"
        confirmButtonClass="btn-danger"
        isLoading={isLoading}
      >
        {renderConfirmDialogContent()}
      </ConfirmDialog>
    </>
  );
};

export default SettingsModal;