const Button = ({
  children,
  variant = 'primary',
  size,
  loading = false,
  disabled = false,
  block = false,
  type = 'button',
  onClick,
  className = '',
  ...rest
}) => {
  const classes = [
    'btn',
    `btn-${variant}`,
    size ? `btn-${size}` : '',
    block ? 'btn-block' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <button type={type} className={classes} disabled={disabled || loading} onClick={onClick} {...rest}>
      {loading ? <span className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} /> : null}
      {children}
    </button>
  );
};

export default Button;
