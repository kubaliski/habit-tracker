// components/ui/FormInput.jsx
import React from 'react';

/**
 * Componente reutilizable para inputs de formulario
 * @param {Object} props - Propiedades del componente
 * @param {string} props.label - Etiqueta del campo
 * @param {string} props.name - Nombre del campo (para identificarlo en el formulario)
 * @param {string} props.type - Tipo de input (text, number, email, password, date, etc.)
 * @param {*} props.value - Valor actual del campo
 * @param {Function} props.onChange - Función a ejecutar cuando cambia el valor
 * @param {string} props.placeholder - Texto de marcador de posición
 * @param {boolean} props.required - Si el campo es obligatorio
 * @param {string} props.error - Mensaje de error a mostrar
 * @param {string} props.helpText - Texto de ayuda a mostrar
 * @param {boolean} props.disabled - Si el campo está deshabilitado
 * @param {Object} props.validation - Reglas de validación (min, max, pattern, etc.)
 */
const FormInput = ({
  label,
  name,
  type = 'text',
  value,
  onChange,
  placeholder,
  required = false,
  error,
  helpText,
  disabled = false,
  className = '',
  validation = {},
  ...rest
}) => {
  // Determinar clases CSS basadas en errores
  const inputClass = `form-control ${error ? 'is-invalid' : ''} ${className}`;

  return (
    <div className="form-group">
      {label && (
        <label htmlFor={name} className="form-label">
          {label} {required && <span className="text-error">*</span>}
        </label>
      )}

      <input
        id={name}
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className={inputClass}
        required={required}
        disabled={disabled}
        {...validation}
        {...rest}
      />

      {helpText && <div className="form-text">{helpText}</div>}
      {error && <div className="invalid-feedback">{error}</div>}
    </div>
  );
};

export default FormInput;