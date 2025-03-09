// components/forms/MoodForm.jsx
import React, { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import { getMoodInfo } from '@utils/getMoodInfo';

/**
 * Formulario para registrar o editar el estado de ánimo
 */
const MoodForm = forwardRef(({
  initialData = null,
  onSubmit,
  isLoading = false,
}, ref) => {
  // Estado del formulario
  const [moodScore, setMoodScore] = useState(5);
  const [energyLevel, setEnergyLevel] = useState(5);
  const [anxietyLevel, setAnxietyLevel] = useState(5);
  const [stressLevel, setStressLevel] = useState(5);
  const [notes, setNotes] = useState('');
  const [formError, setFormError] = useState('');

  // Exponer el método submit a través de la referencia
  useImperativeHandle(ref, () => ({
    submitForm: handleSubmit
  }));

  // Inicializar el formulario con los datos iniciales o valores por defecto
  useEffect(() => {
    if (initialData) {
      setMoodScore(initialData.mood_score || 5);
      setEnergyLevel(initialData.energy_level || 5);
      setAnxietyLevel(initialData.anxiety_level || 5);
      setStressLevel(initialData.stress_level || 5);
      setNotes(initialData.notes || '');
    } else {
      // Resetear a valores predeterminados
      setMoodScore(5);
      setEnergyLevel(5);
      setAnxietyLevel(5);
      setStressLevel(5);
      setNotes('');
    }
  }, [initialData]);

  // Manejar envío del formulario
  const handleSubmit = () => {
    // Validar formulario (opcional)
    if (moodScore < 1 || moodScore > 10) {
      setFormError('El estado de ánimo debe ser un valor entre 1 y 10');
      return;
    }

    // Preparar datos a enviar
    const formData = {
      mood_score: moodScore,
      energy_level: energyLevel,
      anxiety_level: anxietyLevel,
      stress_level: stressLevel,
      notes: notes,
      tags: []
    };

    // Enviar el formulario
    onSubmit(formData);
  };

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
          disabled={isLoading}
        >
          <span className="mood-button-emoji">{emoji}</span>
          <span className="mood-button-label">{i}</span>
        </button>
      );
    }
    return buttons;
  };

  return (
    <div className="mood-form">
      {formError && <div className="error-message mb-4">{formError}</div>}

      <div className="form-group">
        <label className="form-label">¿Cómo te sientes hoy?</label>
        <div className="mood-buttons mood-buttons-grid">
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
          disabled={isLoading}
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
          disabled={isLoading}
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
          disabled={isLoading}
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
          disabled={isLoading}
          placeholder="¿Qué ha influido en tu estado de ánimo hoy?"
        ></textarea>
      </div>
    </div>
  );
});

export default MoodForm;