import { useState, useEffect, useMemo } from 'react';

function NotesWidget({ date }) {
  const [notes, setNotes] = useState('');
  const [savedNotes, setSavedNotes] = useState({});
  const [saving, setSaving] = useState(false);

  // Convertir fecha a formato string YYYY-MM-DD para usar como clave
  const dateKey = useMemo(() => {
    return date.toISOString().split('T')[0];
  }, [date]);

  // Cargar notas para la fecha actual
  useEffect(() => {
    // En una implementación real, aquí cargaríamos las notas desde una API o base de datos
    // Por ahora, simplemente cargamos desde el estado local
    setNotes(savedNotes[dateKey] || '');
  }, [dateKey, savedNotes]);

  // Guardar notas
  const saveNotes = () => {
    setSaving(true);

    // Simular retraso de guardado
    setTimeout(() => {
      setSavedNotes(prev => ({
        ...prev,
        [dateKey]: notes
      }));
      setSaving(false);
    }, 500);

    // En una implementación real, aquí enviaríamos las notas a una API o base de datos
  };

  // Limpiar notas
  const clearNotes = () => {
    setNotes('');
  };

  // Guardar cuando el usuario deja de escribir por un tiempo
  useEffect(() => {
    const timer = setTimeout(() => {
      if (notes !== savedNotes[dateKey]) {
        saveNotes();
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [notes, dateKey, savedNotes]);

  return (
    <div className="notes-widget">
      <div className="bento-card-header">
        <h2 className="bento-card-title">Notas del día</h2>
        <div className="bento-card-actions">
          {saving ? (
            <span className="saving-indicator">Guardando...</span>
          ) : notes !== savedNotes[dateKey] ? (
            <span className="unsaved-indicator">Sin guardar</span>
          ) : null}

          <button
            className="btn btn-icon btn-sm"
            onClick={clearNotes}
            title="Limpiar notas"
            disabled={saving || !notes}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="3 6 5 6 21 6"></polyline>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
            </svg>
          </button>
        </div>
      </div>

      <textarea
        className="notes-content"
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="Escribe aquí tus notas, pensamientos o recordatorios para este día..."
        disabled={saving}
      ></textarea>

      <div className="notes-date">
        {date.toLocaleDateString('es-ES', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        })}
      </div>
    </div>
  );
}

export default NotesWidget;