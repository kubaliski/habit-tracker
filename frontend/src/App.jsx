import { useState, useEffect, useCallback } from 'react';
import { GetAppInfo } from "../wailsjs/go/main/App";
import { GetAllHabits } from "@api/HabitController";
import { GetAllMoodEntries } from "@api/MoodController";
import { GetCaffeineIntakeRange, GetCaffeineIntakeByDay, GetDailyCaffeineTotal } from "@api/CaffeineController";

// Componentes del dashboard
import Header from './components/layout/Header';
import {DailySummary,HabitsPanel,CaffeinePanel,MoodPanel,CalendarPanel,StatsPanel, NotesWidget} from '@components/dashboard'

function App() {
  const [appInfo, setAppInfo] = useState({});
  // Inicializar fecha con hora a mediodía para evitar problemas de zona horaria
  const [date, setDate] = useState(() => {
    const today = new Date();
    today.setHours(12, 0, 0, 0);
    return today;
  });
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
    todayTotal: 0,
    selectedDayTotal: 0,
    selectedDayIntakes: [] // Para las ingestas del día seleccionado
  });

  useEffect(() => {
    console.log("[App] caffeineData actualizado:", caffeineData);
  }, [caffeineData]);

  // Función mejorada para formatear fecha a formato local YYYY-MM-DD
  const formatDateToLocalString = useCallback((dateInput) => {
    if (!dateInput) return '';

    try {
      const year = dateInput.getFullYear();
      const month = String(dateInput.getMonth() + 1).padStart(2, '0');
      const day = String(dateInput.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    } catch (e) {
      console.error("Error formateando fecha:", e);
      return '';
    }
  }, []);

  const formattedDate = formatDateToLocalString(date);

  // Obtener fecha de hoy (para el panel diario)
  const today = new Date();
  today.setHours(12, 0, 0, 0);
  const todayFormatted = formatDateToLocalString(today);

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

  // Función para cargar entradas de estado de ánimo
  const loadMoodEntries = async () => {
    try {
      console.log("[App] Cargando entradas de estado de ánimo...");
      setLoading(prev => ({ ...prev, mood: true }));

      const monthAgo = new Date();
      monthAgo.setDate(monthAgo.getDate() - 30);
      const startDate = formatDateToLocalString(monthAgo);
      const endDate = formatDateToLocalString(new Date());

      console.log("[App] Solicitando entradas de estado de ánimo desde", startDate, "hasta", endDate);
      const result = await GetAllMoodEntries(startDate, endDate);
      setMoodEntries(result || []);
      console.log("[App] Entradas de estado de ánimo cargadas:", result);
    } catch (err) {
      console.error("[App] Error loading mood entries:", err);
    } finally {
      setLoading(prev => ({ ...prev, mood: false }));
    }
  };

  // Función para cargar datos de cafeína
  const loadCaffeineData = async () => {
    try {
      console.log("[App] Iniciando carga de datos de cafeína...");
      setLoading(prev => ({ ...prev, caffeine: true }));

      // 1. Cargar ingestas de cafeína (últimos 30 días para calendario)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const startDate = formatDateToLocalString(thirtyDaysAgo);
      const endDate = formatDateToLocalString(new Date());

      const intakes = await GetCaffeineIntakeRange(startDate, endDate);
      console.log("[App] Ingestas obtenidas:", intakes);

      // 2. Cargar el total de cafeína para hoy (para resumen diario)
      const todayTotal = await GetDailyCaffeineTotal(todayFormatted);
      console.log("[App] Total de cafeína para hoy:", todayTotal, "Fecha:", todayFormatted);

      // 3. Obtener las ingestas del día seleccionado (para el panel de cafeína)
      const selectedDayIntakes = await GetCaffeineIntakeByDay(formattedDate);
      console.log("[App] Ingestas para el día seleccionado:", selectedDayIntakes, "Fecha:", formattedDate);

      // 4. Obtener el total del día seleccionado
      const selectedDayTotal = await GetDailyCaffeineTotal(formattedDate);
      console.log("[App] Total de cafeína para día seleccionado:", selectedDayTotal, "Fecha:", formattedDate);

      setCaffeineData({
        intakes: intakes || [],
        todayTotal: todayTotal?.total_caffeine || 0,
        selectedDayTotal: selectedDayTotal?.total_caffeine || 0,
        selectedDayIntakes: selectedDayIntakes || []
      });
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

    // Cargar los hábitos
    loadHabits();

    // Cargar entradas de estado de ánimo
    loadMoodEntries();

    // Cargar datos de cafeína
    loadCaffeineData();
  }, [formattedDate, formatDateToLocalString]); // Recarga cuando cambia la fecha seleccionada

  // Manejador para cuando se selecciona una fecha en el calendario
  const handleDateSelect = (newDate) => {
    // Asegurar que la hora se establece a mediodía
    newDate.setHours(12, 0, 0, 0);
    setDate(newDate);
    console.log("[App] Nueva fecha seleccionada:", newDate, "Formato local:", formatDateToLocalString(newDate));
  };

  // Manejar la creación de nuevas ingestas de cafeína
  const handleCaffeineIntakeCreated = async () => {
    console.log("[App] Ingesta de cafeína creada, recargando datos...");
    await loadCaffeineData();
  };

  // Manejar la eliminación de ingestas de cafeína
  const handleCaffeineIntakeDeleted = async () => {
    console.log("[App] Ingesta de cafeína eliminada, recargando datos...");
    await loadCaffeineData();
  };

  // Manejar la actualización de ingestas de cafeína
  const handleCaffeineIntakeUpdated = async () => {
    console.log("[App] Ingesta de cafeína actualizada, recargando datos...");
    await loadCaffeineData();
  };

  // Determinar si todos los datos están cargados
  const isLoading = Object.values(loading).some(status => status);

  // Determinar si la fecha seleccionada es hoy
  const isToday = formattedDate === todayFormatted;

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
            <div className="bento-card span-12 row-1">
              <DailySummary
                date={date}
                habits={habits}
                todayCaffeine={isToday ? caffeineData.todayTotal : caffeineData.selectedDayTotal}
                moodEntries={moodEntries}
              />
            </div>

            {/* Panel de hábitos - 4 columnas, 2 filas */}
            <div className="bento-card span-4 row-1">
              <HabitsPanel
                habits={habits}
                date={date}
                onHabitCreated={loadHabits}
              />
            </div>

            {/* Panel de cafeína - 4 columnas */}
            <div className="bento-card span-4 row-1">
              <CaffeinePanel
                intakes={caffeineData.selectedDayIntakes} // Usar las ingestas del día seleccionado
                todayTotal={isToday ? caffeineData.todayTotal : caffeineData.selectedDayTotal}
                date={date}
                onIntakeCreated={handleCaffeineIntakeCreated}
                onIntakeDeleted={handleCaffeineIntakeDeleted}
                onIntakeUpdated={handleCaffeineIntakeUpdated}
              />
            </div>

            {/* Panel de estado de ánimo - 4 columnas, 2 filas */}
            <div className="bento-card span-4 row-1">
              <MoodPanel
                moodEntries={moodEntries}
                date={date}
                onMoodEntryChange={loadMoodEntries}
              />
            </div>

            {/* Calendario de actividad - 4 columnas */}
            <div className="bento-card span-4 row-1">
              <CalendarPanel
                habits={habits}
                moodEntries={moodEntries}
                caffeineIntakes={caffeineData.intakes}
                date={date}
                onDateSelect={handleDateSelect}
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
          </div>
        </main>
      )}
    </div>
  );
}

export default App;