const icons = {
  success: '✓',
  danger: '!',
  info: 'i',
  warning: '⚠',
};

const Alert = ({ type = 'info', children }) => (
  <div className={`alert alert-${type}`}>
    <strong>{icons[type]}</strong>
    <span>{children}</span>
  </div>
);

export default Alert;
