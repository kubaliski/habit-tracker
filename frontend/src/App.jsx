import { useState, useEffect } from 'react';
import logo from './assets/images/logo-universal.png';
import './App.css';
import { GetAppInfo } from "../wailsjs/go/main/App";
import { GetAllHabits } from "../wailsjs/go/api/HabitController";

function App() {
  const [appInfo, setAppInfo] = useState({});
  const [habits, setHabits] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Cargar información de la aplicación
    GetAppInfo().then(info => {
      setAppInfo(info);
    });

    // Cargar los hábitos
    GetAllHabits().then(result => {
      setHabits(result || []);
      setLoading(false);
    }).catch(err => {
      console.error("Error loading habits:", err);
      setLoading(false);
    });
  }, []);

  return (
    <div id="App">
      <div className="logo-container">
        <img src={logo} className="logo" alt="logo" />
      </div>
      <div className="result">
        <h2>{appInfo.name || 'Habit Tracker'}</h2>
        <p>Version: {appInfo.version || '1.0.0'}</p>
        <p>{appInfo.description || 'Loading...'}</p>
      </div>

      <div className="result">
        <h3>Mis Hábitos</h3>
        {loading ? (
          <p>Cargando hábitos...</p>
        ) : habits.length === 0 ? (
          <p>No hay hábitos registrados. ¡Agrega uno nuevo!</p>
        ) : (
          <ul className="habits-list">
            {habits.map(habit => (
              <li key={habit.id}>
                {habit.name} - {habit.active ? 'Activo' : 'Inactivo'}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

export default App;