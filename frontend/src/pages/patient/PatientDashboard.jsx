import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { dashboardService } from '../../services/dashboardService';
import { useAuth } from '../../context/AuthContext';
import StatCard from '../../components/common/StatCard';
import LoadingScreen from '../../components/common/LoadingScreen';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import { formatDate } from '../../utils/formatters';
import { IconCalendar, IconPill, IconFlask, IconReceipt, IconDoctor, IconClock } from '../../components/common/Icons';

const PatientDashboard = () => {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await dashboardService.getPatientDashboard();
        setData(res.data.data);
      } catch (error) {
        // handled by global interceptor / fallback UI below
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) return <LoadingScreen message="Loading your dashboard…" />;

  return (
    <div>
      <div className="card" style={{ marginBottom: 24, background: 'var(--color-primary-light)', border: 'none' }}>
        <h2 style={{ marginBottom: 4 }}>Welcome back, {user?.name?.split(' ')[0]}</h2>
        <p className="text-soft">Here's a quick look at your health activity.</p>
      </div>

      <div className="stat-grid">
        <StatCard icon={IconCalendar} label="Upcoming Appointments" value={data?.upcomingAppointments ?? 0} tone="primary" />
        <StatCard icon={IconPill} label="Active Prescriptions" value={data?.activePrescriptions ?? 0} tone="accent" />
        <StatCard icon={IconFlask} label="Pending Lab Reports" value={data?.pendingLabReports ?? 0} tone="info" />
        <StatCard icon={IconReceipt} label="Unpaid Invoices" value={data?.unpaidInvoices ?? 0} tone="warning" />
      </div>

      <div className="dashboard-grid">
        <div className="card">
          <div className="section-title-row">
            <h3 className="card-title">Next Appointment</h3>
            <Link to="/patient/appointments" style={{ fontSize: '0.85rem' }}>
              View all
            </Link>
          </div>

          {data?.nextAppointment ? (
            <div className="appt-item">
              <div className="appt-date-block">
                <span className="appt-date-day">{new Date(data.nextAppointment.appointmentDate).getDate()}</span>
                <span className="appt-date-month">
                  {new Date(data.nextAppointment.appointmentDate).toLocaleDateString('en-US', { month: 'short' })}
                </span>
              </div>
              <div className="appt-info">
                <div className="appt-doctor-name">Dr. {data.nextAppointment.doctor?.name}</div>
                <div className="appt-meta">
                  {data.nextAppointment.doctor?.specialization} • {data.nextAppointment.timeSlot}
                </div>
              </div>
              <Badge status={data.nextAppointment.status} />
            </div>
          ) : (
            <div className="empty-state" style={{ padding: '32px 16px' }}>
              <IconClock width={32} height={32} style={{ margin: '0 auto 12px', color: 'var(--color-ink-faint)' }} />
              <h4>No upcoming appointments</h4>
              <p style={{ marginBottom: 16 }}>Book a visit with one of our specialists.</p>
              <Link to="/patient/find-doctors">
                <Button variant="primary" size="sm">
                  Find a Doctor
                </Button>
              </Link>
            </div>
          )}
        </div>

        <div className="card">
          <h3 className="card-title" style={{ marginBottom: 16 }}>
            Quick Actions
          </h3>
          <div className="flex-col gap-3">
            <Link to="/patient/find-doctors">
              <Button variant="secondary" block>
                <IconDoctor width={16} height={16} /> Book New Appointment
              </Button>
            </Link>
            <Link to="/patient/prescriptions">
              <Button variant="secondary" block>
                <IconPill width={16} height={16} /> View Prescriptions
              </Button>
            </Link>
            <Link to="/patient/lab-reports">
              <Button variant="secondary" block>
                <IconFlask width={16} height={16} /> Check Lab Reports
              </Button>
            </Link>
            <Link to="/patient/billing">
              <Button variant="secondary" block>
                <IconReceipt width={16} height={16} /> View Billing History
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PatientDashboard;
