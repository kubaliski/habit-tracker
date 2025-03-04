import { useState, useMemo, useEffect } from 'react';
import { GetAllCaffeineBeverages, CreateCaffeineIntake, DeleteCaffeineIntake, UpdateCaffeineIntake } from "../../../wailsjs/go/api/CaffeineController";

function CaffeinePanel({ intakes, todayTotal, date, onIntakeCreated, onIntakeDeleted, onIntakeUpdated }) {
  const [beverages, setBeverages] = useState([]);
  const [selectedBeverage, setSelectedBeverage] = useState(null);
  const [amount, setAmount] = useState(1);
  const [isAddingIntake, setIsAddingIntake] = useState(false);
  const [isEditingIntake, setIsEditingIntake] = useState(false);
  const [editingIntakeId, setEditingIntakeId] = useState(null);
  const [intakeDateTime, setIntakeDateTime] = useState('');
  const [loading, setLoading] = useState(false);

  // Convertir fecha a formato string YYYY-MM-DD para comparaciones
  const dateString = useMemo(() => {
    return date.toISOString().split('T')[0];
  }, [date]);

  // Inicializar la fecha y hora actual para el selector
  useEffect(() => {
    setCurrentDateTime();
  }, []);

  // Función para establecer la fecha y hora actual en el formato requerido por input datetime-local
  const setCurrentDateTime = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');

    const formattedDateTime = `${year}-${month}-${day}T${hours}:${minutes}`;
    setIntakeDateTime(formattedDateTime);
  };

  // Cargar las bebidas disponibles
  useEffect(() => {
    const loadBeverages = async () => {
      try {
        const result = await GetAllCaffeineBeverages(false);
        setBeverages(result || []);
        if (result && result.length > 0) {
          setSelectedBeverage(result[0]);
        }
      } catch (error) {
        console.error("Error al cargar bebidas:", error);
      }
    };

    loadBeverages();
  }, []);

  // Filtrar intakes para el día actual
  const todayIntakes = useMemo(() => {
    if (!intakes || intakes.length === 0) return [];

    return intakes.filter(intake => {
      if (!intake.timestamp) return false;
      const intakeDate = new Date(intake.timestamp);
      return intakeDate.toISOString().split('T')[0] === dateString;
    }).sort((a, b) => {
      return new Date(b.timestamp) - new Date(a.timestamp);
    });
  }, [intakes, dateString]);

  // Calcular el porcentaje de cafeína consumido (límite recomendado: 400mg)
  const caffeinePercentage = useMemo(() => {
    const limit = 400; // 400mg es el límite diario recomendado
    return Math.min(Math.round((todayTotal / limit) * 100), 100);
  }, [todayTotal]);

  // Determinar el color de la barra de progreso según el porcentaje
  const caffeineBarClass = useMemo(() => {
    if (caffeinePercentage >= 90) return 'caffeine-limit-bar danger';
    if (caffeinePercentage >= 75) return 'caffeine-limit-bar warning';
    return 'caffeine-limit-bar';
  }, [caffeinePercentage]);

  // Función para mostrar/ocultar el formulario de registro
  const toggleAddIntakeForm = () => {
    if (isEditingIntake) {
      setIsEditingIntake(false);
      setEditingIntakeId(null);
    }

    setIsAddingIntake(prev => !prev);

    if (!isAddingIntake) {
      // Si estamos abriendo el formulario, resetear los valores
      setAmount(1);
      if (beverages && beverages.length > 0) {
        setSelectedBeverage(beverages[0]);
      }
      setCurrentDateTime();
    }
  };

  // Función para editar una ingesta existente
  const handleEditIntake = (intake) => {
    // Buscar la bebida correspondiente
    const beverage = beverages.find(b => b.id === intake.beverage_id);
    if (beverage) {
      setSelectedBeverage(beverage);
    }

    // Establecer cantidad
    setAmount(intake.amount);

    // Formatear fecha y hora para el input datetime-local
    const intakeDate = new Date(intake.timestamp);
    const year = intakeDate.getFullYear();
    const month = String(intakeDate.getMonth() + 1).padStart(2, '0');
    const day = String(intakeDate.getDate()).padStart(2, '0');
    const hours = String(intakeDate.getHours()).padStart(2, '0');
    const minutes = String(intakeDate.getMinutes()).padStart(2, '0');

    const formattedDateTime = `${year}-${month}-${day}T${hours}:${minutes}`;
    setIntakeDateTime(formattedDateTime);

    // Guardar el ID de la ingesta que estamos editando
    setEditingIntakeId(intake.id);

    // Mostrar el formulario en modo edición
    setIsEditingIntake(true);
    setIsAddingIntake(false);
  };

  // Función para cambiar la bebida seleccionada
  const handleBeverageChange = (event) => {
    const beverageId = parseInt(event.target.value);
    const beverage = beverages.find(b => b.id === beverageId);
    setSelectedBeverage(beverage);
  };

  // Función para enviar el registro de consumo
  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!selectedBeverage) return;

    setLoading(true);

    try {
      // Obtener la fecha y hora seleccionada o usar la actual
      let timestamp;
      if (intakeDateTime) {
        timestamp = new Date(intakeDateTime).toISOString();
      } else {
        timestamp = new Date().toISOString();
      }

      if (isEditingIntake) {
        // Actualizar una ingesta existente
        const updateData = {
          timestamp: timestamp,
          beverage_id: selectedBeverage.id,
          amount: amount,
          unit: selectedBeverage.standard_unit
        };

        await UpdateCaffeineIntake(editingIntakeId, updateData);

        // Limpiar formulario y ocultar
        setAmount(1);
        setIsEditingIntake(false);
        setEditingIntakeId(null);

        // Notificar al componente padre que se ha actualizado una ingesta
        if (onIntakeUpdated && typeof onIntakeUpdated === 'function') {
          onIntakeUpdated(editingIntakeId);
        }
      } else {
        // Crear una nueva ingesta
        const intakeData = {
          timestamp: timestamp,
          beverage_id: selectedBeverage.id,
          amount: amount,
          unit: selectedBeverage.standard_unit
        };

        const newIntake = await CreateCaffeineIntake(intakeData);

        // Limpiar formulario y ocultar
        setAmount(1);
        setIsAddingIntake(false);

        // Notificar al componente padre que se ha creado una nueva ingesta
        if (onIntakeCreated && typeof onIntakeCreated === 'function') {
          onIntakeCreated(newIntake);
        }
      }
    } catch (error) {
      console.error("Error al registrar consumo:", error);
    } finally {
      setLoading(false);
    }
  };

  // Función para eliminar una ingesta de cafeína
  const handleDeleteIntake = async (intakeId) => {
    if (!window.confirm('¿Estás seguro de que quieres eliminar este registro?')) {
      return;
    }

    setLoading(true);
    try {
      await DeleteCaffeineIntake(intakeId);

      // Notificar al componente padre que se ha eliminado una ingesta
      if (onIntakeDeleted && typeof onIntakeDeleted === 'function') {
        onIntakeDeleted(intakeId);
      }
    } catch (error) {
      console.error("Error al eliminar el registro:", error);
    } finally {
      setLoading(false);
    }
  };

  // Formatear la hora de un timestamp
  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="caffeine-panel">
      <div className="bento-card-header">
        <h2 className="bento-card-title">Consumo de Cafeína</h2>
        <div className="bento-card-actions">
          <button
            className="btn btn-icon"
            onClick={toggleAddIntakeForm}
            title="Registrar consumo"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
          </button>
        </div>
      </div>

      <div className="caffeine-today">
        <div className="caffeine-icon">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 8h1a4 4 0 0 1 0 8h-1"></path>
            <path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"></path>
            <line x1="6" y1="1" x2="6" y2="4"></line>
            <line x1="10" y1="1" x2="10" y2="4"></line>
            <line x1="14" y1="1" x2="14" y2="4"></line>
          </svg>
        </div>

        <div className="caffeine-info">
          <div className="caffeine-total">{Math.round(todayTotal)} mg</div>
          <div className="caffeine-label">de cafeína hoy</div>

          <div className="caffeine-limit">
            <div
              className={caffeineBarClass}
              style={{ width: `${caffeinePercentage}%` }}
            ></div>
          </div>
        </div>
      </div>

      {(isAddingIntake || isEditingIntake) && (
        <div className="caffeine-add-form">
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Bebida</label>
              <select
                className="form-control"
                onChange={handleBeverageChange}
                value={selectedBeverage?.id || ''}
                disabled={loading}
              >
                {beverages.map(beverage => (
                  <option key={beverage.id} value={beverage.id}>
                    {beverage.name} ({beverage.caffeine_content} mg / {beverage.standard_unit})
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Cantidad</label>
              <input
                type="number"
                className="form-control"
                min="0.1"
                step="0.1"
                value={amount}
                onChange={(e) => setAmount(parseFloat(e.target.value))}
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Fecha y Hora</label>
              <input
                type="datetime-local"
                className="form-control"
                value={intakeDateTime}
                onChange={(e) => setIntakeDateTime(e.target.value)}
                disabled={loading}
              />
            </div>

            <div className="form-buttons">
              <button
                type="button"
                className="btn btn-text"
                onClick={isEditingIntake ? () => setIsEditingIntake(false) : toggleAddIntakeForm}
                disabled={loading}
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={loading || !selectedBeverage}
              >
                {loading ? 'Guardando...' : isEditingIntake ? 'Actualizar' : 'Guardar'}
              </button>
            </div>
          </form>
        </div>
      )}

      {todayIntakes.length > 0 && (
        <div className="caffeine-log">
          <div className="caffeine-log-title">Registros de hoy</div>
          {todayIntakes.slice(0, 3).map(intake => (
            <div key={intake.id} className="caffeine-log-item">
              <div className="caffeine-log-time">{formatTime(intake.timestamp)}</div>
              <div className="caffeine-log-beverage">{intake.beverage_name}</div>
              <div className="caffeine-log-amount">{intake.total_caffeine} mg</div>
              <div className="caffeine-log-actions">
                <button
                  className="btn btn-icon btn-sm"
                  onClick={() => handleEditIntake(intake)}
                  disabled={loading || isEditingIntake || isAddingIntake}
                  title="Editar registro"
                  style={{ color: 'var(--color-primary)' }}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path>
                  </svg>
                </button>
                <button
                  className="btn btn-icon btn-sm"
                  onClick={() => handleDeleteIntake(intake.id)}
                  disabled={loading}
                  title="Eliminar registro"
                  style={{ color: 'var(--color-error)' }}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 6h18"></path>
                    <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"></path>
                    <line x1="10" y1="11" x2="10" y2="17"></line>
                    <line x1="14" y1="11" x2="14" y2="17"></line>
                  </svg>
                </button>
              </div>
            </div>
          ))}
          {todayIntakes.length > 3 && (
            <div className="caffeine-log-more">
              +{todayIntakes.length - 3} más
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default CaffeinePanel;