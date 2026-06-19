import { useEffect, useState, useCallback } from 'react';
import { appointmentService } from '../../services/appointmentService';
import { extractErrorMessage } from '../../services/api';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import FormField from '../../components/common/FormField';
import EmptyState from '../../components/common/EmptyState';
import LoadingScreen from '../../components/common/LoadingScreen';
import Alert from '../../components/common/Alert';
import Pagination from '../../components/common/Pagination';
import { formatDate } from '../../utils/formatters';

const STATUS_TABS = [
  { key: '', label: 'All' },
  { key: 'pending', label: 'Pending' },
  { key: 'confirmed', label: 'Confirmed' },
  { key: 'completed', label: 'Completed' },
  { key: 'cancelled', label: 'Cancelled' },
  { key: 'no-show', label: 'No-Show' },
];

const STATUS_TRANSITIONS = {
  pending: ['confirmed', 'cancelled'],
  confirmed: ['completed', 'cancelled', 'no-show'],
};

const AdminAppointmentsPage = () => {
  const [appointments, setAppointments] = useState([]);
  const [activeTab, setActiveTab] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updatingId, setUpdatingId] = useState(null);

  const fetchAppointments = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await appointmentService.getAll({
        status: activeTab || undefined,
        date: dateFilter || undefined,
        search: search || undefined,
        page,
        limit: 10,
      });
      setAppointments(res.data.data);
      setPagination(res.data.pagination);
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [activeTab, dateFilter, search, page]);

  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

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
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.key}
            className={`tab-btn ${activeTab === tab.key ? 'active' : ''}`}
            onClick={() => {
              setActiveTab(tab.key);
              setPage(1);
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="card" style={{ marginBottom: 20 }}>
        <div className="field-row">
          <FormField
            label="Search patient or doctor"
            name="search"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search by name…"
          />
          <FormField
            label="Filter by date"
            name="date"
            type="date"
            value={dateFilter}
            onChange={(e) => {
              setDateFilter(e.target.value);
              setPage(1);
            }}
          />
        </div>
      </div>

      {error && <Alert type="danger">{error}</Alert>}

      {loading ? (
        <LoadingScreen message="Loading appointments…" />
      ) : appointments.length === 0 ? (
        <EmptyState title="No appointments found" message="Try adjusting your filters." />
      ) : (
        <>
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Patient</th>
                  <th>Doctor</th>
                  <th>Date & Time</th>
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
                        <div className="text-faint" style={{ fontSize: '0.78rem' }}>
                          {appt.patient?.phone}
                        </div>
                      </td>
                      <td>
                        Dr. {appt.doctor?.name}
                        <div className="text-faint" style={{ fontSize: '0.78rem' }}>
                          {appt.doctor?.specialization}
                        </div>
                      </td>
                      <td>
                        {formatDate(appt.appointmentDate)}
                        <div className="text-faint" style={{ fontSize: '0.78rem' }}>
                          {appt.timeSlot}
                        </div>
                      </td>
                      <td>
                        <Badge status={appt.status} />
                      </td>
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
                          <span className="text-faint" style={{ fontSize: '0.8rem' }}>
                            No actions
                          </span>
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

export default AdminAppointmentsPage;
