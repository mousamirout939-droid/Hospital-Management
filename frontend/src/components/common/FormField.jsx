const FormField = ({
  label,
  name,
  type = 'text',
  value,
  onChange,
  error,
  required = false,
  placeholder,
  as = 'input',
  options = [],
  hint,
  rows,
  min,
  max,
  step,
  disabled = false,
  ...rest
}) => {
  const inputId = `field-${name}`;

  return (
    <div className="field-group">
      {label && (
        <label htmlFor={inputId} className="field-label">
          {label}
          {required && <span className="required">*</span>}
        </label>
      )}

      {as === 'select' ? (
        <select
          id={inputId}
          name={name}
          value={value}
          onChange={onChange}
          className="field-select"
          disabled={disabled}
          {...rest}
        >
          <option value="">{placeholder || 'Select an option'}</option>
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      ) : as === 'textarea' ? (
        <textarea
          id={inputId}
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className="field-textarea"
          rows={rows || 4}
          disabled={disabled}
          {...rest}
        />
      ) : (
        <input
          id={inputId}
          type={type}
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className="field-input"
          min={min}
          max={max}
          step={step}
          disabled={disabled}
          {...rest}
        />
      )}

      {error && <span className="field-error">{error}</span>}
      {!error && hint && <span className="field-hint">{hint}</span>}
    </div>
  );
};

export default FormField;
