import { useState, useEffect, useMemo } from 'react';
import { GetHabitLogs } from "@api/HabitController";
import { getMoodInfo } from '@utils/getMoodInfo';

function DailySummary({ date, habits, todayCaffeine, moodEntries }) {
  const [habitCompletions, setHabitCompletions] = useState({});
  const [loadingStats, setLoadingStats] = useState(true);

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

  // Cargar los registros de los hábitos para la fecha seleccionada
  useEffect(() => {
    const loadHabitCompletions = async () => {
      setLoadingStats(true);
      const completionsMap = {};

      try {
        // Solo procesar hábitos activos
        const activeHabits = habits.filter(habit => habit.active);

        // Para cada hábito activo, verificar si está completado para la fecha seleccionada
        for (const habit of activeHabits) {
          const logs = await GetHabitLogs(habit.id, dateString, dateString);
          if (logs && logs.length > 0) {
            completionsMap[habit.id] = logs[0].completed;
          } else {
            completionsMap[habit.id] = false;
          }
        }

        setHabitCompletions(completionsMap);
      } catch (error) {
        console.error("Error al cargar estado de los hábitos:", error);
      } finally {
        setLoadingStats(false);
      }
    };

    if (habits && habits.length > 0) {
      loadHabitCompletions();
    } else {
      setLoadingStats(false);
    }
  }, [habits, dateString]);

  // Calcular hábitos completados hoy
  const habitStats = useMemo(() => {
    const activeHabits = habits.filter(habit => habit.active);
    const totalActive = activeHabits.length;

    // Contar cuántos hábitos están completados
    const completed = Object.values(habitCompletions).filter(value => value).length;

    return {
      total: totalActive,
      completed,
      percentage: totalActive > 0 ? Math.round((completed / totalActive) * 100) : 0
    };
  }, [habits, habitCompletions]);

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

    // Usar la función getMoodInfo para mantener consistencia con MoodPanel
    const moodInfo = getMoodInfo(todayEntry.mood_score);

    return {
      score: todayEntry.mood_score,
      emoji: moodInfo.emoji,
      description: moodInfo.description
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
            {loadingStats ? (
              <span className="loading-indicator">...</span>
            ) : (
              `${habitStats.completed}/${habitStats.total}`
            )}
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
    </div>
  );
}

export default DailySummary;