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
import Button from '../../components/common/Button';

const PatientLabReportsPage = () => {
  const [reports, setReports] = useState([]);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selected, setSelected] = useState(null);
  const [uploadFile, setUploadFile] = useState(null);
  const [analysisError, setAnalysisError] = useState('');
  const [analyzing, setAnalyzing] = useState(false);

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

  const handleAnalyze = async (event) => {
    event.preventDefault();
    if (!uploadFile) {
      setAnalysisError('Choose a PDF lab report first.');
      return;
    }

    setAnalyzing(true);
    setAnalysisError('');
    try {
      const response = await labReportService.analyze(uploadFile);
      setSelected(response.data.data);
      setUploadFile(null);
      event.target.reset();
      if (page === 1) {
        await fetchData();
      } else {
        setPage(1);
      }
    } catch (err) {
      setAnalysisError(extractErrorMessage(err));
    } finally {
      setAnalyzing(false);
    }
  };

  if (loading) return <LoadingScreen message="Loading your lab reports…" />;

  return (
    <div>
      {error && <Alert type="danger">{error}</Alert>}

      <section className="card lab-upload-card">
        <div className="card-header">
          <div>
            <h2 className="card-title">Analyze a CBC report</h2>
            <p className="text-faint lab-upload-description">
              Upload a text-based PDF (up to 5 MB). Analysis runs on this server; the PDF itself is not stored.
            </p>
          </div>
        </div>
        {analysisError && <Alert type="danger">{analysisError}</Alert>}
        <form className="lab-upload-form" onSubmit={handleAnalyze}>
          <input
            className="field-input"
            type="file"
            accept=".pdf,application/pdf"
            onChange={(event) => {
              setUploadFile(event.target.files?.[0] || null);
              setAnalysisError('');
            }}
          />
          <Button type="submit" variant="primary" loading={analyzing} disabled={!uploadFile}>
            Analyze report
          </Button>
        </form>
        <p className="text-faint lab-upload-note">
          Only readable CBC values are extracted. Results are compared with the ranges printed on the report;
          this is informational and not a medical diagnosis.
        </p>
      </section>

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
            {selected.sourceFileName ? ` • ${selected.sourceFileName}` : ''}
          </p>

          {selected.parameters.length > 0 && (
            <section className="lab-analysis">
              <h4>Automated report summary</h4>
              <div className="lab-analysis-results">
                {selected.parameters.map((parameter, index) => (
                  <article className="lab-analysis-result" key={`${parameter.parameterName}-${index}`}>
                    <div className="lab-analysis-result-header">
                      <strong>{parameter.parameterName}</strong>
                      <span className="lab-analysis-value">
                        {parameter.result} {parameter.unit}
                      </span>
                    </div>
                    <div className="lab-analysis-result-footer">
                      <span>Reference range: {parameter.normalRange || 'not provided'}</span>
                      {parameter.flag ? (
                        <Badge
                          status={parameter.flag === 'normal' ? 'completed' : 'cancelled'}
                        >
                          {parameter.flag === 'normal'
                            ? 'Within range'
                            : parameter.flag === 'low'
                              ? 'Below range'
                              : 'Above range'}
                        </Badge>
                      ) : (
                        <Badge status="pending">Not assessed</Badge>
                      )}
                    </div>
                  </article>
                ))}
              </div>
              {selected.summary && <p className="lab-analysis-disclaimer">{selected.summary}</p>}
            </section>
          )}

          {selected.parameters.length === 0 && selected.summary && (
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
