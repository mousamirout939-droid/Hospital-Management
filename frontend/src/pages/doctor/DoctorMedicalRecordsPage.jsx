import { useEffect, useState, useCallback } from 'react';
import { medicalRecordService } from '../../services/medicalRecordService';
import { extractErrorMessage } from '../../services/api';
import CreateMedicalRecordModal from '../../components/admin/CreateMedicalRecordModal';
import Button from '../../components/common/Button';
import EmptyState from '../../components/common/EmptyState';
import LoadingScreen from '../../components/common/LoadingScreen';
import Alert from '../../components/common/Alert';
import Pagination from '../../components/common/Pagination';
import { formatDate } from '../../utils/formatters';
import { IconPlus } from '../../components/common/Icons';

const DoctorMedicalRecordsPage = () => {
  const [records, setRecords] = useState([]);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [feedback, setFeedback] = useState('');

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

  useEffect(() => { fetchRecords(); }, [fetchRecords]);

  const handleSaved = () => {
    setShowCreate(false);
    setFeedback('Medical record added successfully.');
    fetchRecords();
    setTimeout(() => setFeedback(''), 4000);
  };

  return (
    <div>
      {feedback && <Alert type="success">{feedback}</Alert>}
      {error && <Alert type="danger">{error}</Alert>}

      <div className="card" style={{ marginBottom: 20 }}>
        <div className="flex justify-between items-center">
          <div>
            <h3 style={{ marginBottom: 4 }}>My Patient Records</h3>
            <p className="text-soft" style={{ fontSize: '0.85rem' }}>Create and review records for your patients.</p>
          </div>
          <Button variant="primary" onClick={() => setShowCreate(true)}>
            <IconPlus width={16} height={16} /> Add Record
          </Button>
        </div>
      </div>

      {loading ? (
        <LoadingScreen message="Loading your records…" />
      ) : records.length === 0 ? (
        <EmptyState title="No records yet" message="New records you add will appear here." />
      ) : (
        <>
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Patient</th>
                  <th>Visit Date</th>
                  <th>Diagnosis</th>
                </tr>
              </thead>
              <tbody>
                {records.map((record) => (
                  <tr key={record._id}>
                    <td>{record.patient?.name}</td>
                    <td>{formatDate(record.visitDate)}</td>
                    <td>{record.diagnosis}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination currentPage={page} totalPages={pagination.totalPages} onPageChange={setPage} />
        </>
      )}

      {showCreate && <CreateMedicalRecordModal onClose={() => setShowCreate(false)} onSaved={handleSaved} doctorOnly />}
    </div>
  );
};

export default DoctorMedicalRecordsPage;
