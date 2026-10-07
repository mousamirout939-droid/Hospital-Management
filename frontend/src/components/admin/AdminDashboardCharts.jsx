import { formatCurrency } from '../../utils/formatters';

const VerticalBars = ({ data = [], formatValue = (value) => value.toLocaleString() }) => {
  const maxValue = Math.max(...data.map((item) => item.value), 0);

  return (
    <div className="dashboard-chart-bars">
      {data.map((item) => (
        <div className="dashboard-chart-column" key={item.key || item.label}>
          <span className="dashboard-chart-value">{formatValue(item.value)}</span>
          <div
            className="dashboard-chart-bar-track"
            title={`${item.label}: ${formatValue(item.value)}`}
          >
            <div
              className="dashboard-chart-bar"
              style={{ height: `${maxValue ? Math.max((item.value / maxValue) * 100, 3) : 3}%` }}
            />
          </div>
          <span className="dashboard-chart-label">{item.label}</span>
        </div>
      ))}
    </div>
  );
};

const DepartmentBars = ({ data = [] }) => {
  const maxValue = Math.max(...data.map((item) => item.value), 0);

  if (data.length === 0) return <p className="text-faint">No appointment data for this period.</p>;

  return (
    <div className="dashboard-department-bars">
      {data.map((item) => (
        <div className="dashboard-department-row" key={item.label}>
          <span title={item.label}>{item.label}</span>
          <div className="dashboard-department-track">
            <div
              className="dashboard-department-bar"
              style={{ width: `${maxValue ? Math.max((item.value / maxValue) * 100, 2) : 2}%` }}
            />
          </div>
          <strong>{item.value}</strong>
        </div>
      ))}
    </div>
  );
};

const ChartCard = ({ title, subtitle, children }) => (
  <section className="card dashboard-chart-card">
    <div className="dashboard-chart-heading">
      <h3 className="card-title">{title}</h3>
      {subtitle && <p className="text-faint">{subtitle}</p>}
    </div>
    {children}
  </section>
);

const AdminDashboardCharts = ({ charts, bedOccupancyUnavailableReason }) => (
  <div className="admin-dashboard-charts">
    <ChartCard title="Patient growth" subtitle="New patient accounts · last 6 months">
      <VerticalBars data={charts?.patientGrowth} />
    </ChartCard>
    <ChartCard title="Revenue" subtitle="Payments collected · last 6 months">
      <VerticalBars data={charts?.revenue} formatValue={formatCurrency} />
    </ChartCard>
    <ChartCard title="Department performance" subtitle="Appointments · last 6 months">
      <DepartmentBars data={charts?.departmentPerformance} />
    </ChartCard>
    <ChartCard title="Appointment trends" subtitle="Appointments per day · last 7 days">
      <VerticalBars data={charts?.appointmentTrends} />
    </ChartCard>
    <ChartCard title="Bed occupancy">
      <div className="dashboard-chart-unavailable">
        <strong>Not configured</strong>
        <p>{bedOccupancyUnavailableReason}</p>
      </div>
    </ChartCard>
  </div>
);

export default AdminDashboardCharts;
