// components/forms/CaffeineIntakeForm.jsx
import React, { useState, useEffect, useMemo, useImperativeHandle, forwardRef } from 'react';
import {FormSelect, FormInput} from '../ui'
/**
 * Formulario para registrar o editar la ingesta de cafeína
 */
const CaffeineIntakeForm = forwardRef(({
  beverages = [],
  initialData = null,
  onSubmit,
  isLoading = false,
  selectedDate = null // Añadido para recibir la fecha seleccionada
}, ref) => {
  // Estado del formulario
  const [formData, setFormData] = useState({
    beverageId: null,
    amount: 1,
    timestamp: ''
  });
  const [formError, setFormError] = useState('');
  const [selectedBeverage, setSelectedBeverage] = useState(null);

  // Exponer el método submit a través de la referencia
  useImperativeHandle(ref, () => ({
    submitForm: handleSubmit
  }));

  // Convertir beverages a formato de opciones para el FormSelect
  const beverageOptions = useMemo(() => {
    return beverages.map(beverage => ({
      value: beverage.id,
      label: `${beverage.name} (${beverage.caffeine_content} mg / ${beverage.standard_unit})`
    }));
  }, [beverages]);

  // Inicializar el formulario con los datos iniciales o valores por defecto
  useEffect(() => {
    if (initialData) {
      // Modo edición
      setFormData({
        beverageId: initialData.beverage_id,
        amount: initialData.amount,
        timestamp: initialData.timestamp // Ahora esto debería ser una cadena formateada correctamente
      });

      // Encontrar la bebida seleccionada
      const beverage = beverages.find(b => b.id === initialData.beverage_id);
      setSelectedBeverage(beverage || null);
    } else {
      // Modo creación - Usar la fecha seleccionada o la actual
      setDateTimeBasedOnSelection();

      // Establecer primera bebida como seleccionada si hay disponibles
      if (beverages.length > 0) {
        setFormData(prev => ({
          ...prev,
          beverageId: beverages[0].id
        }));
        setSelectedBeverage(beverages[0]);
      }
    }
  }, [initialData, beverages, selectedDate]);

  // Establecer la fecha y hora en base a la selección o usar fecha actual
  const setDateTimeBasedOnSelection = () => {
    // Usar la fecha seleccionada si está disponible, de lo contrario usar la fecha actual
    const dateToUse = selectedDate ? new Date(selectedDate) : new Date();

    // Mantener solo la hora actual
    const now = new Date();
    dateToUse.setHours(now.getHours());
    dateToUse.setMinutes(now.getMinutes());

    const year = dateToUse.getFullYear();
    const month = String(dateToUse.getMonth() + 1).padStart(2, '0');
    const day = String(dateToUse.getDate()).padStart(2, '0');
    const hours = String(dateToUse.getHours()).padStart(2, '0');
    const minutes = String(dateToUse.getMinutes()).padStart(2, '0');

    const formattedDateTime = `${year}-${month}-${day}T${hours}:${minutes}`;
    setFormData(prev => ({
      ...prev,
      timestamp: formattedDateTime
    }));
  };

  // Manejar cambio en el selector de bebida
  const handleBeverageChange = (e) => {
    const beverageId = parseInt(e.target.value);
    setFormData(prev => ({
      ...prev,
      beverageId
    }));

    // Actualizar la bebida seleccionada
    const beverage = beverages.find(b => b.id === beverageId);
    setSelectedBeverage(beverage || null);
  };

  // Manejar cambios en los inputs
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Manejar envío del formulario
  const handleSubmit = () => {
    // Validar formulario
    if (!formData.beverageId) {
      setFormError('Debe seleccionar una bebida');
      return;
    }

    if (formData.amount <= 0) {
      setFormError('La cantidad debe ser mayor que cero');
      return;
    }

    if (!formData.timestamp) {
      setFormError('Debe seleccionar una fecha y hora');
      return;
    }

    // Preparar datos a enviar
    const dataToSubmit = {
      timestamp: new Date(formData.timestamp).toISOString(),
      beverage_id: formData.beverageId,
      amount: parseFloat(formData.amount),
      unit: selectedBeverage?.standard_unit || ''
    };

    // Enviar el formulario
    onSubmit(dataToSubmit);
  };

  return (
    <div className="caffeine-intake-form">
      {formError && <div className="error-message mb-4">{formError}</div>}

      <FormSelect
        label="Bebida"
        name="beverageId"
        value={formData.beverageId || ''}
        onChange={handleBeverageChange}
        options={beverageOptions}
        disabled={isLoading}
        required
      />

      <FormInput
        label="Cantidad"
        name="amount"
        type="number"
        value={formData.amount}
        onChange={handleInputChange}
        min="0.1"
        step="0.1"
        disabled={isLoading}
        required
        helpText={`Unidad: ${selectedBeverage?.standard_unit || ''}`}
      />

      <FormInput
        label="Fecha y Hora"
        name="timestamp"
        type="datetime-local"
        value={formData.timestamp}
        onChange={handleInputChange}
        disabled={isLoading}
        required
      />
    </div>
  );
});

export default CaffeineIntakeForm;