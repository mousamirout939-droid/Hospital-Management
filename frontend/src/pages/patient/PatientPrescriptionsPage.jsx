import { useEffect, useState, useCallback } from 'react';
import { prescriptionService } from '../../services/prescriptionService';
import { extractErrorMessage } from '../../services/api';
import EmptyState from '../../components/common/EmptyState';
import LoadingScreen from '../../components/common/LoadingScreen';
import Alert from '../../components/common/Alert';
import Badge from '../../components/common/Badge';
import Pagination from '../../components/common/Pagination';
import { formatDate } from '../../utils/formatters';

const PatientPrescriptionsPage = () => {
  const [prescriptions, setPrescriptions] = useState([]);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await prescriptionService.getMy({ page, limit: 8 });
      setPrescriptions(res.data.data);
      setPagination(res.data.pagination);
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading) return <LoadingScreen message="Loading your prescriptions…" />;

  return (
    <div>
      {error && <Alert type="danger">{error}</Alert>}

      {prescriptions.length === 0 ? (
        <EmptyState title="No prescriptions yet" message="Prescriptions issued by your doctor will appear here." />
      ) : (
        <>
          {prescriptions.map((rx) => (
            <div key={rx._id} className="card" style={{ marginBottom: 16 }}>
              <div className="card-header">
                <div>
                  <h4>Dr. {rx.doctor?.name}</h4>
                  <p className="text-faint" style={{ fontSize: '0.82rem' }}>
                    Issued {formatDate(rx.issuedDate)}
                  </p>
                </div>
                <Badge status={rx.status} />
              </div>

              <div className="table-wrap">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Medicine</th>
                      <th>Dosage</th>
                      <th>Frequency</th>
                      <th>Duration</th>
                      <th>Instructions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rx.medicines.map((med, idx) => (
                      <tr key={idx}>
                        <td>{med.medicineName}</td>
                        <td>{med.dosage}</td>
                        <td>{med.frequency}</td>
                        <td>{med.duration}</td>
                        <td>{med.instructions || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {rx.additionalNotes && (
                <p className="text-soft mt-3" style={{ fontSize: '0.85rem' }}>
                  <strong>Note:</strong> {rx.additionalNotes}
                </p>
              )}
            </div>
          ))}
          <Pagination currentPage={page} totalPages={pagination.totalPages} onPageChange={setPage} />
        </>
      )}
    </div>
  );
};

export default PatientPrescriptionsPage;
