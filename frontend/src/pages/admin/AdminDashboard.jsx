import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { dashboardService } from '../../services/dashboardService';
import { userService } from '../../services/userService';
import { extractErrorMessage } from '../../services/api';
import StatCard from '../../components/common/StatCard';
import LoadingScreen from '../../components/common/LoadingScreen';
import Badge from '../../components/common/Badge';
import EmptyState from '../../components/common/EmptyState';
import Alert from '../../components/common/Alert';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import FormField from '../../components/common/FormField';
import AdminDashboardCharts from '../../components/admin/AdminDashboardCharts';
import { formatCurrency } from '../../utils/formatters';
import { IconUsers, IconDoctor, IconCalendar, IconReceipt, IconFlask, IconPill } from '../../components/common/Icons';

const AdminDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showStaffForm, setShowStaffForm] = useState(false);
  const [savingStaff, setSavingStaff] = useState(false);
  const [staffFeedback, setStaffFeedback] = useState('');
  const [staff, setStaff] = useState({ name: '', email: '', password: '', role: 'receptionist' });

  useEffect(() => {
    const load = async () => {
      try {
        const res = await dashboardService.getAdminDashboard();
        setData(res.data.data);
      } catch (loadError) {
        setError(extractErrorMessage(loadError));
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const createStaff = async (event) => {
    event.preventDefault();
    setSavingStaff(true);
    setError('');
    setStaffFeedback('');
    try {
      await userService.createStaff(staff);
      setShowStaffForm(false);
      setStaff({ name: '', email: '', password: '', role: 'receptionist' });
      setStaffFeedback('Staff account created. Share the login credentials securely with the staff member.');
    } catch (saveError) {
      setError(extractErrorMessage(saveError));
    } finally {
      setSavingStaff(false);
    }
  };

  if (loading) return <LoadingScreen message="Loading admin dashboard…" />;

  return (
    <div>
      {error && <Alert type="danger">{error}</Alert>}
      {staffFeedback && <Alert type="success">{staffFeedback}</Alert>}

      <div className="dashboard-welcome-row">
        <div>
          <h2>Hospital overview</h2>
          <p className="text-faint">Performance snapshot across patients, appointments, and collections.</p>
        </div>
        <Button variant="primary" onClick={() => setShowStaffForm(true)}>Add staff account</Button>
      </div>

      <div className="stat-grid">
        <StatCard icon={IconUsers} label="Total Patients" value={data?.totalPatients ?? 0} tone="primary" />
        <StatCard icon={IconCalendar} label="Today's Appointments" value={data?.todaysAppointments ?? 0} tone="info" />
        <StatCard icon={IconReceipt} label="Today's Revenue" value={formatCurrency(data?.todaysRevenue)} tone="accent" />
        <StatCard
          icon={IconDoctor}
          label="Occupied Beds"
          value={data?.bedOccupancy == null ? '—' : `${data.bedOccupancy}%`}
          tone="warning"
        />
      </div>
      <div className="dashboard-secondary-stats">
        <span>{data?.totalDoctors ?? 0} active doctors</span>
        <span>{formatCurrency(data?.totalRevenue)} total paid revenue</span>
        <span>{data?.totalAppointments ?? 0} appointments all time</span>
      </div>

      <AdminDashboardCharts
        charts={data?.charts}
        bedOccupancyUnavailableReason={data?.bedOccupancyUnavailableReason}
      />

      <div className="dashboard-grid admin-dashboard-lower">
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

      {showStaffForm && (
        <Modal title="Create staff account" onClose={() => setShowStaffForm(false)}>
          <form onSubmit={createStaff}>
            <FormField label="Full name" name="name" value={staff.name} onChange={(event) => setStaff({ ...staff, name: event.target.value })} required />
            <FormField label="Email" name="email" type="email" value={staff.email} onChange={(event) => setStaff({ ...staff, email: event.target.value })} required />
            <FormField
              label="Temporary password"
              name="password"
              type="password"
              value={staff.password}
              onChange={(event) => setStaff({ ...staff, password: event.target.value })}
              hint="At least 8 characters. Share it securely; staff can reset it after signing in."
              required
              minLength={8}
            />
            <FormField
              label="Role"
              name="role"
              as="select"
              value={staff.role}
              onChange={(event) => setStaff({ ...staff, role: event.target.value })}
              options={[
                { value: 'receptionist', label: 'Receptionist' },
                { value: 'pharmacist', label: 'Pharmacist' },
                { value: 'lab-technician', label: 'Lab Technician' },
              ]}
            />
            <div className="modal-footer">
              <Button variant="secondary" type="button" onClick={() => setShowStaffForm(false)}>Cancel</Button>
              <Button variant="primary" type="submit" loading={savingStaff}>Create account</Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

export default AdminDashboard;
