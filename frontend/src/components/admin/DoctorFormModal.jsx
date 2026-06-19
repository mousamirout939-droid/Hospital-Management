import { useState } from 'react';
import Modal from '../common/Modal';
import Button from '../common/Button';
import FormField from '../common/FormField';
import Alert from '../common/Alert';
import { doctorService } from '../../services/doctorService';
import { extractErrorMessage } from '../../services/api';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const emptySlot = { day: 'Monday', startTime: '09:00', endTime: '17:00' };

const DoctorFormModal = ({ doctor, onClose, onSaved }) => {
  const isEdit = !!doctor;
  const [form, setForm] = useState({
    name: doctor?.name || '',
    email: doctor?.email || '',
    phone: doctor?.phone || '',
    specialization: doctor?.specialization || '',
    department: doctor?.department || '',
    qualification: doctor?.qualification || '',
    experienceYears: doctor?.experienceYears ?? 0,
    consultationFee: doctor?.consultationFee ?? 0,
    bio: doctor?.bio || '',
    slotDurationMinutes: doctor?.slotDurationMinutes ?? 30,
  });
  const [availability, setAvailability] = useState(doctor?.availability?.length ? doctor.availability : [{ ...emptySlot }]);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSlotChange = (idx, field, value) => {
    setAvailability((prev) => prev.map((slot, i) => (i === idx ? { ...slot, [field]: value } : slot)));
  };

  const addSlot = () => setAvailability((prev) => [...prev, { ...emptySlot }]);
  const removeSlot = (idx) => setAvailability((prev) => prev.filter((_, i) => i !== idx));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    const payload = {
      ...form,
      experienceYears: Number(form.experienceYears),
      consultationFee: Number(form.consultationFee),
      slotDurationMinutes: Number(form.slotDurationMinutes),
      availability,
    };

    try {
      if (isEdit) {
        await doctorService.update(doctor._id, payload);
      } else {
        await doctorService.create(payload);
      }
      onSaved();
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal title={isEdit ? 'Edit Doctor' : 'Add New Doctor'} onClose={onClose} maxWidth="640px">
      {error && <Alert type="danger">{error}</Alert>}

      <form onSubmit={handleSubmit}>
        <div className="field-row">
          <FormField label="Full Name" name="name" value={form.name} onChange={handleChange} required />
          <FormField label="Email" name="email" type="email" value={form.email} onChange={handleChange} required />
        </div>
        <div className="field-row">
          <FormField label="Phone" name="phone" value={form.phone} onChange={handleChange} />
          <FormField label="Qualification" name="qualification" value={form.qualification} onChange={handleChange} placeholder="e.g. MBBS, MD" />
        </div>
        <div className="field-row">
          <FormField label="Specialization" name="specialization" value={form.specialization} onChange={handleChange} required placeholder="e.g. Cardiologist" />
          <FormField label="Department" name="department" value={form.department} onChange={handleChange} required placeholder="e.g. Cardiology" />
        </div>
        <div className="field-row">
          <FormField label="Experience (years)" name="experienceYears" type="number" min="0" value={form.experienceYears} onChange={handleChange} />
          <FormField label="Consultation Fee (₹)" name="consultationFee" type="number" min="0" value={form.consultationFee} onChange={handleChange} required />
        </div>
        <FormField label="Bio" name="bio" as="textarea" rows={2} value={form.bio} onChange={handleChange} placeholder="Short professional bio" />
        <FormField label="Slot Duration (minutes)" name="slotDurationMinutes" type="number" min="10" step="5" value={form.slotDurationMinutes} onChange={handleChange} />

        <div className="field-group">
          <label className="field-label">Weekly Availability</label>
          {availability.map((slot, idx) => (
            <div key={idx} className="flex gap-2 mt-2" style={{ alignItems: 'center' }}>
              <select className="field-select" value={slot.day} onChange={(e) => handleSlotChange(idx, 'day', e.target.value)} style={{ flex: 1.2 }}>
                {DAYS.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
              <input type="time" className="field-input" value={slot.startTime} onChange={(e) => handleSlotChange(idx, 'startTime', e.target.value)} style={{ flex: 1 }} />
              <input type="time" className="field-input" value={slot.endTime} onChange={(e) => handleSlotChange(idx, 'endTime', e.target.value)} style={{ flex: 1 }} />
              <button type="button" onClick={() => removeSlot(idx)} className="btn btn-ghost btn-icon" aria-label="Remove slot">
                ×
              </button>
            </div>
          ))}
          <Button type="button" variant="outline" size="sm" onClick={addSlot} style={{ marginTop: 8 }}>
            + Add Time Slot
          </Button>
        </div>

        <div className="modal-footer">
          <Button variant="secondary" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" type="submit" loading={submitting}>
            {isEdit ? 'Save Changes' : 'Add Doctor'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default DoctorFormModal;
