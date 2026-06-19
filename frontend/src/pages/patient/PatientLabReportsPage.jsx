import { useEffect, useState, useCallback } from 'react';
import { labReportService } from '../../services/labReportService';
import { extractErrorMessage } from '../../services/api';
import EmptyState from '../../components/common/EmptyState';
import LoadingScreen from '../../components/common/LoadingScreen';
import Alert from '../../components/common/Alert';
import Badge from '../../components/common/Badge';
import Pagination from '../../components/common/Pagination';
import Modal from '../../components/common/Modal';
import { formatDate } from '../../utils/formatters';

const PatientLabReportsPage = () => {
  const [reports, setReports] = useState([]);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selected, setSelected] = useState(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await labReportService.getMy({ page, limit: 8 });
      setReports(res.data.data);
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

  if (loading) return <LoadingScreen message="Loading your lab reports…" />;

  return (
    <div>
      {error && <Alert type="danger">{error}</Alert>}

      {reports.length === 0 ? (
        <EmptyState title="No lab reports yet" message="Your test results will appear here once available." />
      ) : (
        <>
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Test Name</th>
                  <th>Report Date</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {reports.map((report) => (
                  <tr key={report._id}>
                    <td>{report.testName}</td>
                    <td>{formatDate(report.reportDate)}</td>
                    <td>
                      <Badge status={report.status} />
                    </td>
                    <td>
                      <button
                        onClick={() => setSelected(report)}
                        disabled={report.status !== 'completed'}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: report.status === 'completed' ? 'var(--color-primary)' : 'var(--color-ink-faint)',
                          cursor: report.status === 'completed' ? 'pointer' : 'not-allowed',
                          fontWeight: 600,
                          fontSize: '0.85rem',
                        }}
                      >
                        View Results
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
        <Modal title={selected.testName} onClose={() => setSelected(null)} maxWidth="640px">
          <p className="text-faint" style={{ marginBottom: 16, fontSize: '0.85rem' }}>
            Reported on {formatDate(selected.reportDate)}
            {selected.doctor?.name ? ` • Referred by Dr. ${selected.doctor.name}` : ''}
          </p>

          {selected.parameters.length > 0 && (
            <div className="table-wrap" style={{ marginBottom: 16 }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Parameter</th>
                    <th>Result</th>
                    <th>Normal Range</th>
                    <th>Flag</th>
                  </tr>
                </thead>
                <tbody>
                  {selected.parameters.map((p, idx) => (
                    <tr key={idx}>
                      <td>{p.parameterName}</td>
                      <td>
                        {p.result} {p.unit}
                      </td>
                      <td>{p.normalRange || '—'}</td>
                      <td>
                        {p.flag ? (
                          <Badge status={p.flag === 'normal' ? 'completed' : 'cancelled'}>{p.flag}</Badge>
                        ) : (
                          '—'
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {selected.summary && (
            <div className="field-group">
              <div className="doc-sheet-label">Summary</div>
              <p>{selected.summary}</p>
            </div>
          )}
        </Modal>
      )}
    </div>
  );
};

export default PatientLabReportsPage;
