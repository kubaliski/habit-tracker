import { useState, useMemo } from 'react';
import { CompleteHabit, UncompleteHabit } from "../../../wailsjs/go/api/HabitController";

function HabitsPanel({ habits, date }) {
  const [loadingHabitId, setLoadingHabitId] = useState(null);
  const [habitStatus, setHabitStatus] = useState({});

  // Convertir fecha a formato string YYYY-MM-DD para comparaciones
  const dateString = useMemo(() => {
    return date.toISOString().split('T')[0];
  }, [date]);

  // Filtrar solo los hábitos activos
  const activeHabits = useMemo(() => {
    return habits.filter(habit => habit.active);
  }, [habits]);

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

  return (
    <div className="habits-panel">
      <div className="bento-card-header">
        <h2 className="bento-card-title">Mis Hábitos</h2>
        <div className="bento-card-actions">
          <button className="btn btn-icon">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="3" y1="12" x2="21" y2="12"></line>
              <line x1="3" y1="6" x2="21" y2="6"></line>
              <line x1="3" y1="18" x2="21" y2="18"></line>
            </svg>
          </button>
        </div>
      </div>

      {activeHabits.length === 0 ? (
        <div className="habits-empty">
          <p>No tienes hábitos activos. ¡Comienza a crear uno!</p>
          <button className="btn btn-primary">Nuevo Hábito</button>
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
                  <span>3 días</span>
                </div>
              </div>

              <div className="habit-actions">
                <button className="btn btn-icon btn-sm">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="1"></circle>
                    <circle cx="19" cy="12" r="1"></circle>
                    <circle cx="5" cy="12" r="1"></circle>
                  </svg>
                </button>
              </div>
            </div>
          ))}

          <button className="add-habit-button">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
            Añadir nuevo hábito
          </button>
        </div>
      )}
    </div>
  );
}

export default HabitsPanel;