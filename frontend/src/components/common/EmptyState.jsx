const EmptyState = ({ title = 'Nothing here yet', message, action }) => (
  <div className="empty-state">
    <h3>{title}</h3>
    {message && <p>{message}</p>}
    {action}
  </div>
);

export default EmptyState;
