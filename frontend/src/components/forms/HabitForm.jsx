// components/forms/HabitForm.jsx
import React, { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import { FormTextArea, FormInput, FormSelect } from '../ui';

/**
 * Formulario para crear o editar hábitos
 */
const HabitForm = forwardRef(({
  initialData = null,
  onSubmit,
  isLoading = false
}, ref) => {
  // Estado del formulario
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: '',
    frequency: 'daily',
    goal: 1
  });
  const [formError, setFormError] = useState('');

  // Opciones para la frecuencia del hábito
  const frequencyOptions = [
    { value: 'daily', label: 'Diario' },
    { value: 'weekly', label: 'Semanal' },
    { value: 'monthly', label: 'Mensual' }
  ];

  // Exponer el método submit a través de la referencia
  useImperativeHandle(ref, () => ({
    submitForm: handleSubmit
  }));

  // Inicializar el formulario con los datos iniciales o valores por defecto
  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name || '',
        description: initialData.description || '',
        category: initialData.category || '',
        frequency: initialData.frequency || 'daily',
        goal: initialData.goal || 1
      });
    } else {
      // Restablecer a valores por defecto
      setFormData({
        name: '',
        description: '',
        category: '',
        frequency: 'daily',
        goal: 1
      });
    }
  }, [initialData]);

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
    if (!formData.name.trim()) {
      setFormError('El nombre es obligatorio');
      return;
    }

    if (!formData.frequency) {
      setFormError('La frecuencia es obligatoria');
      return;
    }

    if (formData.goal <= 0) {
      setFormError('La meta debe ser mayor que cero');
      return;
    }

    // Preparar datos a enviar
    const dataToSubmit = {
      name: formData.name.trim(),
      description: formData.description.trim(),
      category: formData.category.trim(),
      frequency: formData.frequency,
      goal: parseInt(formData.goal)
    };

    // Enviar el formulario
    onSubmit(dataToSubmit);
  };

  return (
    <div className="habit-form">
      {formError && <div className="error-message mb-4">{formError}</div>}

      <FormInput
        label="Nombre"
        name="name"
        value={formData.name}
        onChange={handleInputChange}
        placeholder="Ej: Beber agua"
        disabled={isLoading}
        required
      />

      <FormTextArea
        label="Descripción"
        name="description"
        value={formData.description}
        onChange={handleInputChange}
        placeholder="Descripción (opcional)"
        rows={3}
        disabled={isLoading}
      />

      <FormInput
        label="Categoría"
        name="category"
        value={formData.category}
        onChange={handleInputChange}
        placeholder="Ej: Salud, Productividad, etc."
        disabled={isLoading}
      />

      <FormSelect
        label="Frecuencia"
        name="frequency"
        value={formData.frequency}
        onChange={handleInputChange}
        options={frequencyOptions}
        disabled={isLoading}
        required
      />

      <FormInput
        label="Meta (veces)"
        name="goal"
        type="number"
        value={formData.goal}
        onChange={handleInputChange}
        min="1"
        disabled={isLoading}
        required
      />
    </div>
  );
});

export default HabitForm;