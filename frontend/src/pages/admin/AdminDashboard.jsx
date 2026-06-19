import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { dashboardService } from '../../services/dashboardService';
import StatCard from '../../components/common/StatCard';
import LoadingScreen from '../../components/common/LoadingScreen';
import Badge from '../../components/common/Badge';
import EmptyState from '../../components/common/EmptyState';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { IconUsers, IconDoctor, IconCalendar, IconReceipt, IconFlask, IconPill } from '../../components/common/Icons';

const AdminDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await dashboardService.getAdminDashboard();
        setData(res.data.data);
      } catch (error) {
        // ignore, fallback UI handles missing data
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) return <LoadingScreen message="Loading admin dashboard…" />;

  return (
    <div>
      <div className="stat-grid">
        <StatCard icon={IconUsers} label="Total Patients" value={data?.totalPatients ?? 0} tone="primary" />
        <StatCard icon={IconDoctor} label="Active Doctors" value={data?.totalDoctors ?? 0} tone="info" />
        <StatCard icon={IconCalendar} label="Today's Appointments" value={data?.todaysAppointments ?? 0} tone="accent" />
        <StatCard icon={IconReceipt} label="Total Revenue" value={formatCurrency(data?.totalRevenue)} tone="warning" />
      </div>

      <div className="dashboard-grid">
        <div className="card">
          <div className="section-title-row">
            <h3 className="card-title">Recent Appointments</h3>
            <Link to="/admin/appointments" style={{ fontSize: '0.85rem' }}>
              View all
            </Link>
          </div>

          {data?.recentAppointments?.length > 0 ? (
            data.recentAppointments.map((appt) => (
              <div key={appt._id} className="appt-item">
                <div className="appt-date-block">
                  <span className="appt-date-day">{new Date(appt.appointmentDate).getDate()}</span>
                  <span className="appt-date-month">
                    {new Date(appt.appointmentDate).toLocaleDateString('en-US', { month: 'short' })}
                  </span>
                </div>
                <div className="appt-info">
                  <div className="appt-doctor-name">{appt.patient?.name}</div>
                  <div className="appt-meta">
                    with Dr. {appt.doctor?.name} • {appt.timeSlot}
                  </div>
                </div>
                <Badge status={appt.status} />
              </div>
            ))
          ) : (
            <EmptyState title="No recent appointments" />
          )}
        </div>

        <div className="card">
          <h3 className="card-title" style={{ marginBottom: 16 }}>
            Action Items
          </h3>
          <div className="flex-col gap-3">
            <Link to="/admin/appointments" className="appt-item" style={{ textDecoration: 'none' }}>
              <div className="stat-card-icon icon-tone-warning" style={{ width: 40, height: 40, marginBottom: 0 }}>
                <IconCalendar width={18} height={18} />
              </div>
              <div className="appt-info">
                <div className="appt-doctor-name">{data?.pendingAppointments ?? 0} pending appointments</div>
                <div className="appt-meta">Awaiting confirmation</div>
              </div>
            </Link>
            <Link to="/admin/lab-reports" className="appt-item" style={{ textDecoration: 'none' }}>
              <div className="stat-card-icon icon-tone-info" style={{ width: 40, height: 40, marginBottom: 0 }}>
                <IconFlask width={18} height={18} />
              </div>
              <div className="appt-info">
                <div className="appt-doctor-name">{data?.pendingLabReports ?? 0} lab reports pending</div>
                <div className="appt-meta">Need results uploaded</div>
              </div>
            </Link>
            <Link to="/admin/prescriptions" className="appt-item" style={{ textDecoration: 'none' }}>
              <div className="stat-card-icon icon-tone-primary" style={{ width: 40, height: 40, marginBottom: 0 }}>
                <IconPill width={18} height={18} />
              </div>
              <div className="appt-info">
                <div className="appt-doctor-name">{data?.activePrescriptions ?? 0} active prescriptions</div>
                <div className="appt-meta">Currently being fulfilled</div>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
