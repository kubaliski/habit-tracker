import { useMemo } from 'react';

function DailySummary({ date, habits, todayCaffeine, moodEntries }) {
  // Formatear fecha para mostrar
  const formattedDate = useMemo(() => {
    return date.toLocaleDateString('es-ES', {
      weekday: 'long',
      day: 'numeric',
      month: 'long'
    });
  }, [date]);

  // Convertir fecha a formato string YYYY-MM-DD para comparaciones
  const dateString = useMemo(() => {
    return date.toISOString().split('T')[0];
  }, [date]);

  // Calcular hábitos completados hoy
  const habitStats = useMemo(() => {
    const activeHabits = habits.filter(habit => habit.active);
    const totalActive = activeHabits.length;

    // Aquí normalmente consultaríamos los logs para este día específico
    // Por ahora, usamos un valor de placeholder
    const completed = Math.floor(Math.random() * (totalActive + 1));

    return {
      total: totalActive,
      completed,
      percentage: totalActive > 0 ? Math.round((completed / totalActive) * 100) : 0
    };
  }, [habits, dateString]);

  // Obtener estado de ánimo para hoy
  const todayMood = useMemo(() => {
    if (!moodEntries || moodEntries.length === 0) return null;

    // Encontrar la entrada de estado de ánimo para hoy
    const todayEntry = moodEntries.find(entry => {
      if (!entry.date) return false;
      const entryDate = new Date(entry.date);
      return entryDate.toISOString().split('T')[0] === dateString;
    });

    if (!todayEntry) return null;

    // Mapear puntuación a emoji y descripción
    let emoji = '😐';
    let description = 'Neutral';

    if (todayEntry.mood_score >= 8) {
      emoji = '😄';
      description = 'Excelente';
    } else if (todayEntry.mood_score >= 6) {
      emoji = '🙂';
      description = 'Bien';
    } else if (todayEntry.mood_score >= 4) {
      emoji = '😐';
      description = 'Regular';
    } else if (todayEntry.mood_score >= 2) {
      emoji = '😕';
      description = 'Mal';
    } else {
      emoji = '😩';
      description = 'Muy mal';
    }

    return {
      score: todayEntry.mood_score,
      emoji,
      description
    };
  }, [moodEntries, dateString]);

  // Formatea la cantidad de cafeína para mostrarla
  const caffeineFormatted = useMemo(() => {
    return todayCaffeine ? `${Math.round(todayCaffeine)} mg` : '0 mg';
  }, [todayCaffeine]);

  return (
    <div className="daily-summary">
      <div className="bento-card-header">
        <h2 className="bento-card-title">Resumen del día</h2>
        <div className="summary-date">{formattedDate}</div>
      </div>

      <div className="summary-stats">
        <div className="summary-stat">
          <div className="summary-stat-value">
            {habitStats.completed}/{habitStats.total}
          </div>
          <div className="summary-stat-label">Hábitos completados</div>
          <div className="progress-bar">
            <div
              className="progress-bar-fill"
              style={{ width: `${habitStats.percentage}%` }}
            ></div>
          </div>
        </div>

        <div className="summary-stat">
          <div className="summary-stat-value">{caffeineFormatted}</div>
          <div className="summary-stat-label">Cafeína consumida</div>
        </div>

        <div className="summary-stat">
          <div className="summary-stat-value">
            {todayMood ? (
              <>
                <span className="mood-emoji">{todayMood.emoji}</span> {todayMood.score}/10
              </>
            ) : (
              <span className="mood-emoji">❓</span>
            )}
          </div>
          <div className="summary-stat-label">
            {todayMood ? todayMood.description : 'No registrado'}
          </div>
        </div>
      </div>

      <div className="summary-actions">
        <button className="btn btn-primary">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
          Registrar actividad
        </button>
      </div>
    </div>
  );
}

export default DailySummary;