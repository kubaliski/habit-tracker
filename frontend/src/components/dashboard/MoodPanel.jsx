import { useState, useMemo, useEffect, useRef } from 'react';
import { CreateMoodEntry, UpdateMoodEntry } from "@api/MoodController";
import { Modal } from '../ui';
import MoodForm from '../forms/MoodForm';
import { getMoodInfo } from '@utils/getMoodInfo';

function MoodPanel({ moodEntries, date, onMoodEntryChange }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [currentMood, setCurrentMood] = useState(null);

  // Referencia para el formulario
  const formRef = useRef(null);

  // Convertir fecha a formato string YYYY-MM-DD para comparaciones
  const dateString = useMemo(() => {
    return date.toISOString().split('T')[0];
  }, [date]);

  // Obtener entrada de estado de ánimo para el día seleccionado
  const todayMood = useMemo(() => {
    if (!moodEntries || moodEntries.length === 0) return null;

    return moodEntries.find(entry => {
      if (!entry.date) return false;
      const entryDate = new Date(entry.date);
      return entryDate.toISOString().split('T')[0] === dateString;
    });
  }, [moodEntries, dateString]);

  // Actualizar el estado actual cuando cambia todayMood
  useEffect(() => {
    setCurrentMood(todayMood);
  }, [todayMood]);

  // Función para mostrar el modal
  const openModal = () => {
    setIsModalOpen(true);
  };

  // Función para guardar registro de estado de ánimo
  const handleFormSubmit = async (formData) => {
    setLoading(true);

    try {
      const moodData = {
        date: dateString,
        ...formData
      };

      let result;
      if (todayMood && todayMood.id) {
        // Actualizar entrada existente
        result = await UpdateMoodEntry(todayMood.id, moodData);
        console.log("[MoodPanel] Entrada actualizada:", result);
      } else {
        // Crear nueva entrada
        result = await CreateMoodEntry(moodData);
        console.log("[MoodPanel] Nueva entrada creada:", result);
      }

      // Notificar al componente padre que la entrada ha sido actualizada
      if (onMoodEntryChange && typeof onMoodEntryChange === 'function') {
        onMoodEntryChange();
      }

      // Cerrar el modal
      setIsModalOpen(false);
    } catch (error) {
      console.error("Error al guardar estado de ánimo:", error);
    } finally {
      setLoading(false);
    }
  };

  const currentMoodInfo = useMemo(() => {
    return getMoodInfo(todayMood?.mood_score || 5);
  }, [todayMood]);

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
        {loading ? 'Guardando...' : todayMood ? 'Actualizar' : 'Guardar'}
      </button>
    </>
  );

  return (
    <div className="mood-panel">
      <div className="bento-card-header">
        <h2 className="bento-card-title">Estado de Ánimo</h2>
        <div className="bento-card-actions">
          <button
            className="btn btn-icon"
            onClick={openModal}
            title={todayMood ? "Editar estado de ánimo" : "Registrar estado de ánimo"}
          >
            {todayMood ? (
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19"></line>
                <line x1="5" y1="12" x2="19" y2="12"></line>
              </svg>
            )}
          </button>
        </div>
      </div>

      {todayMood ? (
        <>
          <div className="mood-today">
            <div className="mood-emoji">{currentMoodInfo.emoji}</div>
            <div className="mood-value">{todayMood.mood_score}/10</div>
            <div className="mood-description">{currentMoodInfo.description}</div>
          </div>

          <div className="mood-factors">
            <div className="mood-factor">
              <div className="mood-factor-label">Energía</div>
              <div className="mood-factor-value">{todayMood.energy_level}/10</div>
            </div>

            <div className="mood-factor">
              <div className="mood-factor-label">Ansiedad</div>
              <div className="mood-factor-value">{todayMood.anxiety_level}/10</div>
            </div>

            <div className="mood-factor">
              <div className="mood-factor-label">Estrés</div>
              <div className="mood-factor-value">{todayMood.stress_level}/10</div>
            </div>
          </div>

          {todayMood.notes && (
            <div className="mood-notes">
              <div className="mood-notes-label">Notas:</div>
              <div className="mood-notes-content">{todayMood.notes}</div>
            </div>
          )}
        </>
      ) : (
        <div className="mood-empty">
          <p>No has registrado tu estado de ánimo hoy.</p>
          <button
            className="btn btn-primary"
            onClick={openModal}
          >
            Registrar ahora
          </button>
        </div>
      )}

      {/* Modal para crear/editar estado de ánimo */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={todayMood ? "Editar estado de ánimo" : "Registrar estado de ánimo"}
        footer={renderModalFooter()}
        size="lg"
      >
        <MoodForm
          ref={formRef}
          initialData={todayMood}
          onSubmit={handleFormSubmit}
          isLoading={loading}
        />
      </Modal>
    </div>
  );
}

export default MoodPanel;