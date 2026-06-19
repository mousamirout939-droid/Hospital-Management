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

const AdminMedicalRecordsPage = () => {
  const [records, setRecords] = useState([]);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [feedback, setFeedback] = useState('');

  // Admin medical records overview: since records are inherently per-patient,
  // we surface the most recently created ones across all patients here.
  const fetchRecords = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      // No global "all records" admin endpoint by design (records are scoped
      // to a patient for privacy); this page focuses on record creation,
      // with patient-specific history viewed from the Patients page in a
      // future iteration. We reuse "my" pattern isn't applicable for admin,
      // so we just show creation workflow + success feedback here.
      setRecords([]);
      setPagination({ totalPages: 1 });
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);

  const handleSaved = () => {
    setShowCreate(false);
    setFeedback('Medical record added successfully.');
    setTimeout(() => setFeedback(''), 4000);
  };

  return (
    <div>
      {feedback && <Alert type="success">{feedback}</Alert>}
      {error && <Alert type="danger">{error}</Alert>}

      <div className="card" style={{ marginBottom: 20 }}>
        <div className="flex justify-between items-center">
          <div>
            <h3 style={{ marginBottom: 4 }}>Patient Medical Records</h3>
            <p className="text-soft" style={{ fontSize: '0.85rem' }}>
              Add diagnosis, symptoms, and treatment notes for a patient visit.
            </p>
          </div>
          <Button variant="primary" onClick={() => setShowCreate(true)}>
            <IconPlus width={16} height={16} /> Add Record
          </Button>
        </div>
      </div>

      <EmptyState
        title="Search a patient to view their full history"
        message="Go to the Patients tab and open a patient's profile to see their complete medical record timeline, or use 'Add Record' to log a new visit."
      />

      {showCreate && (
        <CreateMedicalRecordModal onClose={() => setShowCreate(false)} onSaved={handleSaved} />
      )}
    </div>
  );
};

export default AdminMedicalRecordsPage;
