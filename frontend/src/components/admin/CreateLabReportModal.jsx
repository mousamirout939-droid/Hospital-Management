import { useState } from 'react';
import Modal from '../common/Modal';
import Button from '../common/Button';
import FormField from '../common/FormField';
import Alert from '../common/Alert';
import PatientSelect from './PatientSelect';
import DoctorSelect from './DoctorSelect';
import { labReportService } from '../../services/labReportService';
import { extractErrorMessage } from '../../services/api';

const emptyParam = { parameterName: '', result: '', unit: '', normalRange: '', flag: 'normal' };

const CreateLabReportModal = ({ onClose, onSaved }) => {
  const [patient, setPatient] = useState('');
  const [doctor, setDoctor] = useState('');
  const [testName, setTestName] = useState('');
  const [testType, setTestType] = useState('General');
  const [status, setStatus] = useState('pending');
  const [summary, setSummary] = useState('');
  const [parameters, setParameters] = useState([{ ...emptyParam }]);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleParamChange = (idx, field, value) => {
    setParameters((prev) => prev.map((p, i) => (i === idx ? { ...p, [field]: value } : p)));
  };
  const addParam = () => setParameters((prev) => [...prev, { ...emptyParam }]);
  const removeParam = (idx) => setParameters((prev) => prev.filter((_, i) => i !== idx));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!patient || !testName) {
      setError('Please select a patient and provide a test name');
      return;
    }

    setSubmitting(true);
    try {
      const validParams = parameters.filter((p) => p.parameterName && p.result);
      await labReportService.create({
        patient,
        doctor: doctor || undefined,
        testName,
        testType,
        status,
        summary,
        parameters: validParams,
      });
      onSaved();
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal title="Create Lab Report" onClose={onClose} maxWidth="680px">
      {error && <Alert type="danger">{error}</Alert>}

      <form onSubmit={handleSubmit}>
        <PatientSelect value={patient} onChange={setPatient} required />
        <DoctorSelect value={doctor} onChange={setDoctor} label="Referring Doctor (optional)" />

        <div className="field-row">
          <FormField label="Test Name" name="testName" value={testName} onChange={(e) => setTestName(e.target.value)} required placeholder="e.g. Complete Blood Count" />
          <FormField label="Test Type" name="testType" value={testType} onChange={(e) => setTestType(e.target.value)} placeholder="e.g. Hematology" />
        </div>

        <FormField
          label="Status"
          name="status"
          as="select"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          options={[
            { value: 'pending', label: 'Pending' },
            { value: 'in-progress', label: 'In Progress' },
            { value: 'completed', label: 'Completed' },
          ]}
        />

        <div className="field-group">
          <label className="field-label">Test Parameters</label>
          {parameters.map((p, idx) => (
            <div key={idx} className="card card-compact" style={{ marginBottom: 12 }}>
              <div className="field-row">
                <input className="field-input" placeholder="Parameter (e.g. Hemoglobin)" value={p.parameterName} onChange={(e) => handleParamChange(idx, 'parameterName', e.target.value)} />
                <input className="field-input" placeholder="Result" value={p.result} onChange={(e) => handleParamChange(idx, 'result', e.target.value)} />
              </div>
              <div className="field-row mt-2">
                <input className="field-input" placeholder="Unit (e.g. g/dL)" value={p.unit} onChange={(e) => handleParamChange(idx, 'unit', e.target.value)} />
                <input className="field-input" placeholder="Normal Range (e.g. 13-17)" value={p.normalRange} onChange={(e) => handleParamChange(idx, 'normalRange', e.target.value)} />
              </div>
              <select className="field-select mt-2" value={p.flag} onChange={(e) => handleParamChange(idx, 'flag', e.target.value)}>
                <option value="normal">Normal</option>
                <option value="low">Low</option>
                <option value="high">High</option>
              </select>
              {parameters.length > 1 && (
                <button type="button" onClick={() => removeParam(idx)} className="btn btn-ghost btn-sm mt-2">
                  Remove
                </button>
              )}
            </div>
          ))}
          <Button type="button" variant="outline" size="sm" onClick={addParam}>
            + Add Parameter
          </Button>
        </div>

        <FormField label="Summary" name="summary" as="textarea" rows={2} value={summary} onChange={(e) => setSummary(e.target.value)} />

        <div className="modal-footer">
          <Button variant="secondary" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" type="submit" loading={submitting}>
            Save Report
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default CreateLabReportModal;
