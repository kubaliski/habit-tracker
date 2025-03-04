import { useState, useEffect } from 'react';
import { GetHabitStats, GetMoodStats, GetCaffeineStats, GetCorrelationStats } from "@api/StatsController";

function StatsPanel({ habits, moodEntries, caffeineIntakes }) {
  const [activeTab, setActiveTab] = useState('general');
  const [period, setPeriod] = useState('month');
  const [stats, setStats] = useState({
    general: null,
    habits: null,
    mood: null,
    caffeine: null,
    correlations: null
  });
  const [loading, setLoading] = useState(true);
  const [selectedHabit, setSelectedHabit] = useState(null);

  // Cargar estadísticas basadas en el período seleccionado
  useEffect(() => {
    const loadStats = async () => {
      setLoading(true);

      try {
        // Estadísticas de hábitos (para el primer hábito activo como ejemplo)
        const activeHabit = habits.find(h => h.active);
        let habitStats = null;

        if (activeHabit) {
          habitStats = await GetHabitStats(activeHabit.id, period);
          if (!selectedHabit) {
            setSelectedHabit(activeHabit);
          }
        }

        // Estadísticas de estado de ánimo
        let moodStats = null;
        try {
          moodStats = await GetMoodStats(period);
          console.log("[StatsPanel] Estadísticas de estado de ánimo:", moodStats);
        } catch (moodError) {
          console.error("Error al cargar estadísticas de estado de ánimo:", moodError);
          moodStats = {
            average_mood: 0,
            total_entries: 0,
            best_mood: 0,
            worst_mood: 0
          };
        }

        // Estadísticas de cafeína
        let caffeineStats = null;
        try {
          caffeineStats = await GetCaffeineStats(period);
          console.log("[StatsPanel] Estadísticas de cafeína:", caffeineStats);
        } catch (caffeineError) {
          console.error("Error al cargar estadísticas de cafeína:", caffeineError);
          caffeineStats = {
            avg_daily_caffeine: 0,
            total_caffeine: 0,
            total_intakes: 0,
            unique_days: 0
          };
        }

        // Estadísticas de correlación
        let correlationStats = null;
        try {
          correlationStats = await GetCorrelationStats();
          console.log("[StatsPanel] Estadísticas de correlación:", correlationStats);
        } catch (correlationError) {
          console.error("Error al cargar estadísticas de correlación:", correlationError);
        }

        setStats({
          general: {
            habitCompletionRate: habitStats?.completion_rate || 0,
            avgMood: moodStats?.average_mood || 0,
            avgCaffeine: caffeineStats?.avg_daily_caffeine || 0,
            streakDays: habitStats?.longest_streak || 0
          },
          habits: habitStats,
          mood: moodStats,
          caffeine: caffeineStats,
          correlations: correlationStats
        });
      } catch (error) {
        console.error("Error al cargar estadísticas:", error);

        // En caso de error, establecer datos de ejemplo
        setStats({
          general: {
            habitCompletionRate: 78,
            avgMood: 7.2,
            avgCaffeine: 245,
            streakDays: 5
          },
          habits: null,
          mood: null,
          caffeine: null,
          correlations: null
        });
      } finally {
        setLoading(false);
      }
    };

    loadStats();
  }, [habits, period, selectedHabit]);

  // Cambiar el período de las estadísticas
  const handlePeriodChange = (newPeriod) => {
    setPeriod(newPeriod);
  };

  // Cambiar el hábito seleccionado
  const handleHabitChange = (habit) => {
    setSelectedHabit(habit);
  };

  // Obtener color para el gráfico
  const getColorForIndex = (index) => {
    const colors = [
      'var(--color-primary)',
      'var(--color-secondary)',
      'var(--color-success)',
      'var(--color-warning)',
      'var(--color-info)'
    ];
    return colors[index % colors.length];
  };

  // Formatear fecha
  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
  };

  // Función de utilidad para manejar valores posiblemente indefinidos
  const safeValue = (value, defaultValue = "N/A") => {
    return value !== undefined && value !== null ? value : defaultValue;
  };

  // Función para formatear números de forma segura
  const safeNumberFormat = (value, decimalPlaces = 1, defaultValue = "N/A") => {
    if (value === undefined || value === null) return defaultValue;
    if (typeof value !== 'number') return defaultValue;
    return value.toFixed(decimalPlaces);
  };

  return (
    <div className="stats-panel">
      <div className="bento-card-header">
        <h2 className="bento-card-title">Estadísticas y Tendencias</h2>

        <div className="stats-period-selector">
          <button
            className={`btn btn-sm ${period === 'week' ? 'btn-primary' : 'btn-text'}`}
            onClick={() => handlePeriodChange('week')}
          >
            Semana
          </button>

          <button
            className={`btn btn-sm ${period === 'month' ? 'btn-primary' : 'btn-text'}`}
            onClick={() => handlePeriodChange('month')}
          >
            Mes
          </button>

          <button
            className={`btn btn-sm ${period === 'year' ? 'btn-primary' : 'btn-text'}`}
            onClick={() => handlePeriodChange('year')}
          >
            Año
          </button>
        </div>
      </div>

      {/* Pestañas para cambiar entre diferentes vistas de estadísticas */}
      <div className="stats-tabs">
        <div
          className={`stats-tab ${activeTab === 'general' ? 'active' : ''}`}
          onClick={() => setActiveTab('general')}
        >
          General
        </div>

        <div
          className={`stats-tab ${activeTab === 'habits' ? 'active' : ''}`}
          onClick={() => setActiveTab('habits')}
        >
          Hábitos
        </div>

        <div
          className={`stats-tab ${activeTab === 'mood' ? 'active' : ''}`}
          onClick={() => setActiveTab('mood')}
        >
          Estado de ánimo
        </div>

        <div
          className={`stats-tab ${activeTab === 'caffeine' ? 'active' : ''}`}
          onClick={() => setActiveTab('caffeine')}
        >
          Cafeína
        </div>

        <div
          className={`stats-tab ${activeTab === 'correlations' ? 'active' : ''}`}
          onClick={() => setActiveTab('correlations')}
        >
          Correlaciones
        </div>
      </div>

      {loading ? (
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Cargando estadísticas...</p>
        </div>
      ) : (
        <div className="stats-content">
          {/* Contenido de la pestaña General */}
          {activeTab === 'general' && stats.general && (
            <div className="stats-grid">
              <div className="stats-item">
                <div className="stats-label">Tasa de completado</div>
                <div className="stats-value">{stats.general.habitCompletionRate}%</div>
                <div className="stats-trend up">
                  <svg className="stats-trend-icon" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline>
                    <polyline points="17 6 23 6 23 12"></polyline>
                  </svg>
                  5% vs anterior
                </div>
              </div>

              <div className="stats-item">
                <div className="stats-label">Estado de ánimo promedio</div>
                <div className="stats-value">{safeNumberFormat(stats.general.avgMood, 1)}/10</div>
                <div className="stats-trend up">
                  <svg className="stats-trend-icon" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline>
                    <polyline points="17 6 23 6 23 12"></polyline>
                  </svg>
                  0.3 vs anterior
                </div>
              </div>

              <div className="stats-item">
                <div className="stats-label">Cafeína diaria promedio</div>
                <div className="stats-value">{Math.round(stats.general.avgCaffeine)} mg</div>
                <div className="stats-trend down">
                  <svg className="stats-trend-icon" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="23 18 13.5 8.5 8.5 13.5 1 6"></polyline>
                    <polyline points="17 18 23 18 23 12"></polyline>
                  </svg>
                  15% vs anterior
                </div>
              </div>

              <div className="stats-item">
                <div className="stats-label">Racha actual</div>
                <div className="stats-value">{stats.general.streakDays} días</div>
                <div className="stats-trend neutral">
                  <svg className="stats-trend-icon" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="5" y1="12" x2="19" y2="12"></line>
                  </svg>
                  Igual que anterior
                </div>
              </div>
            </div>
          )}

          {/* Contenido de la pestaña Hábitos */}
          {activeTab === 'habits' && (
            <div className="habits-stats">
              <div className="habit-selector">
                {habits.filter(h => h.active).length > 0 ? (
                  habits.filter(h => h.active).map(habit => (
                    <button
                      key={habit.id}
                      className={`btn ${selectedHabit && selectedHabit.id === habit.id ? 'btn-primary' : 'btn-outline-primary'}`}
                      onClick={() => handleHabitChange(habit)}
                    >
                      {habit.name}
                    </button>
                  ))
                ) : (
                  <p className="empty-stats-message">No hay hábitos activos para mostrar estadísticas</p>
                )}
              </div>

              {selectedHabit ? (
                <div className="stats-grid">
                  <div className="stats-item">
                    <div className="stats-label">Hábito</div>
                    <div className="stats-value">{selectedHabit.name}</div>
                    <div className="stats-trend neutral">
                      Objetivo: {selectedHabit.goal || 'Completar'}
                    </div>
                  </div>

                  <div className="stats-item">
                    <div className="stats-label">Tasa de completado</div>
                    <div className="stats-value">{stats.habits?.completion_rate || 0}%</div>
                    <div className="completion-bar-container">
                      <div
                        className="completion-bar"
                        style={{ width: `${stats.habits?.completion_rate || 0}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="empty-stats-message">Selecciona un hábito para ver sus estadísticas detalladas</p>
              )}
            </div>
          )}

          {/* Contenido de la pestaña Estado de Ánimo */}
          {activeTab === 'mood' && (
            <div>
              {!stats.mood ? (
                <p className="empty-stats-message">No hay suficientes datos de estado de ánimo para mostrar estadísticas</p>
              ) : (
                <div className="stats-grid">
                  <div className="stats-item">
                    <div className="stats-label">Promedio</div>
                    <div className="stats-value">{safeNumberFormat(stats.mood?.average_mood, 1)}/10</div>
                    <div className="stats-trend neutral">
                      Basado en {safeValue(stats.mood?.total_entries, 0)} registros
                    </div>
                  </div>

                  <div className="stats-item">
                    <div className="stats-label">Mejor día</div>
                    <div className="stats-value">{safeValue(stats.mood?.best_mood)}/10</div>
                    <div className="stats-trend up">
                      {stats.mood?.best_mood_date ? formatDate(stats.mood.best_mood_date) : ""}
                    </div>
                  </div>

                  <div className="stats-item">
                    <div className="stats-label">Peor día</div>
                    <div className="stats-value">{safeValue(stats.mood?.worst_mood)}/10</div>
                    <div className="stats-trend down">
                      {stats.mood?.worst_mood_date ? formatDate(stats.mood.worst_mood_date) : ""}
                    </div>
                  </div>

                  <div className="stats-item">
                    <div className="stats-label">Tendencia</div>
                    <div className="stats-value">
                      {stats.mood?.trend === 'up' ? 'Mejorando' :
                       stats.mood?.trend === 'down' ? 'Empeorando' : 'Estable'}
                    </div>
                    <div className={`stats-trend ${stats.mood?.trend || 'neutral'}`}>
                      <svg className="stats-trend-icon" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        {stats.mood?.trend === 'up' ?
                          <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline> :
                         stats.mood?.trend === 'down' ?
                          <polyline points="23 18 13.5 8.5 8.5 13.5 1 6"></polyline> :
                          <line x1="5" y1="12" x2="19" y2="12"></line>
                        }
                      </svg>
                      Últimos {period === 'week' ? 7 : period === 'month' ? 30 : 365} días
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Contenido de la pestaña Cafeína */}
          {activeTab === 'caffeine' && (
            <div>
              {!stats.caffeine ? (
                <p className="empty-stats-message">No hay suficientes datos de cafeína para mostrar estadísticas</p>
              ) : (
                <div>
                  <div className="stats-grid">
                    <div className="stats-item">
                      <div className="stats-label">Consumo total</div>
                      <div className="stats-value">{safeValue(stats.caffeine.total_caffeine, 0)} mg</div>
                      <div className="stats-trend neutral">
                        {safeValue(stats.caffeine.total_intakes, 0)} ingestas en total
                      </div>
                    </div>

                    <div className="stats-item">
                      <div className="stats-label">Promedio diario</div>
                      <div className="stats-value">{Math.round(safeValue(stats.caffeine.avg_daily_caffeine, 0))} mg</div>
                      <div className="stats-trend neutral">
                        {safeValue(stats.caffeine.unique_days, 0)} días con registros
                      </div>
                    </div>

                    <div className="stats-item">
                      <div className="stats-label">Máximo diario</div>
                      <div className="stats-value">{safeValue(stats.caffeine.max_daily_caffeine, 0)} mg</div>
                      <div className="stats-trend down">
                        {stats.caffeine.max_daily_date ? formatDate(stats.caffeine.max_daily_date) : ""}
                      </div>
                    </div>

                    <div className="stats-item">
                      <div className="stats-label">Promedio por ingesta</div>
                      <div className="stats-value">{Math.round(safeValue(stats.caffeine.avg_caffeine_per_intake, 0))} mg</div>
                      <div className="stats-trend neutral">
                        Por cada consumo registrado
                      </div>
                    </div>
                  </div>

                  {stats.caffeine.common_beverages && stats.caffeine.common_beverages.length > 0 && (
                    <div className="caffeine-distribution" style={{ marginTop: 'var(--spacing-5)' }}>
                      <h3 style={{ fontSize: 'var(--font-size-md)', marginBottom: 'var(--spacing-3)' }}>
                        Distribución del consumo por tipo de bebida
                      </h3>

                      <div className="caffeine-chart">
                        {stats.caffeine.common_beverages.map((beverage, index) => (
                          <div key={index} className="chart-item" style={{ marginBottom: 'var(--spacing-3)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--spacing-1)' }}>
                              <span>{beverage.name}</span>
                              <span>{Math.round(safeValue(beverage.percent_of_total, 0))}% ({safeValue(beverage.total_caffeine, 0)} mg)</span>
                            </div>
                            <div style={{ height: '0.5rem', backgroundColor: 'var(--color-gray-200)', borderRadius: 'var(--border-radius-sm)', overflow: 'hidden' }}>
                              <div
                                style={{
                                  width: `${safeValue(beverage.percent_of_total, 0)}%`,
                                  height: '100%',
                                  backgroundColor: getColorForIndex(index),
                                  borderRadius: 'var(--border-radius-sm)'
                                }}
                              ></div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Contenido de la pestaña Correlaciones */}
          {activeTab === 'correlations' && (
            <div>
              {!stats.correlations ? (
                <p className="empty-stats-message">No hay suficientes datos para mostrar correlaciones entre cafeína y bienestar</p>
              ) : (
                <div>
                  <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-gray-600)', marginBottom: 'var(--spacing-4)' }}>
                    Análisis del impacto de la cafeína en tu bienestar basado en datos de los {stats.correlations.period}
                  </p>

                  <div className="stats-grid">
                    <div className="stats-item">
                      <div className="stats-label">Cafeína baja (&lt; {safeValue(stats.correlations.threshold_low)} mg)</div>
                      <div className="stats-value">
                        Estado de ánimo: {safeNumberFormat(stats.correlations.low_caffeine?.avg_mood_score, 1)}/10
                      </div>
                      <div className="stats-trend neutral">
                        Ansiedad: {safeNumberFormat(stats.correlations.low_caffeine?.avg_anxiety_level, 1)}/10 |
                        Energía: {safeNumberFormat(stats.correlations.low_caffeine?.avg_energy_level, 1)}/10
                      </div>
                    </div>

                    <div className="stats-item">
                      <div className="stats-label">Cafeína media ({safeValue(stats.correlations.threshold_low)}-{safeValue(stats.correlations.threshold_high)} mg)</div>
                      <div className="stats-value">
                        Estado de ánimo: {safeNumberFormat(stats.correlations.medium_caffeine?.avg_mood_score, 1)}/10
                      </div>
                      <div className="stats-trend neutral">
                        Ansiedad: {safeNumberFormat(stats.correlations.medium_caffeine?.avg_anxiety_level, 1)}/10 |
                        Energía: {safeNumberFormat(stats.correlations.medium_caffeine?.avg_energy_level, 1)}/10
                      </div>
                    </div>

                    <div className="stats-item">
                      <div className="stats-label">Cafeína alta (&gt; {safeValue(stats.correlations.threshold_high)} mg)</div>
                      <div className="stats-value">
                        Estado de ánimo: {safeNumberFormat(stats.correlations.high_caffeine?.avg_mood_score, 1)}/10
                      </div>
                      <div className="stats-trend neutral">
                        Ansiedad: {safeNumberFormat(stats.correlations.high_caffeine?.avg_anxiety_level, 1)}/10 |
                        Energía: {safeNumberFormat(stats.correlations.high_caffeine?.avg_energy_level, 1)}/10
                      </div>
                    </div>

                    <div className="stats-item">
                      <div className="stats-label">Observaciones clave</div>
                      <div style={{ fontSize: 'var(--font-size-sm)' }}>
                        {stats.correlations.medium_caffeine?.avg_mood_score > stats.correlations.low_caffeine?.avg_mood_score &&
                         stats.correlations.medium_caffeine?.avg_mood_score > stats.correlations.high_caffeine?.avg_mood_score ? (
                          <div style={{ marginBottom: 'var(--spacing-1)' }}>
                            • Tu estado de ánimo mejora con un consumo moderado de cafeína
                          </div>
                        ) : null}

                        {stats.correlations.high_caffeine?.avg_anxiety_level > stats.correlations.medium_caffeine?.avg_anxiety_level ? (
                          <div style={{ marginBottom: 'var(--spacing-1)' }}>
                            • La ansiedad aumenta con un consumo alto de cafeína
                          </div>
                        ) : null}

                        {stats.correlations.high_caffeine?.avg_energy_level > stats.correlations.low_caffeine?.avg_energy_level ? (
                          <div style={{ marginBottom: 'var(--spacing-1)' }}>
                            • Tu nivel de energía aumenta con el consumo de cafeína
                          </div>
                        ) : null}

                        {stats.correlations.high_caffeine?.avg_stress_level > stats.correlations.medium_caffeine?.avg_stress_level ? (
                          <div>
                            • El estrés aumenta con un consumo alto de cafeína
                          </div>
                        ) : null}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default StatsPanel;