const StatCard = ({ icon: Icon, label, value, tone = 'primary' }) => (
  <div className="stat-card">
    <div className={`stat-card-icon icon-tone-${tone}`}>
      <Icon width={20} height={20} />
    </div>
    <div className="stat-card-value">{value}</div>
    <div className="stat-card-label">{label}</div>
  </div>
);

export default StatCard;
