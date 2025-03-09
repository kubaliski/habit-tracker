// components/ui/FormTextarea.jsx
import React from 'react';

/**
 * Componente reutilizable para áreas de texto de formulario
 * @param {Object} props - Propiedades del componente
 * @param {string} props.label - Etiqueta del campo
 * @param {string} props.name - Nombre del campo
 * @param {*} props.value - Valor actual
 * @param {Function} props.onChange - Función para manejar cambios
 * @param {string} props.placeholder - Texto de marcador de posición
 * @param {boolean} props.required - Si es obligatorio
 * @param {string} props.error - Mensaje de error
 * @param {string} props.helpText - Texto de ayuda
 * @param {boolean} props.disabled - Si está deshabilitado
 * @param {number} props.rows - Número de filas
 */
const FormTextarea = ({
  label,
  name,
  value,
  onChange,
  placeholder,
  required = false,
  error,
  helpText,
  disabled = false,
  rows = 3,
  className = '',
  ...rest
}) => {
  // Determinar clases CSS basadas en errores
  const textareaClass = `form-control ${error ? 'is-invalid' : ''} ${className}`;

  return (
    <div className="form-group">
      {label && (
        <label htmlFor={name} className="form-label">
          {label} {required && <span className="text-error">*</span>}
        </label>
      )}

      <textarea
        id={name}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className={textareaClass}
        required={required}
        disabled={disabled}
        rows={rows}
        {...rest}
      />

      {helpText && <div className="form-text">{helpText}</div>}
      {error && <div className="invalid-feedback">{error}</div>}
    </div>
  );
};

export default FormTextarea;