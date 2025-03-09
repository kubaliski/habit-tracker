// hooks/useFormValidation.js
import { useState, useCallback } from 'react';

/**
 * Hook para manejo y validación de formularios
 * @param {Object} initialValues - Valores iniciales del formulario
 * @param {Object} validationRules - Reglas de validación
 * @returns {Object} - Métodos y estados para manejar el formulario
 */
const useFormValidation = (initialValues = {}, validationRules = {}) => {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  // Función para manejar cambios en los campos
  const handleChange = useCallback((e) => {
    const { name, value, type, checked } = e.target;
    const fieldValue = type === 'checkbox' ? checked : value;

    setValues(prev => ({
      ...prev,
      [name]: fieldValue
    }));

    // Validar el campo al cambiar su valor
    validateField(name, fieldValue);
  }, []);

  // Función para marcar un campo como tocado
  const handleBlur = useCallback((e) => {
    const { name } = e.target;

    setTouched(prev => ({
      ...prev,
      [name]: true
    }));

    // Validar el campo al perder el foco
    validateField(name, values[name]);
  }, [values]);

  // Función para validar un campo específico
  const validateField = useCallback((name, value) => {
    const rules = validationRules[name];
    if (!rules) return;

    let fieldError = '';

    // Regla: required
    if (rules.required && (!value || value === '')) {
      fieldError = rules.requiredMessage || 'Este campo es obligatorio';
    }

    // Regla: min (mínimo de caracteres o valor numérico)
    else if (rules.min !== undefined && (typeof value === 'string' ? value.length : value) < rules.min) {
      fieldError = rules.minMessage || `El valor mínimo es ${rules.min}`;
    }

    // Regla: max (máximo de caracteres o valor numérico)
    else if (rules.max !== undefined && (typeof value === 'string' ? value.length : value) > rules.max) {
      fieldError = rules.maxMessage || `El valor máximo es ${rules.max}`;
    }

    // Regla: pattern (expresión regular)
    else if (rules.pattern && !rules.pattern.test(value)) {
      fieldError = rules.patternMessage || 'El formato no es válido';
    }

    // Regla: función de validación personalizada
    else if (rules.validate && typeof rules.validate === 'function') {
      const validationResult = rules.validate(value, values);
      if (validationResult) {
        fieldError = validationResult;
      }
    }

    setErrors(prev => ({
      ...prev,
      [name]: fieldError
    }));

    return !fieldError;
  }, [validationRules, values]);

  // Validar todo el formulario
  const validateForm = useCallback(() => {
    let isValid = true;
    const newErrors = {};
    const newTouched = {};

    Object.keys(validationRules).forEach(field => {
      newTouched[field] = true;
      const fieldIsValid = validateField(field, values[field]);
      if (!fieldIsValid) {
        isValid = false;
      }
    });

    setTouched(newTouched);
    return isValid;
  }, [validateField, validationRules, values]);

  // Reiniciar el formulario
  const resetForm = useCallback(() => {
    setValues(initialValues);
    setErrors({});
    setTouched({});
  }, [initialValues]);

  // Establecer valores programáticamente
  const setFieldValue = useCallback((field, value) => {
    setValues(prev => ({
      ...prev,
      [field]: value
    }));
  }, []);

  return {
    values,
    errors,
    touched,
    handleChange,
    handleBlur,
    validateForm,
    resetForm,
    setFieldValue,
    setValues
  };
};

export default useFormValidation;