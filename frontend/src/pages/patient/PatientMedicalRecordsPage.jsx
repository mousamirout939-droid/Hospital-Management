import { useEffect, useState, useCallback } from 'react';
import { medicalRecordService } from '../../services/medicalRecordService';
import { extractErrorMessage } from '../../services/api';
import EmptyState from '../../components/common/EmptyState';
import LoadingScreen from '../../components/common/LoadingScreen';
import Alert from '../../components/common/Alert';
import Pagination from '../../components/common/Pagination';
import Modal from '../../components/common/Modal';
import { formatDate } from '../../utils/formatters';

const PatientMedicalRecordsPage = () => {
  const [records, setRecords] = useState([]);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selected, setSelected] = useState(null);

  const fetchRecords = useCallback(async () => {
    setLoading(true);
    try {
      const res = await medicalRecordService.getMy({ page, limit: 8 });
      setRecords(res.data.data);
      setPagination(res.data.pagination);
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);

  if (loading) return <LoadingScreen message="Loading your medical records…" />;

  return (
    <div>
      {error && <Alert type="danger">{error}</Alert>}

      {records.length === 0 ? (
        <EmptyState
          title="No medical records yet"
          message="Records from your visits will appear here once added by your care team."
        />
      ) : (
        <>
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Visit Date</th>
                  <th>Doctor</th>
                  <th>Diagnosis</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {records.map((record) => (
                  <tr key={record._id}>
                    <td>{formatDate(record.visitDate)}</td>
                    <td>Dr. {record.doctor?.name}</td>
                    <td>{record.diagnosis}</td>
                    <td>
                      <button
                        onClick={() => setSelected(record)}
                        style={{ background: 'none', border: 'none', color: 'var(--color-primary)', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem' }}
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination currentPage={page} totalPages={pagination.totalPages} onPageChange={setPage} />
        </>
      )}

      {selected && (
        <Modal title="Visit Details" onClose={() => setSelected(null)}>
          <div className="doc-sheet-grid">
            <div>
              <div className="doc-sheet-label">Doctor</div>
              <div className="doc-sheet-value">Dr. {selected.doctor?.name}</div>
            </div>
            <div>
              <div className="doc-sheet-label">Visit Date</div>
              <div className="doc-sheet-value">{formatDate(selected.visitDate)}</div>
            </div>
          </div>

          <div className="field-group">
            <div className="doc-sheet-label">Diagnosis</div>
            <p>{selected.diagnosis}</p>
          </div>

          {selected.symptoms && (
            <div className="field-group">
              <div className="doc-sheet-label">Symptoms</div>
              <p>{selected.symptoms}</p>
            </div>
          )}

          {selected.treatmentPlan && (
            <div className="field-group">
              <div className="doc-sheet-label">Treatment Plan</div>
              <p>{selected.treatmentPlan}</p>
            </div>
          )}

          {selected.vitals && Object.values(selected.vitals).some(Boolean) && (
            <div className="field-group">
              <div className="doc-sheet-label">Vitals</div>
              <div className="field-row" style={{ marginTop: 8 }}>
                {selected.vitals.bloodPressure && <p>BP: {selected.vitals.bloodPressure}</p>}
                {selected.vitals.heartRate && <p>HR: {selected.vitals.heartRate}</p>}
                {selected.vitals.temperature && <p>Temp: {selected.vitals.temperature}</p>}
                {selected.vitals.weight && <p>Weight: {selected.vitals.weight}</p>}
              </div>
            </div>
          )}

          {selected.notes && (
            <div className="field-group">
              <div className="doc-sheet-label">Notes</div>
              <p>{selected.notes}</p>
            </div>
          )}
        </Modal>
      )}
    </div>
  );
};

export default PatientMedicalRecordsPage;
