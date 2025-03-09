import { useState, useMemo, useCallback } from 'react';

function CalendarPanel({ habits, moodEntries, caffeineIntakes, date, onDateSelect }) {
  const [currentMonth, setCurrentMonth] = useState(new Date(date));

  // Función mejorada para normalizar una fecha (eliminar horas, minutos, segundos)
  // Esta función maneja correctamente las diferentes zonas horarias
  const normalizeDate = useCallback((dateInput) => {
    if (!dateInput) return '';

    try {
      let year, month, day;

      if (dateInput instanceof Date) {
        year = dateInput.getFullYear();
        month = dateInput.getMonth() + 1;
        day = dateInput.getDate();
      } else if (typeof dateInput === 'string') {
        // Para fechas en formato string
        const dateObj = new Date(dateInput);
        if (isNaN(dateObj.getTime())) {
          console.error("Fecha inválida:", dateInput);
          return '';
        }
        year = dateObj.getFullYear();
        month = dateObj.getMonth() + 1;
        day = dateObj.getDate();
      } else {
        return '';
      }

      return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    } catch (e) {
      console.error("Error al normalizar fecha:", e, dateInput);
      return '';
    }
  }, []);

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
      // Establecer la hora a mediodía para evitar problemas con cambios horarios
      currentDate.setHours(12, 0, 0, 0);
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
        // Establecer la hora a mediodía
        nextMonthDay.setHours(12, 0, 0, 0);
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
  const hasHabitLog = useCallback((dayDate) => {
    if (!habits || habits.length === 0) return false;

    // Implementar lógica real para verificar hábitos
    // Por ahora, usamos una aproximación aleatoria pero constante
    const dateStr = normalizeDate(dayDate);
    const hash = dateStr.split('').reduce((a, b) => a + b.charCodeAt(0), 0);
    return hash % 3 === 0;
  }, [habits, normalizeDate]);

  // Verificar si una fecha está en la lista de registros de cafeína
  const hasCaffeineLog = useCallback((dayDate) => {
    if (!caffeineIntakes || caffeineIntakes.length === 0) return false;

    // Usar el método de normalización para comparar fechas locales
    const normalizedDateString = normalizeDate(dayDate);

    return caffeineIntakes.some(intake => {
      if (!intake.timestamp) return false;
      const intakeNormalizedDate = normalizeDate(intake.timestamp);
      return intakeNormalizedDate === normalizedDateString;
    });
  }, [caffeineIntakes, normalizeDate]);

  // Verificar si una fecha está en la lista de registros de estado de ánimo
  const hasMoodLog = useCallback((dayDate) => {
    if (!moodEntries || moodEntries.length === 0) return false;

    // Usar el método de normalización para comparar fechas locales
    const normalizedDateString = normalizeDate(dayDate);

    return moodEntries.some(entry => {
      if (!entry.date) return false;
      const entryNormalizedDate = normalizeDate(entry.date);
      return entryNormalizedDate === normalizedDateString;
    });
  }, [moodEntries, normalizeDate]);

  // Obtener clases CSS para un día específico
  const getDayClasses = useCallback((day) => {
    const classes = ['calendar-day'];

    if (!day.isCurrentMonth) {
      classes.push('calendar-non-month-day');
    }

    // Verificar si es el día seleccionado actualmente utilizando normalizeDate
    const isSelectedDay = normalizeDate(date) === normalizeDate(day.date);
    if (isSelectedDay) {
      classes.push('calendar-current-day');
    }

    return classes.join(' ');
  }, [date, normalizeDate]);

  // Seleccionar fecha
  const handleDateSelect = (selectedDate) => {
    // Crear una nueva fecha basada en la fecha seleccionada
    const newDate = new Date(selectedDate);
    // Establecer hora a mediodía para evitar problemas de zona horaria
    newDate.setHours(12, 0, 0, 0);
    onDateSelect(newDate);
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
            onClick={() => handleDateSelect(day.date)}
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