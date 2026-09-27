import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { dashboardService } from '../../services/dashboardService';
import StatCard from '../../components/common/StatCard';
import LoadingScreen from '../../components/common/LoadingScreen';
import Badge from '../../components/common/Badge';
import EmptyState from '../../components/common/EmptyState';
import { formatDate } from '../../utils/formatters';
import { IconCalendar, IconFile, IconPill, IconUsers } from '../../components/common/Icons';

const DoctorDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await dashboardService.getAdminDashboard();
        setData(res.data.data);
      } catch (error) {
        setData({
          todaysAppointments: 0,
          pendingAppointments: 0,
          recentAppointments: [],
          activePrescriptions: 0,
          totalPatients: 0,
        });
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) return <LoadingScreen message="Loading doctor dashboard…" />;

  return (
    <div>
      <div className="stat-grid">
        <StatCard icon={IconCalendar} label="Today's Appointments" value={data?.todaysAppointments ?? 0} tone="primary" />
        <StatCard icon={IconUsers} label="Pending Reviews" value={data?.pendingAppointments ?? 0} tone="accent" />
        <StatCard icon={IconFile} label="Records Added" value={data?.totalPatients ?? 0} tone="info" />
        <StatCard icon={IconPill} label="Active Prescriptions" value={data?.activePrescriptions ?? 0} tone="warning" />
      </div>

      <div className="dashboard-grid">
        <div className="card">
          <div className="section-title-row">
            <h3 className="card-title">Recent Appointments</h3>
            <Link to="/doctor/appointments" style={{ fontSize: '0.85rem' }}>
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
                  <div className="appt-meta">{appt.timeSlot} • {appt.reasonForVisit || 'Consultation'}</div>
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
            Quick Actions
          </h3>
          <div className="flex-col gap-3">
            <Link to="/doctor/appointments" className="btn btn-secondary" style={{ textDecoration: 'none', display: 'inline-block', textAlign: 'center' }}>
              Review Appointments
            </Link>
            <Link to="/doctor/medical-records" className="btn btn-secondary" style={{ textDecoration: 'none', display: 'inline-block', textAlign: 'center' }}>
              Add Medical Record
            </Link>
            <Link to="/doctor/prescriptions" className="btn btn-secondary" style={{ textDecoration: 'none', display: 'inline-block', textAlign: 'center' }}>
              Issue Prescription
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DoctorDashboard;
