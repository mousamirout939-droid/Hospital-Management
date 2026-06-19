import { statusToBadgeClass, capitalize } from '../../utils/formatters';

const Badge = ({ status, children }) => {
  const className = statusToBadgeClass(status);
  return (
    <span className={`badge ${className}`}>
      <span className="badge-dot" />
      {children || capitalize(status?.replace('-', ' ') || '')}
    </span>
  );
};

export default Badge;
