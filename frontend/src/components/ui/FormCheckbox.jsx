// components/ui/FormCheckbox.jsx
import React from 'react';

/**
 * Componente reutilizable para checkboxes de formulario
 * @param {Object} props - Propiedades del componente
 * @param {string} props.label - Etiqueta del checkbox
 * @param {string} props.name - Nombre del campo
 * @param {boolean} props.checked - Estado de selección
 * @param {Function} props.onChange - Función para manejar cambios
 * @param {boolean} props.required - Si es obligatorio
 * @param {string} props.error - Mensaje de error
 * @param {string} props.helpText - Texto de ayuda
 * @param {boolean} props.disabled - Si está deshabilitado
 */
const FormCheckbox = ({
  label,
  name,
  checked,
  onChange,
  required = false,
  error,
  helpText,
  disabled = false,
  className = '',
  ...rest
}) => {
  return (
    <div className="form-group">
      <div className="form-check">
        <label className="custom-checkbox">
          <input
            type="checkbox"
            id={name}
            name={name}
            checked={checked}
            onChange={onChange}
            required={required}
            disabled={disabled}
            className={className}
            {...rest}
          />
          <span className="checkmark"></span>
          {label} {required && <span className="text-error">*</span>}
        </label>
      </div>

      {helpText && <div className="form-text">{helpText}</div>}
      {error && <div className="invalid-feedback">{error}</div>}
    </div>
  );
};

export default FormCheckbox;