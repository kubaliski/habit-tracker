import { useState, useEffect } from 'react';
import { GetHabitStats } from "../../../wailsjs/go/api/StatsController";
import { GetMoodStats } from "../../../wailsjs/go/api/StatsController";
import { GetCaffeineStats } from "../../../wailsjs/go/api/StatsController";
import { GetCorrelationStats } from "../../../wailsjs/go/api/StatsController";

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
        }

        // Estadísticas de estado de ánimo
        const moodStats = await GetMoodStats(period);

        // Estadísticas de cafeína
        const caffeineStats = await GetCaffeineStats(period);

        // Estadísticas de correlación
        const correlationStats = await GetCorrelationStats();

        setStats({
          general: {
            habitCompletionRate: habitStats?.completion_rate || 0,
            avgMood: moodStats?.average_mood || 0,
            avgCaffeine: caffeineStats?.average_daily || 0,
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
  }, [habits, period]);

  // Cambiar el período de las estadísticas
  const handlePeriodChange = (newPeriod) => {
    setPeriod(newPeriod);
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
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline>
                    <polyline points="17 6 23 6 23 12"></polyline>
                  </svg>
                  5% vs anterior
                </div>
              </div>

              <div className="stats-item">
                <div className="stats-label">Estado de ánimo promedio</div>
                <div className="stats-value">{stats.general.avgMood.toFixed(1)}/10</div>
                <div className="stats-trend up">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline>
                    <polyline points="17 6 23 6 23 12"></polyline>
                  </svg>
                  0.3 vs anterior
                </div>
              </div>

              <div className="stats-item">
                <div className="stats-label">Cafeína diaria promedio</div>
                <div className="stats-value">{stats.general.avgCaffeine} mg</div>
                <div className="stats-trend down">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
              <p className="empty-stats-message">Selecciona un hábito para ver sus estadísticas detalladas</p>

              <div className="habit-selector">
                {habits.filter(h => h.active).map(habit => (
                  <button key={habit.id} className="btn btn-outline-primary">
                    {habit.name}
                  </button>
                ))}
              </div>

              <div className="placeholder-chart">
                <p>Aquí se mostrará el gráfico de progreso del hábito seleccionado</p>
              </div>
            </div>
          )}

          {/* Contenido de la pestaña Estado de Ánimo */}
          {activeTab === 'mood' && (
            <div className="mood-stats">
              <div className="mood-chart-placeholder">
                <p>Gráfico de evolución del estado de ánimo a lo largo del tiempo</p>
              </div>

              <div className="mood-factors-comparison">
                <h3>Factores que influyen en tu estado de ánimo</h3>
                <div className="placeholder-chart">
                  <p>Aquí se mostrará la relación entre energía, ansiedad y estrés</p>
                </div>
              </div>
            </div>
          )}

          {/* Contenido de la pestaña Cafeína */}
          {activeTab === 'caffeine' && (
            <div className="caffeine-stats">
              <div className="caffeine-chart-placeholder">
                <p>Consumo de cafeína a lo largo del tiempo</p>
              </div>

              <div className="caffeine-distribution">
                <h3>Distribución del consumo por tipo de bebida</h3>
                <div className="placeholder-chart">
                  <p>Aquí se mostrará un gráfico de distribución</p>
                </div>
              </div>
            </div>
          )}

          {/* Contenido de la pestaña Correlaciones */}
          {activeTab === 'correlations' && (
            <div className="correlations-stats">
              <p>Descubre cómo se relacionan tus hábitos, estado de ánimo y consumo de cafeína</p>

              <div className="correlation-findings">
                <div className="correlation-finding">
                  <h3>Cafeína vs. Estado de ánimo</h3>
                  <p>Los días con consumo moderado de cafeína (150-250mg) tienden a tener un estado de ánimo más positivo.</p>
                </div>

                <div className="correlation-finding">
                  <h3>Hábitos vs. Estado de ánimo</h3>
                  <p>Completar más del 70% de tus hábitos diarios se correlaciona con un aumento del 15% en tu puntuación de estado de ánimo.</p>
                </div>

                <div className="correlation-finding">
                  <h3>Cafeína vs. Ansiedad</h3>
                  <p>El consumo de más de 300mg de cafeína tiende a aumentar los niveles de ansiedad en un 25%.</p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default StatsPanel;