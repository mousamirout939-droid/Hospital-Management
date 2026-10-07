import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { dashboardService } from '../../services/dashboardService';
import { appointmentService } from '../../services/appointmentService';
import { prescriptionService } from '../../services/prescriptionService';
import { labReportService } from '../../services/labReportService';
import { userService } from '../../services/userService';
import { extractErrorMessage } from '../../services/api';
import Alert from '../../components/common/Alert';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import EmptyState from '../../components/common/EmptyState';
import FormField from '../../components/common/FormField';
import LoadingScreen from '../../components/common/LoadingScreen';
import Modal from '../../components/common/Modal';
import StatCard from '../../components/common/StatCard';
import { formatDate } from '../../utils/formatters';
import { IconCalendar, IconFlask, IconPill, IconReceipt, IconSearch, IconUsers } from '../../components/common/Icons';

const roleDetails = {
  doctor: { title: 'Doctor dashboard', endpoint: 'doctor' },
  receptionist: { title: 'Reception dashboard', endpoint: 'receptionist' },
  pharmacist: { title: 'Pharmacy dashboard', endpoint: 'pharmacist' },
  'lab-technician': { title: 'Laboratory dashboard', endpoint: 'lab-technician' },
};

const greeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
};

const StaffDashboard = ({ role }) => {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState('');
  const [search, setSearch] = useState('');
  const [patients, setPatients] = useState([]);
  const [searching, setSearching] = useState(false);
  const [patientModalOpen, setPatientModalOpen] = useState(false);
  const [creatingPatient, setCreatingPatient] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [patientForm, setPatientForm] = useState({ name: '', email: '', phone: '', password: '' });

  const loadDashboard = useCallback(async (showLoader = false) => {
    if (showLoader) setLoading(true);
    setError('');
    try {
      const response = await dashboardService.getStaffDashboard(roleDetails[role].endpoint);
      setData(response.data.data);
    } catch (loadError) {
      setError(extractErrorMessage(loadError));
    } finally {
      setLoading(false);
    }
  }, [role]);

  useEffect(() => {
    loadDashboard(true);
  }, [loadDashboard]);

  useEffect(() => {
    if (role !== 'receptionist' || search.trim().length < 2) {
      setPatients([]);
      return undefined;
    }
    let active = true;
    const timer = window.setTimeout(async () => {
      setSearching(true);
      try {
        const response = await userService.searchPatients(search.trim());
        if (active) setPatients(response.data.data);
      } catch (searchError) {
        if (active) setError(extractErrorMessage(searchError));
      } finally {
        if (active) setSearching(false);
      }
    }, 250);

    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [role, search]);

  const performAction = async (id, action) => {
    setBusyId(id);
    setError('');
    try {
      await action();
      await loadDashboard();
    } catch (actionError) {
      setError(extractErrorMessage(actionError));
    } finally {
      setBusyId('');
    }
  };

  const registerPatient = async (event) => {
    event.preventDefault();
    setCreatingPatient(true);
    setError('');
    try {
      await userService.createPatient(patientForm);
      setPatientModalOpen(false);
      setPatientForm({ name: '', email: '', phone: '', password: '' });
      setFeedback('Patient account created. Share the temporary login details securely with the patient.');
      await loadDashboard();
    } catch (createError) {
      setError(extractErrorMessage(createError));
    } finally {
      setCreatingPatient(false);
    }
  };

  if (loading) return <LoadingScreen message={`Loading ${roleDetails[role].title.toLowerCase()}…`} />;

  const displayName = user?.name?.replace(/^Dr\.?\s*/i, '') || user?.name;

  return (
    <div className="staff-dashboard">
      {error && <Alert type="danger">{error}</Alert>}
      {feedback && <Alert type="success">{feedback}</Alert>}

      <div className="dashboard-welcome-row">
        <div>
          {role === 'doctor' ? (
            <>
              <h2>{greeting()}, Dr. {displayName}</h2>
              <p className="text-faint">Your clinic schedule and patient care for today.</p>
            </>
          ) : (
            <>
              <h2>{roleDetails[role].title}</h2>
              <p className="text-faint">Your team’s work queue and today’s priorities.</p>
            </>
          )}
        </div>
        {role === 'receptionist' && (
          <Button variant="primary" onClick={() => setPatientModalOpen(true)}>Register patient</Button>
        )}
      </div>

      {role === 'doctor' && (
        <>
          <div className="stat-grid">
            <StatCard icon={IconCalendar} label="Today's Appointments" value={data?.todaysAppointments ?? 0} tone="primary" />
            <StatCard icon={IconUsers} label="Waiting Patients" value={data?.waitingPatients ?? 0} tone="accent" />
            <StatCard icon={IconReceipt} label="Completed" value={data?.completedAppointments ?? 0} tone="info" />
          </div>
          <QueueCard title="Upcoming appointments">
            {data?.upcomingAppointments?.length ? data.upcomingAppointments.map((appointment) => (
              <QueueRow
                key={appointment._id}
                title={appointment.patient?.name || 'Patient'}
                detail={`${appointment.timeSlot} · ${appointment.patient?.phone || 'No phone on file'}`}
                badge={<Badge status={appointment.status} />}
              />
            )) : <EmptyState title="No appointments scheduled" message="Your upcoming patient visits will appear here." />}
          </QueueCard>
        </>
      )}

      {role === 'receptionist' && (
        <>
          <div className="stat-grid">
            <StatCard icon={IconCalendar} label="Today's Appointments" value={data?.todaysAppointments ?? 0} tone="primary" />
            <StatCard icon={IconUsers} label="Waiting Queue" value={data?.waitingPatients ?? 0} tone="accent" />
            <StatCard icon={IconReceipt} label="Outstanding Invoices" value={data?.unpaidInvoices ?? 0} tone="warning" />
            <StatCard icon={IconUsers} label="Registered Patients" value={data?.totalPatients ?? 0} tone="info" />
          </div>
          <section className="card staff-search-card">
            <h3 className="card-title">Patient search</h3>
            <div className="staff-search-input">
              <IconSearch width={18} height={18} />
              <input
                className="field-input"
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search by patient name, email, or phone"
                aria-label="Search patients"
              />
            </div>
            {search.trim().length >= 2 && (
              <div className="staff-search-results">
                {searching ? <p className="text-faint">Searching…</p> : patients.length ? patients.map((patient) => (
                  <QueueRow key={patient._id} title={patient.name} detail={`${patient.email} · ${patient.phone || 'No phone on file'}`} />
                )) : <p className="text-faint">No matching patients.</p>}
              </div>
            )}
          </section>
          <QueueCard title="Today's appointment queue">
            {data?.queue?.length ? data.queue.map((appointment) => (
              <QueueRow
                key={appointment._id}
                title={`#${appointment.tokenNumber || '—'} · ${appointment.patient?.name || 'Patient'}`}
                detail={`${appointment.timeSlot} · Dr. ${appointment.doctor?.name || 'Unassigned'}`}
                badge={<Badge status={appointment.status} />}
                action={appointment.status === 'pending' ? (
                  <Button
                    size="sm"
                    variant="outline"
                    loading={busyId === appointment._id}
                    onClick={() => performAction(appointment._id, () => appointmentService.updateStatus(appointment._id, { status: 'confirmed' }))}
                  >
                    Confirm
                  </Button>
                ) : null}
              />
            )) : <EmptyState title="The queue is clear" message="Today's waiting appointments will appear here." />}
          </QueueCard>
        </>
      )}

      {role === 'pharmacist' && (
        <>
          <div className="stat-grid">
            <StatCard icon={IconPill} label="Prescriptions to Dispense" value={data?.activePrescriptions ?? 0} tone="primary" />
            <StatCard icon={IconReceipt} label="Dispensed Today" value={data?.dispensedToday ?? 0} tone="info" />
            <StatCard icon={IconFlask} label="Inventory" value={data?.inventoryConfigured ? 'Ready' : 'Not configured'} tone="warning" />
          </div>
          <div className="card staff-info-card">
            <h3 className="card-title">Inventory tracking</h3>
            <p className="text-faint">{data?.inventoryMessage}</p>
          </div>
          <QueueCard title="Prescription dispensing queue">
            {data?.queue?.length ? data.queue.map((prescription) => (
              <QueueRow
                key={prescription._id}
                title={prescription.patient?.name || 'Patient'}
                detail={`${prescription.medicines.map((medicine) => `${medicine.medicineName} (${medicine.dosage})`).join(', ')} · Dr. ${prescription.doctor?.name || '—'}`}
                action={(
                  <Button
                    size="sm"
                    variant="primary"
                    loading={busyId === prescription._id}
                    onClick={() => performAction(prescription._id, () => prescriptionService.updateStatus(prescription._id, { status: 'fulfilled' }))}
                  >
                    Mark dispensed
                  </Button>
                )}
              />
            )) : <EmptyState title="No prescriptions awaiting dispensing" />}
          </QueueCard>
        </>
      )}

      {role === 'lab-technician' && (
        <>
          <div className="stat-grid">
            <StatCard icon={IconFlask} label="Pending Tests" value={data?.pendingTests ?? 0} tone="warning" />
            <StatCard icon={IconReceipt} label="In Progress" value={data?.inProgressTests ?? 0} tone="accent" />
            <StatCard icon={IconUsers} label="Completed Reports" value={data?.completedTests ?? 0} tone="primary" />
          </div>
          <QueueCard title="Test orders and samples">
            {data?.queue?.length ? data.queue.map((report) => (
              <QueueRow
                key={report._id}
                title={report.testName}
                detail={`${report.patient?.name || 'Patient'} · ${formatDate(report.reportDate)}${report.doctor?.name ? ` · Dr. ${report.doctor.name}` : ''}`}
                badge={<Badge status={report.status} />}
                action={report.status === 'pending' ? (
                  <Button
                    size="sm"
                    variant="outline"
                    loading={busyId === report._id}
                    onClick={() => performAction(report._id, () => labReportService.update(report._id, { status: 'in-progress' }))}
                  >
                    Start
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    variant="primary"
                    loading={busyId === report._id}
                    onClick={() => performAction(report._id, () => labReportService.update(report._id, { status: 'completed' }))}
                  >
                    Complete
                  </Button>
                )}
              />
            )) : <EmptyState title="No pending test orders" message="New samples and orders will appear here." />}
          </QueueCard>
        </>
      )}

      {patientModalOpen && (
        <Modal title="Register patient" onClose={() => setPatientModalOpen(false)}>
          <form onSubmit={registerPatient}>
            <FormField label="Full name" name="name" value={patientForm.name} onChange={(event) => setPatientForm({ ...patientForm, name: event.target.value })} required />
            <FormField label="Email" name="email" type="email" value={patientForm.email} onChange={(event) => setPatientForm({ ...patientForm, email: event.target.value })} required />
            <FormField label="Phone" name="phone" type="tel" value={patientForm.phone} onChange={(event) => setPatientForm({ ...patientForm, phone: event.target.value })} />
            <FormField label="Temporary password" name="password" type="password" value={patientForm.password} onChange={(event) => setPatientForm({ ...patientForm, password: event.target.value })} hint="At least 8 characters. Share login details securely." required minLength={8} />
            <div className="modal-footer">
              <Button variant="secondary" type="button" onClick={() => setPatientModalOpen(false)}>Cancel</Button>
              <Button variant="primary" type="submit" loading={creatingPatient}>Create patient account</Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

const QueueCard = ({ title, children }) => (
  <section className="card staff-queue-card">
    <h3 className="card-title">{title}</h3>
    <div className="staff-queue-list">{children}</div>
  </section>
);

const QueueRow = ({ title, detail, badge, action }) => (
  <div className="staff-queue-row">
    <div className="staff-queue-person">
      <strong>{title}</strong>
      <span>{detail}</span>
    </div>
    <div className="staff-queue-controls">
      {badge}
      {action}
    </div>
  </div>
);

export default StaffDashboard;
