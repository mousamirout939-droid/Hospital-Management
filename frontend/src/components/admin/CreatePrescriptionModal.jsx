import { useState } from 'react';
import Modal from '../common/Modal';
import Button from '../common/Button';
import FormField from '../common/FormField';
import Alert from '../common/Alert';
import PatientSelect from './PatientSelect';
import DoctorSelect from './DoctorSelect';
import { prescriptionService } from '../../services/prescriptionService';
import { extractErrorMessage } from '../../services/api';

const emptyMedicine = { medicineName: '', dosage: '', frequency: '', duration: '', instructions: '' };

const CreatePrescriptionModal = ({ onClose, onSaved }) => {
  const [patient, setPatient] = useState('');
  const [doctor, setDoctor] = useState('');
  const [medicines, setMedicines] = useState([{ ...emptyMedicine }]);
  const [additionalNotes, setAdditionalNotes] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleMedChange = (idx, field, value) => {
    setMedicines((prev) => prev.map((m, i) => (i === idx ? { ...m, [field]: value } : m)));
  };

  const addMedicine = () => setMedicines((prev) => [...prev, { ...emptyMedicine }]);
  const removeMedicine = (idx) => setMedicines((prev) => prev.filter((_, i) => i !== idx));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!patient || !doctor) {
      setError('Please select both a patient and a doctor');
      return;
    }
    const invalidMed = medicines.some((m) => !m.medicineName || !m.dosage || !m.frequency || !m.duration);
    if (invalidMed) {
      setError('Please fill in name, dosage, frequency, and duration for every medicine');
      return;
    }

    setSubmitting(true);
    try {
      await prescriptionService.create({ patient, doctor, medicines, additionalNotes });
      onSaved();
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal title="Issue New Prescription" onClose={onClose} maxWidth="680px">
      {error && <Alert type="danger">{error}</Alert>}

      <form onSubmit={handleSubmit}>
        <PatientSelect value={patient} onChange={setPatient} required />
        <DoctorSelect value={doctor} onChange={setDoctor} required />

        <div className="field-group">
          <label className="field-label">Medicines</label>
          {medicines.map((med, idx) => (
            <div key={idx} className="card card-compact" style={{ marginBottom: 12 }}>
              <div className="field-row">
                <input className="field-input" placeholder="Medicine name" value={med.medicineName} onChange={(e) => handleMedChange(idx, 'medicineName', e.target.value)} />
                <input className="field-input" placeholder="Dosage (e.g. 500mg)" value={med.dosage} onChange={(e) => handleMedChange(idx, 'dosage', e.target.value)} />
              </div>
              <div className="field-row mt-2">
                <input className="field-input" placeholder="Frequency (e.g. Twice a day)" value={med.frequency} onChange={(e) => handleMedChange(idx, 'frequency', e.target.value)} />
                <input className="field-input" placeholder="Duration (e.g. 5 days)" value={med.duration} onChange={(e) => handleMedChange(idx, 'duration', e.target.value)} />
              </div>
              <input
                className="field-input mt-2"
                placeholder="Instructions (e.g. After food)"
                value={med.instructions}
                onChange={(e) => handleMedChange(idx, 'instructions', e.target.value)}
              />
              {medicines.length > 1 && (
                <button type="button" onClick={() => removeMedicine(idx)} className="btn btn-ghost btn-sm mt-2">
                  Remove
                </button>
              )}
            </div>
          ))}
          <Button type="button" variant="outline" size="sm" onClick={addMedicine}>
            + Add Another Medicine
          </Button>
        </div>

        <FormField
          label="Additional Notes"
          name="additionalNotes"
          as="textarea"
          rows={2}
          value={additionalNotes}
          onChange={(e) => setAdditionalNotes(e.target.value)}
        />

        <div className="modal-footer">
          <Button variant="secondary" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" type="submit" loading={submitting}>
            Issue Prescription
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default CreatePrescriptionModal;
