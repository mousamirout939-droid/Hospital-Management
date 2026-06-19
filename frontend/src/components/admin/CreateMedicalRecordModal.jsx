import { useState } from 'react';
import Modal from '../common/Modal';
import Button from '../common/Button';
import FormField from '../common/FormField';
import Alert from '../common/Alert';
import PatientSelect from './PatientSelect';
import DoctorSelect from './DoctorSelect';
import { medicalRecordService } from '../../services/medicalRecordService';
import { extractErrorMessage } from '../../services/api';

const CreateMedicalRecordModal = ({ onClose, onSaved }) => {
  const [form, setForm] = useState({
    patient: '',
    doctor: '',
    diagnosis: '',
    symptoms: '',
    treatmentPlan: '',
    notes: '',
  });
  const [vitals, setVitals] = useState({ bloodPressure: '', heartRate: '', temperature: '', weight: '', height: '' });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!form.patient || !form.doctor) {
      setError('Please select both a patient and a doctor');
      return;
    }

    setSubmitting(true);
    try {
      await medicalRecordService.create({ ...form, vitals });
      onSaved();
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal title="Add Medical Record" onClose={onClose} maxWidth="620px">
      {error && <Alert type="danger">{error}</Alert>}

      <form onSubmit={handleSubmit}>
        <PatientSelect value={form.patient} onChange={(id) => setForm({ ...form, patient: id })} required />
        <DoctorSelect value={form.doctor} onChange={(id) => setForm({ ...form, doctor: id })} required />

        <FormField
          label="Diagnosis"
          name="diagnosis"
          as="textarea"
          rows={2}
          value={form.diagnosis}
          onChange={(e) => setForm({ ...form, diagnosis: e.target.value })}
          required
        />
        <FormField
          label="Symptoms"
          name="symptoms"
          as="textarea"
          rows={2}
          value={form.symptoms}
          onChange={(e) => setForm({ ...form, symptoms: e.target.value })}
        />
        <FormField
          label="Treatment Plan"
          name="treatmentPlan"
          as="textarea"
          rows={2}
          value={form.treatmentPlan}
          onChange={(e) => setForm({ ...form, treatmentPlan: e.target.value })}
        />

        <div className="field-group">
          <label className="field-label">Vitals</label>
          <div className="field-row">
            <input className="field-input" placeholder="Blood Pressure (e.g. 120/80)" value={vitals.bloodPressure} onChange={(e) => setVitals({ ...vitals, bloodPressure: e.target.value })} />
            <input className="field-input" placeholder="Heart Rate (e.g. 72 bpm)" value={vitals.heartRate} onChange={(e) => setVitals({ ...vitals, heartRate: e.target.value })} />
          </div>
          <div className="field-row mt-2">
            <input className="field-input" placeholder="Temperature (e.g. 98.6°F)" value={vitals.temperature} onChange={(e) => setVitals({ ...vitals, temperature: e.target.value })} />
            <input className="field-input" placeholder="Weight (e.g. 70kg)" value={vitals.weight} onChange={(e) => setVitals({ ...vitals, weight: e.target.value })} />
          </div>
        </div>

        <FormField
          label="Additional Notes"
          name="notes"
          as="textarea"
          rows={2}
          value={form.notes}
          onChange={(e) => setForm({ ...form, notes: e.target.value })}
        />

        <div className="modal-footer">
          <Button variant="secondary" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" type="submit" loading={submitting}>
            Save Record
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default CreateMedicalRecordModal;
