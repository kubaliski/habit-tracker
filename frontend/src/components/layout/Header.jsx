import { useState } from 'react';
import logo from '../../assets/images/logo-universal.png';
import SettingsModal from '../settings/SettingsModal';

function Header({ appInfo, onDataCleared }) {
  const [currentDate] = useState(new Date());
  const [showSettingsModal, setShowSettingsModal] = useState(false);

  // Formato de fecha para mostrar
  const dateOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
  const formattedDate = currentDate.toLocaleDateString('es-ES', dateOptions);

  // Manejador para abrir el modal de configuración
  const handleOpenSettings = () => {
    setShowSettingsModal(true);
  };

  // Manejador para cerrar el modal de configuración
  const handleCloseSettings = () => {
    setShowSettingsModal(false);
  };

  return (
    <>
      <header className="header-container">
        <div className="bento-card header-card">
          <div className="header-content">
            <div className="header-logo">
              <img src={logo} alt={appInfo.name || 'Habit Tracker'} />
              <h1>{appInfo.name || 'Habit Tracker'}</h1>
            </div>

            <div className="header-middle">
              <span className="header-date">{formattedDate}</span>
            </div>

            <div className="header-nav">
              <button className="btn btn-icon">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="12" y1="16" x2="12" y2="12"></line>
                  <line x1="12" y1="8" x2="12" y2="8"></line>
                </svg>
              </button>

              <button className="btn btn-icon">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                  <circle cx="12" cy="7" r="4"></circle>
                </svg>
              </button>

              <button
                className="btn btn-icon"
                onClick={handleOpenSettings}
                aria-label="Configuración"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="3"></circle>
                  <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
                </svg>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Modal de configuración */}
      <SettingsModal
        isOpen={showSettingsModal}
        onClose={handleCloseSettings}
        onDataCleared={onDataCleared}
      />
    </>
  );
}

export default Header;