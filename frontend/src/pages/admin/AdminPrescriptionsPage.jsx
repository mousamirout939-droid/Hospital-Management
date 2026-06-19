import { useEffect, useState, useCallback } from 'react';
import { prescriptionService } from '../../services/prescriptionService';
import { extractErrorMessage } from '../../services/api';
import CreatePrescriptionModal from '../../components/admin/CreatePrescriptionModal';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import EmptyState from '../../components/common/EmptyState';
import LoadingScreen from '../../components/common/LoadingScreen';
import Alert from '../../components/common/Alert';
import Pagination from '../../components/common/Pagination';
import { formatDate } from '../../utils/formatters';
import { IconPlus } from '../../components/common/Icons';

const AdminPrescriptionsPage = () => {
  const [prescriptions, setPrescriptions] = useState([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [updatingId, setUpdatingId] = useState(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await prescriptionService.getAll({ status: statusFilter || undefined, page, limit: 10 });
      setPrescriptions(res.data.data);
      setPagination(res.data.pagination);
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [statusFilter, page]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSaved = () => {
    setShowCreate(false);
    setFeedback('Prescription issued successfully.');
    fetchData();
    setTimeout(() => setFeedback(''), 4000);
  };

  const handleMarkFulfilled = async (id) => {
    setUpdatingId(id);
    try {
      await prescriptionService.updateStatus(id, { status: 'fulfilled' });
      fetchData();
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div>
      {feedback && <Alert type="success">{feedback}</Alert>}
      {error && <Alert type="danger">{error}</Alert>}

      <div className="tabs-row" style={{ justifyContent: 'space-between' }}>
        <div className="flex gap-2">
          {['', 'active', 'fulfilled', 'cancelled'].map((s) => (
            <button
              key={s}
              className={`tab-btn ${statusFilter === s ? 'active' : ''}`}
              onClick={() => {
                setStatusFilter(s);
                setPage(1);
              }}
            >
              {s === '' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>
        <Button variant="primary" onClick={() => setShowCreate(true)} style={{ marginBottom: 8 }}>
          <IconPlus width={16} height={16} /> Issue Prescription
        </Button>
      </div>

      {loading ? (
        <LoadingScreen message="Loading prescriptions…" />
      ) : prescriptions.length === 0 ? (
        <EmptyState title="No prescriptions found" message="Issue a new prescription to get started." />
      ) : (
        <>
          {prescriptions.map((rx) => (
            <div key={rx._id} className="card" style={{ marginBottom: 16 }}>
              <div className="card-header">
                <div>
                  <h4>{rx.patient?.name}</h4>
                  <p className="text-faint" style={{ fontSize: '0.82rem' }}>
                    Prescribed by Dr. {rx.doctor?.name} on {formatDate(rx.issuedDate)}
                  </p>
                </div>
                <div className="flex gap-2 items-center">
                  <Badge status={rx.status} />
                  {rx.status === 'active' && (
                    <Button size="sm" variant="outline" loading={updatingId === rx._id} onClick={() => handleMarkFulfilled(rx._id)}>
                      Mark Fulfilled
                    </Button>
                  )}
                </div>
              </div>

              <div className="table-wrap">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Medicine</th>
                      <th>Dosage</th>
                      <th>Frequency</th>
                      <th>Duration</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rx.medicines.map((med, idx) => (
                      <tr key={idx}>
                        <td>{med.medicineName}</td>
                        <td>{med.dosage}</td>
                        <td>{med.frequency}</td>
                        <td>{med.duration}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
          <Pagination currentPage={page} totalPages={pagination.totalPages} onPageChange={setPage} />
        </>
      )}

      {showCreate && <CreatePrescriptionModal onClose={() => setShowCreate(false)} onSaved={handleSaved} />}
    </div>
  );
};

export default AdminPrescriptionsPage;
