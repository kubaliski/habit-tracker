import { useState, useEffect } from 'react';
import { GetAppInfo } from "../wailsjs/go/main/App";
import { GetAllHabits } from "@api/HabitController";
import { GetAllMoodEntries } from "@api/MoodController";
import { GetCaffeineIntakeRange, GetDailyCaffeineTotal } from "@api/CaffeineController";

// Componentes del dashboard
import Header from './components/layout/Header';
import {DailySummary,HabitsPanel,CaffeinePanel,MoodPanel,CalendarPanel,StatsPanel, NotesWidget} from '@components/dashboard'

function App() {
  const [appInfo, setAppInfo] = useState({});
  const [date, setDate] = useState(new Date());
  const [loading, setLoading] = useState({
    app: true,
    habits: true,
    mood: true,
    caffeine: true
  });

  // Estados para los datos
  const [habits, setHabits] = useState([]);
  const [moodEntries, setMoodEntries] = useState([]);
  const [caffeineData, setCaffeineData] = useState({
    intakes: [],
    todayTotal: 0
  });

  useEffect(() => {
    console.log("[App] caffeineData actualizado:", caffeineData);
  }, [caffeineData]);

  // Formatear fecha actual para consultas (YYYY-MM-DD)
  const formattedDate = date.toISOString().split('T')[0];

  // Función para cargar hábitos
  const loadHabits = async () => {
    try {
      console.log("[App] Cargando hábitos...");
      setLoading(prev => ({ ...prev, habits: true }));

      const result = await GetAllHabits();
      setHabits(result || []);
      console.log("[App] Hábitos cargados:", result);
    } catch (err) {
      console.error("[App] Error loading habits:", err);
    } finally {
      setLoading(prev => ({ ...prev, habits: false }));
    }
  };

  // Función para cargar datos de cafeína
  const loadCaffeineData = async () => {
    try {
      console.log("[App] Iniciando carga de datos de cafeína...");
      setLoading(prev => ({ ...prev, caffeine: true }));

      // Cargar ingestas de cafeína (por defecto, últimos 7 días)
      const intakes = await GetCaffeineIntakeRange("", "");
      console.log("[App] Ingestas obtenidas:", intakes);

      // Cargar el total de hoy
      const todayData = await GetDailyCaffeineTotal(formattedDate);
      console.log("[App] Total de cafeína para hoy:", todayData, "Fecha:", formattedDate);

      setCaffeineData({
        intakes: intakes || [],
        todayTotal: todayData?.total_caffeine || 0
      });
      console.log("[App] Estado de cafeína actualizado con total:", todayData?.total_caffeine || 0);
    } catch (err) {
      console.error("[App] Error loading caffeine data:", err);
    } finally {
      setLoading(prev => ({ ...prev, caffeine: false }));
    }
  };

  // Cargar todos los datos iniciales
  useEffect(() => {
    // Cargar información de la aplicación
    GetAppInfo().then(info => {
      setAppInfo(info);
      setLoading(prev => ({ ...prev, app: false }));
    }).catch(err => {
      console.error("Error loading app info:", err);
      setLoading(prev => ({ ...prev, app: false }));
    });

    // Cargar los hábitos (ahora usando la función loadHabits)
    loadHabits();

    // Cargar entradas de estado de ánimo (último mes)
    const monthAgo = new Date();
    monthAgo.setDate(monthAgo.getDate() - 30);
    const startDate = monthAgo.toISOString().split('T')[0];

    GetAllMoodEntries(startDate, formattedDate).then(result => {
      setMoodEntries(result || []);
      setLoading(prev => ({ ...prev, mood: false }));
    }).catch(err => {
      console.error("Error loading mood entries:", err);
      setLoading(prev => ({ ...prev, mood: false }));
    });

    // Cargar datos de cafeína
    loadCaffeineData();
  }, [formattedDate]);

  // Manejar la creación de nuevas ingestas de cafeína
  const handleCaffeineIntakeCreated = async () => {
    // Recargar los datos de cafeína
    console.log("[App] Ingesta de cafeína creada, recargando datos...");
    await loadCaffeineData();
  };

  // Manejar la eliminación de ingestas de cafeína
  const handleCaffeineIntakeDeleted = async () => {
    // Recargar los datos de cafeína
    console.log("[App] Ingesta de cafeína eliminada, recargando datos...");
    await loadCaffeineData();
  };

  // Manejar la actualización de ingestas de cafeína
  const handleCaffeineIntakeUpdated = async () => {
    // Recargar los datos de cafeína
    console.log("[App] Ingesta de cafeína actualizada, recargando datos...");
    await loadCaffeineData();
  };

  // Determinar si todos los datos están cargados
  const isLoading = Object.values(loading).some(status => status);

  return (
    <div className="app-container">
      <Header appInfo={appInfo} />

      {isLoading ? (
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Cargando datos...</p>
        </div>
      ) : (
        <main className="container">
          <div className="bento-grid">
            {/* Resumen diario - 4 columnas */}
            <div className="bento-card span-4 row-1">
              <DailySummary
                date={date}
                habits={habits}
                todayCaffeine={caffeineData.todayTotal}
                moodEntries={moodEntries}
              />
            </div>

            {/* Panel de hábitos - 4 columnas, 2 filas */}
            <div className="bento-card span-4 row-2">
              <HabitsPanel
                habits={habits}
                date={date}
                onHabitCreated={loadHabits}
              />
            </div>

            {/* Panel de cafeína - 4 columnas */}
            <div className="bento-card span-4 row-1">
              <CaffeinePanel
                intakes={caffeineData.intakes}
                todayTotal={caffeineData.todayTotal}
                date={date}
                onIntakeCreated={handleCaffeineIntakeCreated}
                onIntakeDeleted={handleCaffeineIntakeDeleted}
                onIntakeUpdated={handleCaffeineIntakeUpdated}
              />
            </div>

            {/* Panel de estado de ánimo - 4 columnas, 2 filas */}
            <div className="bento-card span-4 row-2">
              <MoodPanel
                moodEntries={moodEntries}
                date={date}
              />
            </div>

            {/* Calendario de actividad - 4 columnas */}
            <div className="bento-card span-4 row-1">
              <CalendarPanel
                habits={habits}
                moodEntries={moodEntries}
                caffeineIntakes={caffeineData.intakes}
                date={date}
                onDateSelect={setDate}
              />
            </div>

            {/* Panel de estadísticas - 8 columnas */}
            <div className="bento-card span-8 row-1">
              <StatsPanel
                habits={habits}
                moodEntries={moodEntries}
                caffeineIntakes={caffeineData.intakes}
              />
            </div>

            {/* Widget de notas - 4 columnas */}
            <div className="bento-card span-4 row-1">
              <NotesWidget date={date} />
            </div>
          </div>
        </main>
      )}
    </div>
  );
}

export default App;