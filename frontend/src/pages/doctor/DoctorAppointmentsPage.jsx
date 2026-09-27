import { useEffect, useState, useCallback } from 'react';
import { appointmentService } from '../../services/appointmentService';
import { extractErrorMessage } from '../../services/api';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import EmptyState from '../../components/common/EmptyState';
import LoadingScreen from '../../components/common/LoadingScreen';
import Alert from '../../components/common/Alert';
import Pagination from '../../components/common/Pagination';
import { formatDate } from '../../utils/formatters';

const TABS = [
  { key: '', label: 'All' },
  { key: 'pending', label: 'Pending' },
  { key: 'confirmed', label: 'Confirmed' },
  { key: 'completed', label: 'Completed' },
  { key: 'no-show', label: 'No-Show' },
];

const STATUS_TRANSITIONS = {
  pending: ['confirmed', 'cancelled'],
  confirmed: ['completed', 'cancelled', 'no-show'],
};

const DoctorAppointmentsPage = () => {
  const [appointments, setAppointments] = useState([]);
  const [activeTab, setActiveTab] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updatingId, setUpdatingId] = useState(null);

  const fetchAppointments = useCallback(async () => {
    setLoading(true);
    try {
      const res = await appointmentService.getAll({ status: activeTab || undefined, page, limit: 10 });
      setAppointments(res.data.data);
      setPagination(res.data.pagination);
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [activeTab, page]);

  useEffect(() => { fetchAppointments(); }, [fetchAppointments]);

  const handleStatusUpdate = async (id, status) => {
    setUpdatingId(id);
    try {
      await appointmentService.updateStatus(id, { status });
      fetchAppointments();
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div>
      <div className="tabs-row">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            className={`tab-btn ${activeTab === tab.key ? 'active' : ''}`}
            onClick={() => { setActiveTab(tab.key); setPage(1); }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {error && <Alert type="danger">{error}</Alert>}

      {loading ? (
        <LoadingScreen message="Loading appointments…" />
      ) : appointments.length === 0 ? (
        <EmptyState title="No appointments found" message="You don't have appointments in this category yet." />
      ) : (
        <>
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Patient</th>
                  <th>Date & Time</th>
                  <th>Reason</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {appointments.map((appt) => {
                  const transitions = STATUS_TRANSITIONS[appt.status] || [];
                  return (
                    <tr key={appt._id}>
                      <td>
                        <div>{appt.patient?.name}</div>
                        <div className="text-faint" style={{ fontSize: '0.78rem' }}>{appt.patient?.email}</div>
                      </td>
                      <td>
                        {formatDate(appt.appointmentDate)}
                        <div className="text-faint" style={{ fontSize: '0.78rem' }}>{appt.timeSlot}</div>
                      </td>
                      <td>{appt.reasonForVisit}</td>
                      <td><Badge status={appt.status} /></td>
                      <td>
                        {transitions.length > 0 ? (
                          <div className="flex gap-2" style={{ flexWrap: 'wrap' }}>
                            {transitions.map((t) => (
                              <Button
                                key={t}
                                size="sm"
                                variant={t === 'cancelled' || t === 'no-show' ? 'danger' : 'outline'}
                                loading={updatingId === appt._id}
                                onClick={() => handleStatusUpdate(appt._id, t)}
                              >
                                {t === 'no-show' ? 'No-Show' : t.charAt(0).toUpperCase() + t.slice(1)}
                              </Button>
                            ))}
                          </div>
                        ) : (
                          <span className="text-faint" style={{ fontSize: '0.8rem' }}>No actions</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <Pagination currentPage={page} totalPages={pagination.totalPages} onPageChange={setPage} />
        </>
      )}
    </div>
  );
};

export default DoctorAppointmentsPage;
