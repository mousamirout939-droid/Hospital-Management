import { useCallback, useEffect, useState } from 'react';
import { dashboardService } from '../../services/dashboardService';
import { labReportService } from '../../services/labReportService';
import { extractErrorMessage } from '../../services/api';
import Alert from '../../components/common/Alert';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import EmptyState from '../../components/common/EmptyState';
import FormField from '../../components/common/FormField';
import LoadingScreen from '../../components/common/LoadingScreen';
import Modal from '../../components/common/Modal';
import Pagination from '../../components/common/Pagination';
import StatCard from '../../components/common/StatCard';
import { formatDate } from '../../utils/formatters';
import { IconFlask, IconReceipt, IconUsers } from '../../components/common/Icons';

const REPORT_TABS = [
  { key: 'pending', label: 'Pending' },
  { key: 'in-progress', label: 'In progress' },
  { key: 'completed', label: 'Completed' },
];

const newParameter = () => ({ parameterName: '', result: '', unit: '', normalRange: '', flag: '' });

const LabTechnicianDashboard = () => {
  const [stats, setStats] = useState(null);
  const [reports, setReports] = useState([]);
  const [activeTab, setActiveTab] = useState('pending');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [reportsLoading, setReportsLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState('');
  const [error, setError] = useState('');
  const [feedback, setFeedback] = useState('');
  const [activeReport, setActiveReport] = useState(null);
  const [viewOnly, setViewOnly] = useState(false);
  const [parameters, setParameters] = useState([]);
  const [summary, setSummary] = useState('');

  const loadStats = useCallback(async () => {
    try {
      const response = await dashboardService.getStaffDashboard('lab-technician');
      setStats(response.data.data);
    } catch (statsError) {
      setError(extractErrorMessage(statsError));
    }
  }, []);

  const loadReports = useCallback(async () => {
    setReportsLoading(true);
    setError('');
    try {
      const response = await labReportService.getAll({ status: activeTab, page, limit: 10 });
      setReports(response.data.data);
      setPagination(response.data.pagination);
    } catch (reportsError) {
      setError(extractErrorMessage(reportsError));
    } finally {
      setReportsLoading(false);
      setLoading(false);
    }
  }, [activeTab, page]);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  useEffect(() => {
    loadReports();
  }, [loadReports]);

  useEffect(() => {
    if (!reportsLoading && page > pagination.totalPages) {
      setPage(pagination.totalPages);
    }
  }, [page, pagination.totalPages, reportsLoading]);

  const startReport = async (report) => {
    setBusyId(report._id);
    setError('');
    setFeedback('');
    try {
      await labReportService.update(report._id, { status: 'in-progress' });
      setFeedback(`${report.testName} is now in progress.`);
      await Promise.all([loadReports(), loadStats()]);
    } catch (updateError) {
      setError(extractErrorMessage(updateError));
    } finally {
      setBusyId('');
    }
  };

  const openReport = (report, readOnly = false) => {
    setActiveReport(report);
    setViewOnly(readOnly);
    setParameters(report.parameters?.length ? report.parameters.map((item) => ({ ...item })) : [newParameter()]);
    setSummary(report.summary || '');
    setError('');
  };

  const updateParameter = (index, field, value) => {
    setParameters((current) => current.map((parameter, parameterIndex) => (
      parameterIndex === index ? { ...parameter, [field]: value } : parameter
    )));
  };

  const saveResults = async (event, completeReport) => {
    event.preventDefault();
    const enteredParameters = parameters.filter((parameter) => parameter.parameterName.trim() || parameter.result.trim());
    if (enteredParameters.some((parameter) => !parameter.parameterName.trim() || !parameter.result.trim())) {
      setError('Enter both a test name and result for each row, or remove the unused row.');
      return;
    }
    if (completeReport && enteredParameters.length === 0) {
      setError('Add at least one test result before sharing the report with the patient.');
      return;
    }

    setSaving(true);
    setError('');
    try {
      await labReportService.update(activeReport._id, {
        parameters: enteredParameters,
        summary,
        ...(completeReport && { status: 'completed' }),
      });
      setActiveReport(null);
      setFeedback(completeReport
        ? 'Report completed and shared in the patient portal. A report-ready notification was sent.'
        : 'Lab results saved. The report remains in progress.');
      await Promise.all([loadReports(), loadStats()]);
    } catch (saveError) {
      setError(extractErrorMessage(saveError));
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingScreen message="Loading laboratory dashboard…" />;

  const countByTab = {
    pending: stats?.pendingTests ?? 0,
    'in-progress': stats?.inProgressTests ?? 0,
    completed: stats?.completedTests ?? 0,
  };

  return (
    <div className="staff-dashboard">
      {error && <Alert type="danger">{error}</Alert>}
      {feedback && <Alert type="success">{feedback}</Alert>}

      <div className="dashboard-welcome-row">
        <div>
          <h2>Laboratory dashboard</h2>
          <p className="text-faint">Review incoming tests, enter verified results, and publish completed reports to patients.</p>
        </div>
      </div>

      <div className="stat-grid">
        <StatCard icon={IconFlask} label="Pending Tests" value={stats?.pendingTests ?? 0} tone="warning" />
        <StatCard icon={IconReceipt} label="In Progress" value={stats?.inProgressTests ?? 0} tone="accent" />
        <StatCard icon={IconUsers} label="Completed Reports" value={stats?.completedTests ?? 0} tone="primary" />
      </div>

      <section className="card staff-queue-card">
        <div className="tabs-row">
          {REPORT_TABS.map((tab) => (
            <button
              key={tab.key}
              className={`tab-btn ${activeTab === tab.key ? 'active' : ''}`}
              onClick={() => {
                setActiveTab(tab.key);
                setPage(1);
              }}
            >
              {tab.label} ({countByTab[tab.key]})
            </button>
          ))}
        </div>

        {reportsLoading ? (
          <LoadingScreen message="Loading lab reports…" />
        ) : reports.length === 0 ? (
          <EmptyState
            title={activeTab === 'completed' ? 'No completed reports yet' : `No ${activeTab} tests`}
            message={activeTab === 'completed'
              ? 'Completed reports will be listed here and made available to their patients.'
              : 'New lab reports will appear here when they are ready for processing.'}
          />
        ) : (
          <>
            <div className="table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Test</th>
                    <th>Patient</th>
                    <th>Doctor</th>
                    <th>Report date</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {reports.map((report) => (
                    <tr key={report._id}>
                      <td>
                        <strong>{report.testName}</strong>
                        <div className="text-faint">{report.testType || 'General'}</div>
                      </td>
                      <td>{report.patient?.name || 'Patient'}</td>
                      <td>{report.doctor?.name ? `Dr. ${report.doctor.name}` : '—'}</td>
                      <td>{formatDate(report.reportDate)}</td>
                      <td><Badge status={report.status} /></td>
                      <td>
                        {report.status === 'pending' ? (
                          <Button size="sm" variant="outline" loading={busyId === report._id} onClick={() => startReport(report)}>
                            Start
                          </Button>
                        ) : report.status === 'in-progress' ? (
                          <Button size="sm" variant="primary" onClick={() => openReport(report)}>
                            Enter results
                          </Button>
                        ) : (
                          <Button size="sm" variant="outline" onClick={() => openReport(report, true)}>
                            View results
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination currentPage={page} totalPages={pagination.totalPages} onPageChange={setPage} />
          </>
        )}
      </section>

      {activeReport && (
        <Modal
          title={viewOnly ? `${activeReport.testName} results` : `Enter results: ${activeReport.testName}`}
          onClose={() => setActiveReport(null)}
        >
          <div className="text-faint" style={{ marginBottom: 16 }}>
            Patient: {activeReport.patient?.name || 'Patient'} · Report date: {formatDate(activeReport.reportDate)}
          </div>

          {viewOnly ? (
            <>
              {activeReport.parameters?.length ? (
                <div className="table-wrap">
                  <table className="data-table">
                    <thead>
                      <tr><th>Test</th><th>Result</th><th>Unit</th><th>Reference range</th><th>Flag</th></tr>
                    </thead>
                    <tbody>
                      {activeReport.parameters.map((parameter, index) => (
                        <tr key={`${parameter.parameterName}-${index}`}>
                          <td>{parameter.parameterName}</td>
                          <td>{parameter.result}</td>
                          <td>{parameter.unit || '—'}</td>
                          <td>{parameter.normalRange || '—'}</td>
                          <td>{parameter.flag || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : <p className="text-faint">No structured test results were recorded.</p>}
              {activeReport.summary && <p>{activeReport.summary}</p>}
              <div className="modal-footer">
                <Button variant="secondary" onClick={() => setActiveReport(null)}>Close</Button>
              </div>
            </>
          ) : (
            <form onSubmit={(event) => saveResults(event, false)}>
              {parameters.map((parameter, index) => (
                <div className="card" key={index} style={{ marginBottom: 12, padding: 16 }}>
                  <div className="field-row">
                    <FormField label="Test / parameter" name={`parameter-${index}`} value={parameter.parameterName} onChange={(event) => updateParameter(index, 'parameterName', event.target.value)} required />
                    <FormField label="Result" name={`result-${index}`} value={parameter.result} onChange={(event) => updateParameter(index, 'result', event.target.value)} required />
                  </div>
                  <div className="field-row">
                    <FormField label="Unit" name={`unit-${index}`} value={parameter.unit} onChange={(event) => updateParameter(index, 'unit', event.target.value)} />
                    <FormField label="Reference range" name={`range-${index}`} value={parameter.normalRange} onChange={(event) => updateParameter(index, 'normalRange', event.target.value)} />
                    <FormField
                      label="Flag"
                      name={`flag-${index}`}
                      as="select"
                      value={parameter.flag}
                      onChange={(event) => updateParameter(index, 'flag', event.target.value)}
                      options={[
                        { value: 'normal', label: 'Normal' },
                        { value: 'low', label: 'Low' },
                        { value: 'high', label: 'High' },
                      ]}
                    />
                  </div>
                  {parameters.length > 1 && (
                    <Button type="button" size="sm" variant="danger" onClick={() => setParameters((current) => current.filter((_, parameterIndex) => parameterIndex !== index))}>
                      Remove result
                    </Button>
                  )}
                </div>
              ))}
              <Button type="button" variant="outline" onClick={() => setParameters((current) => [...current, newParameter()])}>
                Add another result
              </Button>
              <FormField label="Summary / notes" name="summary" as="textarea" value={summary} onChange={(event) => setSummary(event.target.value)} rows={3} />
              <div className="modal-footer">
                <Button variant="secondary" type="button" onClick={() => setActiveReport(null)}>Cancel</Button>
                <Button variant="outline" type="submit" loading={saving}>Save progress</Button>
                <Button variant="primary" type="button" loading={saving} onClick={(event) => saveResults(event, true)}>
                  Complete & share with patient
                </Button>
              </div>
            </form>
          )}
        </Modal>
      )}
    </div>
  );
};

export default LabTechnicianDashboard;
