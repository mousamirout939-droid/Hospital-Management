import { useEffect, useState, useCallback } from 'react';
import { labReportService } from '../../services/labReportService';
import { extractErrorMessage } from '../../services/api';
import CreateLabReportModal from '../../components/admin/CreateLabReportModal';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import EmptyState from '../../components/common/EmptyState';
import LoadingScreen from '../../components/common/LoadingScreen';
import Alert from '../../components/common/Alert';
import Pagination from '../../components/common/Pagination';
import Modal from '../../components/common/Modal';
import FormField from '../../components/common/FormField';
import { formatDate } from '../../utils/formatters';
import { IconPlus } from '../../components/common/Icons';

const AdminLabReportsPage = () => {
  const [reports, setReports] = useState([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [statusEditTarget, setStatusEditTarget] = useState(null);
  const [newStatus, setNewStatus] = useState('');
  const [updating, setUpdating] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await labReportService.getAll({ status: statusFilter || undefined, page, limit: 10 });
      setReports(res.data.data);
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
    setFeedback('Lab report saved successfully.');
    fetchData();
    setTimeout(() => setFeedback(''), 4000);
  };

  const openStatusEdit = (report) => {
    setStatusEditTarget(report);
    setNewStatus(report.status);
  };

  const handleStatusSave = async () => {
    setUpdating(true);
    try {
      await labReportService.update(statusEditTarget._id, { status: newStatus });
      setStatusEditTarget(null);
      fetchData();
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div>
      {feedback && <Alert type="success">{feedback}</Alert>}
      {error && <Alert type="danger">{error}</Alert>}

      <div className="tabs-row" style={{ justifyContent: 'space-between' }}>
        <div className="flex gap-2">
          {['', 'pending', 'in-progress', 'completed'].map((s) => (
            <button
              key={s}
              className={`tab-btn ${statusFilter === s ? 'active' : ''}`}
              onClick={() => {
                setStatusFilter(s);
                setPage(1);
              }}
            >
              {s === '' ? 'All' : s.split('-').map((w) => w[0].toUpperCase() + w.slice(1)).join(' ')}
            </button>
          ))}
        </div>
        <Button variant="primary" onClick={() => setShowCreate(true)} style={{ marginBottom: 8 }}>
          <IconPlus width={16} height={16} /> Create Report
        </Button>
      </div>

      {loading ? (
        <LoadingScreen message="Loading lab reports…" />
      ) : reports.length === 0 ? (
        <EmptyState title="No lab reports found" message="Create a new lab report to get started." />
      ) : (
        <>
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Patient</th>
                  <th>Test</th>
                  <th>Report Date</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {reports.map((report) => (
                  <tr key={report._id}>
                    <td>{report.patient?.name}</td>
                    <td>{report.testName}</td>
                    <td>{formatDate(report.reportDate)}</td>
                    <td>
                      <Badge status={report.status} />
                    </td>
                    <td>
                      <Button size="sm" variant="ghost" onClick={() => openStatusEdit(report)}>
                        Update Status
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination currentPage={page} totalPages={pagination.totalPages} onPageChange={setPage} />
        </>
      )}

      {showCreate && <CreateLabReportModal onClose={() => setShowCreate(false)} onSaved={handleSaved} />}

      {statusEditTarget && (
        <Modal
          title={`Update Status — ${statusEditTarget.testName}`}
          onClose={() => setStatusEditTarget(null)}
          footer={
            <>
              <Button variant="secondary" onClick={() => setStatusEditTarget(null)}>
                Cancel
              </Button>
              <Button variant="primary" onClick={handleStatusSave} loading={updating}>
                Save
              </Button>
            </>
          }
        >
          <FormField
            label="Status"
            name="status"
            as="select"
            value={newStatus}
            onChange={(e) => setNewStatus(e.target.value)}
            options={[
              { value: 'pending', label: 'Pending' },
              { value: 'in-progress', label: 'In Progress' },
              { value: 'completed', label: 'Completed' },
            ]}
          />
          <p className="text-faint" style={{ fontSize: '0.82rem' }}>
            Marking as "Completed" will notify the patient that their results are ready.
          </p>
        </Modal>
      )}
    </div>
  );
};

export default AdminLabReportsPage;
