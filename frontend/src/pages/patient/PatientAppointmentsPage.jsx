import { useEffect, useState, useCallback } from 'react';
import { appointmentService } from '../../services/appointmentService';
import { extractErrorMessage } from '../../services/api';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import EmptyState from '../../components/common/EmptyState';
import LoadingScreen from '../../components/common/LoadingScreen';
import Alert from '../../components/common/Alert';
import Modal from '../../components/common/Modal';
import Pagination from '../../components/common/Pagination';
import { formatDate, formatCurrency } from '../../utils/formatters';

const TABS = [
  { key: '', label: 'All' },
  { key: 'pending', label: 'Pending' },
  { key: 'confirmed', label: 'Confirmed' },
  { key: 'completed', label: 'Completed' },
  { key: 'cancelled', label: 'Cancelled' },
];

const PatientAppointmentsPage = () => {
  const [appointments, setAppointments] = useState([]);
  const [activeTab, setActiveTab] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [cancelTarget, setCancelTarget] = useState(null);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelling, setCancelling] = useState(false);

  const fetchAppointments = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await appointmentService.getMy({ status: activeTab || undefined, page, limit: 8 });
      setAppointments(res.data.data);
      setPagination(res.data.pagination);
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [activeTab, page]);

  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  const handleTabChange = (key) => {
    setActiveTab(key);
    setPage(1);
  };

  const handleCancel = async () => {
    setCancelling(true);
    try {
      await appointmentService.cancel(cancelTarget._id, { reason: cancelReason });
      setCancelTarget(null);
      setCancelReason('');
      fetchAppointments();
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setCancelling(false);
    }
  };

  const canCancel = (status) => ['pending', 'confirmed'].includes(status);

  return (
    <div>
      <div className="tabs-row">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            className={`tab-btn ${activeTab === tab.key ? 'active' : ''}`}
            onClick={() => handleTabChange(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {error && <Alert type="danger">{error}</Alert>}

      {loading ? (
        <LoadingScreen message="Loading your appointments…" />
      ) : appointments.length === 0 ? (
        <EmptyState title="No appointments found" message="You don't have any appointments in this category yet." />
      ) : (
        <>
          {appointments.map((appt) => (
            <div key={appt._id} className="appt-item">
              <div className="appt-date-block">
                <span className="appt-date-day">{new Date(appt.appointmentDate).getDate()}</span>
                <span className="appt-date-month">
                  {new Date(appt.appointmentDate).toLocaleDateString('en-US', { month: 'short' })}
                </span>
              </div>
              <div className="appt-info">
                <div className="appt-doctor-name">Dr. {appt.doctor?.name}</div>
                <div className="appt-meta">
                  {appt.doctor?.specialization} • {appt.timeSlot} • {formatCurrency(appt.consultationFee)}
                </div>
                <div className="appt-meta">Reason: {appt.reasonForVisit}</div>
              </div>
              <div className="flex-col gap-2" style={{ alignItems: 'flex-end' }}>
                <Badge status={appt.status} />
                {canCancel(appt.status) && (
                  <Button variant="ghost" size="sm" onClick={() => setCancelTarget(appt)}>
                    Cancel
                  </Button>
                )}
              </div>
            </div>
          ))}
          <Pagination currentPage={page} totalPages={pagination.totalPages} onPageChange={setPage} />
        </>
      )}

      {cancelTarget && (
        <Modal
          title="Cancel Appointment"
          onClose={() => setCancelTarget(null)}
          footer={
            <>
              <Button variant="secondary" onClick={() => setCancelTarget(null)}>
                Keep Appointment
              </Button>
              <Button variant="danger" onClick={handleCancel} loading={cancelling}>
                Confirm Cancellation
              </Button>
            </>
          }
        >
          <p className="text-soft" style={{ marginBottom: 16 }}>
            Are you sure you want to cancel your appointment with Dr. {cancelTarget.doctor?.name} on{' '}
            {formatDate(cancelTarget.appointmentDate)}?
          </p>
          <textarea
            className="field-textarea"
            placeholder="Optional: let us know why (helps us improve)"
            value={cancelReason}
            onChange={(e) => setCancelReason(e.target.value)}
            rows={3}
          />
        </Modal>
      )}
    </div>
  );
};

export default PatientAppointmentsPage;
