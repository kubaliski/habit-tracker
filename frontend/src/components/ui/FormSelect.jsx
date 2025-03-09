// components/ui/FormSelect.jsx
import React from 'react';

/**
 * Componente reutilizable para selects de formulario
 * @param {Object} props - Propiedades del componente
 * @param {string} props.label - Etiqueta del campo
 * @param {string} props.name - Nombre del campo
 * @param {*} props.value - Valor seleccionado actualmente
 * @param {Function} props.onChange - Función para manejar cambios
 * @param {Array} props.options - Opciones para el select [{value, label}]
 * @param {boolean} props.required - Si el campo es obligatorio
 * @param {string} props.error - Mensaje de error
 * @param {string} props.helpText - Texto de ayuda
 * @param {boolean} props.disabled - Si el campo está deshabilitado
 */
const FormSelect = ({
  label,
  name,
  value,
  onChange,
  options = [],
  required = false,
  error,
  helpText,
  disabled = false,
  className = '',
  ...rest
}) => {
  // Determinar clases CSS basadas en errores
  const selectClass = `form-control ${error ? 'is-invalid' : ''} ${className}`;

  return (
    <div className="form-group">
      {label && (
        <label htmlFor={name} className="form-label">
          {label} {required && <span className="text-error">*</span>}
        </label>
      )}

      <select
        id={name}
        name={name}
        value={value}
        onChange={onChange}
        className={selectClass}
        required={required}
        disabled={disabled}
        {...rest}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>

      {helpText && <div className="form-text">{helpText}</div>}
      {error && <div className="invalid-feedback">{error}</div>}
    </div>
  );
};

export default FormSelect;