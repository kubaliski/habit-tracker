import { useState, useMemo } from 'react';

function CalendarPanel({ habits, moodEntries, caffeineIntakes, date, onDateSelect }) {
  const [currentMonth, setCurrentMonth] = useState(new Date(date));

  // Generar las fechas para el calendario
  const calendarDays = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();

    // Primer día del mes y último día
    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);

    // Obtener el día de la semana del primer día (0 = domingo, 1 = lunes, etc.)
    let firstDayOfWeek = firstDayOfMonth.getDay();
    if (firstDayOfWeek === 0) firstDayOfWeek = 7; // Convertir domingo (0) a 7 para que la semana comience en lunes

    const daysArray = [];

    // Días del mes anterior para completar la primera semana
    for (let i = firstDayOfWeek - 1; i > 0; i--) {
      const prevMonthDay = new Date(year, month, 1 - i);
      daysArray.push({
        date: prevMonthDay,
        isCurrentMonth: false
      });
    }

    // Días del mes actual
    for (let i = 1; i <= lastDayOfMonth.getDate(); i++) {
      const currentDate = new Date(year, month, i);
      daysArray.push({
        date: currentDate,
        isCurrentMonth: true
      });
    }

    // Días del próximo mes para completar la última semana
    const remainingDays = 7 - (daysArray.length % 7);
    if (remainingDays < 7) {
      for (let i = 1; i <= remainingDays; i++) {
        const nextMonthDay = new Date(year, month + 1, i);
        daysArray.push({
          date: nextMonthDay,
          isCurrentMonth: false
        });
      }
    }

    return daysArray;
  }, [currentMonth]);

  // Función para cambiar el mes
  const changeMonth = (increment) => {
    setCurrentMonth(prevMonth => {
      const newMonth = new Date(prevMonth);
      newMonth.setMonth(newMonth.getMonth() + increment);
      return newMonth;
    });
  };

  // Verificar si una fecha está en la lista de registros de hábitos
  const hasHabitLog = (date) => {
    // En un escenario real, aquí verificaríamos si hay registros para esta fecha
    // Dado que no tenemos esa información en este momento, usamos una aproximación aleatoria
    return Math.random() > 0.7;
  };

  // Verificar si una fecha está en la lista de registros de cafeína
  const hasCaffeineLog = (date) => {
    if (!caffeineIntakes || caffeineIntakes.length === 0) return false;

    const dateString = date.toISOString().split('T')[0];

    return caffeineIntakes.some(intake => {
      if (!intake.timestamp) return false;
      const intakeDate = new Date(intake.timestamp);
      return intakeDate.toISOString().split('T')[0] === dateString;
    });
  };

  // Verificar si una fecha está en la lista de registros de estado de ánimo
  const hasMoodLog = (date) => {
    if (!moodEntries || moodEntries.length === 0) return false;

    const dateString = date.toISOString().split('T')[0];

    return moodEntries.some(entry => {
      if (!entry.date) return false;
      const entryDate = new Date(entry.date);
      return entryDate.toISOString().split('T')[0] === dateString;
    });
  };

  // Obtener clases CSS para un día específico
  const getDayClasses = (day) => {
    const classes = ['calendar-day'];

    if (!day.isCurrentMonth) {
      classes.push('calendar-non-month-day');
    }

    // Verificar si es el día seleccionado actualmente
    const isSelectedDay = date.toISOString().split('T')[0] === day.date.toISOString().split('T')[0];
    if (isSelectedDay) {
      classes.push('calendar-current-day');
    }

    return classes.join(' ');
  };

  return (
    <div className="calendar-panel">
      <div className="calendar-header">
        <h2 className="calendar-title">
          {currentMonth.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}
        </h2>

        <div className="calendar-nav">
          <button
            className="btn btn-icon"
            onClick={() => changeMonth(-1)}
            title="Mes anterior"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6"></polyline>
            </svg>
          </button>

          <button
            className="btn btn-icon"
            onClick={() => changeMonth(1)}
            title="Mes siguiente"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6"></polyline>
            </svg>
          </button>
        </div>
      </div>

      <div className="calendar-grid">
        {/* Nombres de los días de la semana */}
        {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map(day => (
          <div key={day} className="calendar-day-name">{day}</div>
        ))}

        {/* Días del calendario */}
        {calendarDays.map((day, index) => (
          <div
            key={index}
            className={getDayClasses(day)}
            onClick={() => onDateSelect(day.date)}
          >
            <div className="calendar-day-number">{day.date.getDate()}</div>

            <div className="calendar-day-indicators">
              {hasHabitLog(day.date) && (
                <div className="calendar-day-indicator habit-indicator"></div>
              )}

              {hasCaffeineLog(day.date) && (
                <div className="calendar-day-indicator caffeine-indicator"></div>
              )}

              {hasMoodLog(day.date) && (
                <div className="calendar-day-indicator mood-indicator"></div>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="calendar-legend">
        <div className="calendar-legend-item">
          <div className="calendar-legend-dot habit-indicator"></div>
          <span>Hábitos</span>
        </div>

        <div className="calendar-legend-item">
          <div className="calendar-legend-dot caffeine-indicator"></div>
          <span>Cafeína</span>
        </div>

        <div className="calendar-legend-item">
          <div className="calendar-legend-dot mood-indicator"></div>
          <span>Estado de ánimo</span>
        </div>
      </div>
    </div>
  );
}

export default CalendarPanel;