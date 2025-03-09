// components/dashboard/HabitsPanel.jsx
import { useState, useMemo, useEffect, useRef } from 'react';
import {
  CompleteHabit,
  UncompleteHabit,
  CreateHabit,
  GetHabitLogs,
  DeleteHabit
} from "@api/HabitController";
import {Modal , ConfirmDialog} from '../ui';
import HabitForm from '../forms/HabitForm';
import useConfirmDialog from '@hooks/useConfirmDialog';

function HabitsPanel({ habits, date, onHabitCreated }) {
  const [loadingHabitId, setLoadingHabitId] = useState(null);
  const [habitStatus, setHabitStatus] = useState({});
  const [habitStreaks, setHabitStreaks] = useState({});
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingHabitId, setEditingHabitId] = useState(null);
  const [currentHabit, setCurrentHabit] = useState(null);
  const [loading, setLoading] = useState(false);

  // Referencia al formulario
  const formRef = useRef(null);

  // Hook personalizado para el diálogo de confirmación
  const [confirmDialogProps, confirm] = useConfirmDialog({
    title: 'Eliminar hábito',
    message: '¿Estás seguro de que quieres eliminar este hábito? Perderás todo el historial asociado. Esta acción no se puede deshacer.',
    confirmText: 'Eliminar',
    confirmButtonClass: 'btn-danger'
  });

  // Convertir fecha a formato string YYYY-MM-DD para comparaciones
  const dateString = useMemo(() => {
    return date.toISOString().split('T')[0];
  }, [date]);

  // Filtrar solo los hábitos activos
  const activeHabits = useMemo(() => {
    return habits.filter(habit => habit.active);
  }, [habits]);

  // Cargar el estado de los hábitos para la fecha seleccionada
  const loadHabitStatus = async () => {
    try {
      // Para cada hábito activo, verificar si está completado para la fecha actual
      for (const habit of activeHabits) {
        const logs = await GetHabitLogs(habit.id, dateString, dateString);
        if (logs && logs.length > 0) {
          const isCompleted = logs[0].completed;
          setHabitStatus(prev => ({
            ...prev,
            [habit.id]: isCompleted
          }));
        }
      }
    } catch (error) {
      console.error("Error al cargar el estado de los hábitos:", error);
    }
  };

  // Calcular las rachas actuales de los hábitos
  const calculateStreaks = async () => {
    try {
      // Para cada hábito activo, calcular la racha actual
      for (const habit of activeHabits) {
        // Obtener registros de los últimos 60 días para calcular la racha
        const sixtyDaysAgo = new Date();
        sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);
        const startDate = sixtyDaysAgo.toISOString().split('T')[0];

        // Obtener logs ordenados por fecha (el más reciente primero)
        const logs = await GetHabitLogs(habit.id, startDate, dateString);
        if (!logs || logs.length === 0) {
          setHabitStreaks(prev => ({ ...prev, [habit.id]: 0 }));
          continue;
        }

        // Organizamos los logs por fecha para un acceso más fácil
        const logsByDate = {};
        logs.forEach(log => {
          const logDate = new Date(log.date).toISOString().split('T')[0];
          logsByDate[logDate] = log.completed;
        });

        // Calcular racha actual comenzando desde la fecha actual hacia atrás
        let streak = 0;
        let currentDate = new Date(date);

        while (true) {
          const checkDate = currentDate.toISOString().split('T')[0];
          const isCompleted = logsByDate[checkDate];

          // Si el hábito no fue completado o no hay registro, romper la racha
          if (isCompleted !== true) {
            break;
          }

          streak++;
          // Mover al día anterior
          currentDate.setDate(currentDate.getDate() - 1);
        }

        setHabitStreaks(prev => ({ ...prev, [habit.id]: streak }));
      }
    } catch (error) {
      console.error("Error al calcular las rachas:", error);
    }
  };

  // Cargar el estado de los hábitos y calcular rachas al cambiar la fecha o los hábitos
  useEffect(() => {
    loadHabitStatus();
    calculateStreaks();
  }, [dateString, activeHabits]);

  // Función para cambiar el estado del hábito
  const toggleHabitStatus = async (habitId, currentStatus) => {
    setLoadingHabitId(habitId);

    try {
      if (currentStatus) {
        await UncompleteHabit(habitId, dateString);
        setHabitStatus(prev => ({
          ...prev,
          [habitId]: false
        }));
      } else {
        await CompleteHabit(habitId, dateString);
        setHabitStatus(prev => ({
          ...prev,
          [habitId]: true
        }));
      }

      // Actualizar la racha después de cambiar el estado
      setTimeout(() => {
        calculateStreaks();
      }, 300);
    } catch (error) {
      console.error(`Error al cambiar estado del hábito ${habitId}:`, error);
    } finally {
      setLoadingHabitId(null);
    }
  };

  // Función para determinar la clase CSS basada en el estado
  const getHabitItemClass = (habitId) => {
    const classes = ['habit-item'];

    if (habitStatus[habitId]) {
      classes.push('habit-completed');
    }

    if (loadingHabitId === habitId) {
      classes.push('habit-loading');
    }

    return classes.join(' ');
  };

  // Abrir el modal para añadir un nuevo hábito
  const openAddModal = () => {
    setIsEditing(false);
    setEditingHabitId(null);
    setCurrentHabit(null);
    setIsModalOpen(true);
  };

  // Abrir el modal para editar un hábito existente
  const openEditModal = (habit) => {
    setIsEditing(true);
    setEditingHabitId(habit.id);
    setCurrentHabit(habit);
    setIsModalOpen(true);
  };

  // Función para manejar solicitud de eliminación
  const handleDeleteRequest = async (habitId) => {
    // Usar el hook de confirmación
    const confirmed = await confirm();

    if (confirmed) {
      setLoading(true);
      try {
        await DeleteHabit(habitId);
        console.log("[HabitsPanel] Hábito eliminado con éxito, ID:", habitId);

        // Notificar al componente padre para recargar los hábitos
        if (onHabitCreated) {
          await onHabitCreated();
        }
      } catch (error) {
        console.error("Error al eliminar el hábito:", error);
      } finally {
        setLoading(false);
      }
    }
  };

  // Manejar envío del formulario
  const handleFormSubmit = async (formData) => {
    setLoading(true);

    try {
      if (isEditing) {
        // Actualizar un hábito existente - Aquí deberías implementar la función UpdateHabit
        // Por ahora solo mostramos un mensaje
        console.error("Edición de hábitos no implementada aún");
      } else {
        // Crear un nuevo hábito
        await CreateHabit(formData);

        console.log("[HabitsPanel] Nuevo hábito creado con éxito");
      }

      // Cerrar el modal
      setIsModalOpen(false);

      // Recargar la lista de hábitos
      if (onHabitCreated) {
        await onHabitCreated();
        // Después de que los hábitos se hayan recargado, actualizar las rachas
        setTimeout(() => {
          calculateStreaks();
        }, 500);
      }
    } catch (error) {
      console.error("Error al guardar hábito:", error);
    } finally {
      setLoading(false);
    }
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
        {loading ? 'Guardando...' : isEditing ? 'Actualizar' : 'Crear hábito'}
      </button>
    </>
  );

  return (
    <div className="habits-panel">
      <div className="bento-card-header">
        <h2 className="bento-card-title">Mis Hábitos</h2>
        <div className="bento-card-actions">
          <button
            className="btn btn-icon"
            onClick={openAddModal}
            aria-label="Añadir hábito"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
          </button>
        </div>
      </div>

      {activeHabits.length === 0 ? (
        <div className="habits-empty">
          <p>No tienes hábitos activos. ¡Comienza a crear uno!</p>
          <button
            className="btn btn-primary"
            onClick={openAddModal}
          >
            Nuevo Hábito
          </button>
        </div>
      ) : (
        <div className="habits-list">
          {activeHabits.map(habit => (
            <div key={habit.id} className={getHabitItemClass(habit.id)}>
              <div className="habit-check">
                <label className="custom-checkbox">
                  <input
                    type="checkbox"
                    checked={!!habitStatus[habit.id]}
                    onChange={() => toggleHabitStatus(habit.id, habitStatus[habit.id])}
                    disabled={loadingHabitId === habit.id}
                  />
                  <span className="checkmark"></span>
                </label>
              </div>

              <div className="habit-info">
                <div className="habit-name">{habit.name}</div>
                <div className="habit-streak">
                  <span className="habit-streak-icon">🔥</span>
                  <span>
                    {habitStreaks[habit.id] || 0}
                    {habitStreaks[habit.id] === 1 ? ' día' : ' días'}
                  </span>
                </div>
              </div>

              <div className="habit-actions">
                <button
                  className="btn btn-icon btn-sm"
                  onClick={() => openEditModal(habit)}
                  disabled={loading}
                  title="Editar hábito"
                  style={{ color: 'var(--color-primary)' }}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path>
                  </svg>
                </button>
                <button
                  className="btn btn-icon btn-sm"
                  onClick={() => handleDeleteRequest(habit.id)}
                  disabled={loading}
                  title="Eliminar hábito"
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

          <button
            className="add-habit-button"
            onClick={openAddModal}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
            Añadir nuevo hábito
          </button>
        </div>
      )}

      {/* Modal para crear/editar hábito */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={isEditing ? "Editar hábito" : "Crear nuevo hábito"}
        footer={renderModalFooter()}
      >
        <HabitForm
          ref={formRef}
          initialData={currentHabit}
          onSubmit={handleFormSubmit}
          isLoading={loading}
        />
      </Modal>

      {/* Diálogo de confirmación para eliminar */}
      <ConfirmDialog {...confirmDialogProps} />
    </div>
  );
}

export default HabitsPanel;