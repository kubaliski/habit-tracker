// components/dashboard/CaffeinePanel.jsx
import { useState, useMemo, useEffect, useRef } from 'react';
import { GetAllCaffeineBeverages, CreateCaffeineIntake, DeleteCaffeineIntake, UpdateCaffeineIntake } from "@api/CaffeineController";
import {Modal , ConfirmDialog} from '../ui'
import CaffeineIntakeForm from '../forms/CaffeineIntakeForm';
import useConfirmDialog from '@hooks/useConfirmDialog';

function CaffeinePanel({ intakes, todayTotal, date, onIntakeCreated, onIntakeDeleted, onIntakeUpdated }) {
  const [beverages, setBeverages] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingIntakeId, setEditingIntakeId] = useState(null);
  const [currentIntake, setCurrentIntake] = useState(null);
  const [loading, setLoading] = useState(false);

  // Hook personalizado para el diálogo de confirmación
  const [confirmDialogProps, confirm] = useConfirmDialog({
    title: 'Eliminar registro',
    message: '¿Estás seguro de que quieres eliminar este registro de consumo de cafeína? Esta acción no se puede deshacer.',
    confirmText: 'Eliminar',
    confirmButtonClass: 'btn-danger'
  });

  // Referencia al formulario
  const formRef = useRef(null);

  useEffect(() => {
    console.log("[CaffeinePanel] Props recibidas - todayTotal:", todayTotal);
  }, [todayTotal]);

  // Convertir fecha a formato string YYYY-MM-DD para comparaciones
  const dateString = useMemo(() => {
    return date.toISOString().split('T')[0];
  }, [date]);

  // Cargar las bebidas disponibles
  useEffect(() => {
    const loadBeverages = async () => {
      try {
        const result = await GetAllCaffeineBeverages(false);
        setBeverages(result || []);
      } catch (error) {
        console.error("Error al cargar bebidas:", error);
      }
    };

    loadBeverages();
  }, []);

  // Filtrar intakes para el día actual
  const todayIntakes = useMemo(() => {
    if (!intakes || intakes.length === 0) return [];

    return intakes.filter(intake => {
      if (!intake.timestamp) return false;
      const intakeDate = new Date(intake.timestamp);
      return intakeDate.toISOString().split('T')[0] === dateString;
    }).sort((a, b) => {
      return new Date(b.timestamp) - new Date(a.timestamp);
    });
  }, [intakes, dateString]);

  // Calcular el porcentaje de cafeína consumido (límite recomendado: 400mg)
  const caffeinePercentage = useMemo(() => {
    const limit = 400; // 400mg es el límite diario recomendado
    const percentage = Math.min(Math.round((todayTotal / limit) * 100), 100);
    console.log("[CaffeinePanel] Calculando porcentaje:", percentage, "de todayTotal:", todayTotal);
    return percentage;
  }, [todayTotal]);

  // Determinar el color de la barra de progreso según el porcentaje
  const caffeineBarClass = useMemo(() => {
    let barClass = 'caffeine-limit-bar';
    if (caffeinePercentage >= 90) barClass = 'caffeine-limit-bar danger';
    else if (caffeinePercentage >= 75) barClass = 'caffeine-limit-bar warning';
    console.log("[CaffeinePanel] Clase de barra de cafeína:", barClass, "para porcentaje:", caffeinePercentage);
    return barClass;
  }, [caffeinePercentage]);

  // Abrir el modal para añadir una nueva ingesta
  const openAddModal = () => {
    setIsEditing(false);
    setEditingIntakeId(null);
    setCurrentIntake(null);
    setIsModalOpen(true);
  };

  // Abrir el modal para editar una ingesta existente
  const openEditModal = (intake) => {
    // Formatear fecha y hora para el input datetime-local
    let formattedTimestamp = '';
    if (intake.timestamp) {
      const intakeDate = new Date(intake.timestamp);
      const year = intakeDate.getFullYear();
      const month = String(intakeDate.getMonth() + 1).padStart(2, '0');
      const day = String(intakeDate.getDate()).padStart(2, '0');
      const hours = String(intakeDate.getHours()).padStart(2, '0');
      const minutes = String(intakeDate.getMinutes()).padStart(2, '0');

      formattedTimestamp = `${year}-${month}-${day}T${hours}:${minutes}`;
    }

    // Crear objeto con los datos formateados para pasar al formulario
    const formattedIntake = {
      ...intake,
      timestamp: formattedTimestamp
    };

    setIsEditing(true);
    setEditingIntakeId(intake.id);
    setCurrentIntake(formattedIntake);
    setIsModalOpen(true);
  };

  // Manejar envío del formulario
  const handleFormSubmit = async (formData) => {
    setLoading(true);

    try {
      if (isEditing) {
        // Actualizar una ingesta existente
        await UpdateCaffeineIntake(editingIntakeId, formData);

        console.log("[CaffeinePanel] Ingesta actualizada con éxito, ID:", editingIntakeId);
        // Notificar al componente padre
        if (onIntakeUpdated && typeof onIntakeUpdated === 'function') {
          onIntakeUpdated(editingIntakeId);
        }
      } else {
        // Crear una nueva ingesta
        const newIntake = await CreateCaffeineIntake(formData);

        console.log("[CaffeinePanel] Nueva ingesta creada con éxito:", newIntake);
        // Notificar al componente padre
        if (onIntakeCreated && typeof onIntakeCreated === 'function') {
          onIntakeCreated(newIntake);
        }
      }

      // Cerrar el modal
      setIsModalOpen(false);
    } catch (error) {
      console.error("Error al guardar consumo:", error);
      // El manejo de errores específicos del formulario ahora está dentro del componente del formulario
    } finally {
      setLoading(false);
    }
  };

  // Función para manejar solicitud de eliminación
  const handleDeleteRequest = async (intakeId) => {
    // Usar el hook de confirmación
    const confirmed = await confirm();

    if (confirmed) {
      setLoading(true);
      try {
        await DeleteCaffeineIntake(intakeId);
        console.log("[CaffeinePanel] Ingesta eliminada con éxito, ID:", intakeId);

        // Notificar al componente padre
        if (onIntakeDeleted && typeof onIntakeDeleted === 'function') {
          onIntakeDeleted(intakeId);
        }
      } catch (error) {
        console.error("Error al eliminar el registro:", error);
      } finally {
        setLoading(false);
      }
    }
  };

  // Formatear la hora de un timestamp
  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
  };

  // Renderizar el footer del modal
  const renderModalFooter = () => (
    <>
      <button
        type="button"
        className="btn btn-secondary"
        onClick={() => setIsModalOpen(false)}
        disabled={loading}
      >
        Cancelar
      </button>
      <button
        type="button"
        className="btn btn-primary"
        onClick={() => {
          // Usar la referencia para llamar al método submitForm
          if (formRef.current) {
            formRef.current.submitForm();
          }
        }}
        disabled={loading}
      >
        {loading ? 'Guardando...' : isEditing ? 'Actualizar' : 'Guardar'}
      </button>
    </>
  );

  return (
    <div className="caffeine-panel">
      <div className="bento-card-header">
        <h2 className="bento-card-title">Consumo de Cafeína</h2>
        <div className="bento-card-actions">
          <button
            className="btn btn-icon"
            onClick={openAddModal}
            title="Registrar consumo"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
          </button>
        </div>
      </div>

      <div className="caffeine-today">
        <div className="caffeine-icon">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 8h1a4 4 0 0 1 0 8h-1"></path>
            <path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"></path>
            <line x1="6" y1="1" x2="6" y2="4"></line>
            <line x1="10" y1="1" x2="10" y2="4"></line>
            <line x1="14" y1="1" x2="14" y2="4"></line>
          </svg>
        </div>

        <div className="caffeine-info">
          <div className="caffeine-total">{Math.round(todayTotal)} mg</div>
          <div className="caffeine-label">de cafeína hoy</div>

          <div className="caffeine-limit">
            <div
              className={caffeineBarClass}
              style={{ width: `${caffeinePercentage}%` }}
            ></div>
          </div>
        </div>
      </div>

      {todayIntakes.length > 0 && (
        <div className="caffeine-log">
          <div className="caffeine-log-title">Registros de hoy</div>
          {todayIntakes.slice(0, 3).map(intake => (
            <div key={intake.id} className="caffeine-log-item">
              <div className="caffeine-log-time">{formatTime(intake.timestamp)}</div>
              <div className="caffeine-log-beverage">{intake.beverage_name}</div>
              <div className="caffeine-log-amount">{intake.total_caffeine} mg</div>
              <div className="caffeine-log-actions">
                <button
                  className="btn btn-icon btn-sm"
                  onClick={() => openEditModal(intake)}
                  disabled={loading}
                  title="Editar registro"
                  style={{ color: 'var(--color-primary)' }}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path>
                  </svg>
                </button>
                <button
                  className="btn btn-icon btn-sm"
                  onClick={() => handleDeleteRequest(intake.id)}
                  disabled={loading}
                  title="Eliminar registro"
                  style={{ color: 'var(--color-error)' }}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 6h18"></path>
                    <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"></path>
                    <line x1="10" y1="11" x2="10" y2="17"></line>
                    <line x1="14" y1="11" x2="14" y2="17"></line>
                  </svg>
                </button>
              </div>
            </div>
          ))}
          {todayIntakes.length > 3 && (
            <div className="caffeine-log-more">
              +{todayIntakes.length - 3} más
            </div>
          )}
        </div>
      )}

      {/* Modal para crear/editar ingesta */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={isEditing ? "Editar consumo de cafeína" : "Registrar consumo de cafeína"}
        footer={renderModalFooter()}
      >
        <CaffeineIntakeForm
          ref={formRef}
          beverages={beverages}
          initialData={currentIntake}
          onSubmit={handleFormSubmit}
          isLoading={loading}
        />
      </Modal>

      {/* Diálogo de confirmación para eliminar */}
      <ConfirmDialog {...confirmDialogProps} />
    </div>
  );
}

export default CaffeinePanel;