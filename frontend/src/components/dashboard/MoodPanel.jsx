import { useState, useMemo } from 'react';
import { CreateMoodEntry, UpdateMoodEntry } from "@api/MoodController";

function MoodPanel({ moodEntries, date }) {
  const [isAddingMood, setIsAddingMood] = useState(false);
  const [moodScore, setMoodScore] = useState(5);
  const [energyLevel, setEnergyLevel] = useState(5);
  const [anxietyLevel, setAnxietyLevel] = useState(5);
  const [stressLevel, setStressLevel] = useState(5);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  // Convertir fecha a formato string YYYY-MM-DD para comparaciones
  const dateString = useMemo(() => {
    return date.toISOString().split('T')[0];
  }, [date]);

  // Obtener entrada de estado de ánimo para hoy
  const todayMood = useMemo(() => {
    if (!moodEntries || moodEntries.length === 0) return null;

    return moodEntries.find(entry => {
      if (!entry.date) return false;
      const entryDate = new Date(entry.date);
      return entryDate.toISOString().split('T')[0] === dateString;
    });
  }, [moodEntries, dateString]);

  // Inicializar el formulario con los datos existentes si hay
  useMemo(() => {
    if (todayMood) {
      setMoodScore(todayMood.mood_score || 5);
      setEnergyLevel(todayMood.energy_level || 5);
      setAnxietyLevel(todayMood.anxiety_level || 5);
      setStressLevel(todayMood.stress_level || 5);
      setNotes(todayMood.notes || '');
    }
  }, [todayMood]);

  // Mapear puntuación a emoji y descripción
  const getMoodInfo = (score) => {
    const moodMap = {
      1: { emoji: '😩', description: 'Muy mal' },
      2: { emoji: '😟', description: 'Mal' },
      3: { emoji: '😕', description: 'Regular bajo' },
      4: { emoji: '😐', description: 'Regular' },
      5: { emoji: '😐', description: 'Neutral' },
      6: { emoji: '🙂', description: 'Regular alto' },
      7: { emoji: '😊', description: 'Bien' },
      8: { emoji: '😄', description: 'Muy bien' },
      9: { emoji: '😁', description: 'Excelente' },
      10: { emoji: '🤩', description: 'Increíble' }
    };

    return moodMap[score] || { emoji: '😐', description: 'Neutral' };
  };

  // Función para mostrar/ocultar el formulario
  const toggleMoodForm = () => {
    setIsAddingMood(prev => !prev);
  };

  // Función para guardar registro de estado de ánimo
  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);

    try {
      const moodData = {
        date: dateString,
        mood_score: moodScore,
        energy_level: energyLevel,
        anxiety_level: anxietyLevel,
        stress_level: stressLevel,
        notes: notes,
        tags: []
      };

      if (todayMood && todayMood.id) {
        // Actualizar entrada existente
        await UpdateMoodEntry(todayMood.id, moodData);
      } else {
        // Crear nueva entrada
        await CreateMoodEntry(moodData);
      }

      setIsAddingMood(false);

      // Aquí normalmente recargaríamos los datos, pero por simplicidad
      // podemos confiar en que el componente padre ya maneja esto
    } catch (error) {
      console.error("Error al guardar estado de ánimo:", error);
    } finally {
      setLoading(false);
    }
  };

  const currentMoodInfo = useMemo(() => {
    return getMoodInfo(todayMood?.mood_score || 5);
  }, [todayMood]);

  // Función para renderizar los botones de selección de estado de ánimo
  const renderMoodButtons = () => {
    const buttons = [];
    for (let i = 1; i <= 10; i++) {
      const { emoji } = getMoodInfo(i);
      buttons.push(
        <button
          key={i}
          type="button"
          className={`mood-button ${moodScore === i ? 'active' : ''}`}
          onClick={() => setMoodScore(i)}
          disabled={loading}
        >
          <span className="mood-button-emoji">{emoji}</span>
          <span className="mood-button-label">{i}</span>
        </button>
      );
    }
    return buttons;
  };

  return (
    <div className="mood-panel">
      <div className="bento-card-header">
        <h2 className="bento-card-title">Estado de Ánimo</h2>
        <div className="bento-card-actions">
          <button
            className="btn btn-icon"
            onClick={toggleMoodForm}
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

      {!isAddingMood && todayMood ? (
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
      ) : !isAddingMood ? (
        <div className="mood-empty">
          <p>No has registrado tu estado de ánimo hoy.</p>
          <button
            className="btn btn-primary"
            onClick={toggleMoodForm}
          >
            Registrar ahora
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="mood-form">
          <div className="form-group">
            <label className="form-label">¿Cómo te sientes hoy?</label>
            <div className="mood-buttons">
              {renderMoodButtons()}
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Nivel de energía</label>
            <input
              type="range"
              className="form-range"
              min="1"
              max="10"
              value={energyLevel}
              onChange={(e) => setEnergyLevel(parseInt(e.target.value))}
              disabled={loading}
            />
            <div className="range-labels">
              <span>Baja</span>
              <span className="range-value">{energyLevel}</span>
              <span>Alta</span>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Nivel de ansiedad</label>
            <input
              type="range"
              className="form-range"
              min="1"
              max="10"
              value={anxietyLevel}
              onChange={(e) => setAnxietyLevel(parseInt(e.target.value))}
              disabled={loading}
            />
            <div className="range-labels">
              <span>Baja</span>
              <span className="range-value">{anxietyLevel}</span>
              <span>Alta</span>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Nivel de estrés</label>
            <input
              type="range"
              className="form-range"
              min="1"
              max="10"
              value={stressLevel}
              onChange={(e) => setStressLevel(parseInt(e.target.value))}
              disabled={loading}
            />
            <div className="range-labels">
              <span>Bajo</span>
              <span className="range-value">{stressLevel}</span>
              <span>Alto</span>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Notas (opcional)</label>
            <textarea
              className="form-control"
              rows="3"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              disabled={loading}
              placeholder="¿Qué ha influido en tu estado de ánimo hoy?"
            ></textarea>
          </div>

          <div className="form-buttons">
            <button
              type="button"
              className="btn btn-text"
              onClick={toggleMoodForm}
              disabled={loading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
            >
              {loading ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

export default MoodPanel;