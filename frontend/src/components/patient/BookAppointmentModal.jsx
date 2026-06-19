import { useState, useEffect } from 'react';
import Modal from '../common/Modal';
import Button from '../common/Button';
import FormField from '../common/FormField';
import Alert from '../common/Alert';
import { doctorService } from '../../services/doctorService';
import { appointmentService } from '../../services/appointmentService';
import { extractErrorMessage } from '../../services/api';
import { formatCurrency } from '../../utils/formatters';

const getNextDays = (count) => {
  const days = [];
  for (let i = 0; i < count; i++) {
    const d = new Date();
    d.setDate(d.getDate() + i);
    days.push(d);
  }
  return days;
};

const BookAppointmentModal = ({ doctor, onClose, onSuccess }) => {
  const dateOptions = getNextDays(14);
  const [selectedDate, setSelectedDate] = useState(dateOptions[0]);
  const [slots, setSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState('');
  const [reason, setReason] = useState('');
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const fetchSlots = async (date) => {
    setLoadingSlots(true);
    setSelectedSlot('');
    setError('');
    try {
      const dateStr = date.toISOString().split('T')[0];
      const res = await doctorService.getAvailableSlots(doctor._id, dateStr);
      setSlots(res.data.data);
    } catch (err) {
      setError(extractErrorMessage(err));
      setSlots([]);
    } finally {
      setLoadingSlots(false);
    }
  };

  useEffect(() => {
    fetchSlots(selectedDate);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleDateSelect = (date) => {
    setSelectedDate(date);
    fetchSlots(date);
  };

  const handleSubmit = async () => {
    if (!selectedSlot) {
      setError('Please select a time slot');
      return;
    }
    if (!reason.trim()) {
      setError('Please provide a reason for your visit');
      return;
    }

    setSubmitting(true);
    setError('');
    try {
      await appointmentService.book({
        doctorId: doctor._id,
        appointmentDate: selectedDate.toISOString().split('T')[0],
        timeSlot: selectedSlot,
        reasonForVisit: reason,
      });
      onSuccess();
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal title={`Book with ${doctor.name}`} onClose={onClose} maxWidth="560px">
      <p className="text-soft" style={{ marginBottom: 20, fontSize: '0.88rem' }}>
        {doctor.specialization} • Consultation fee: <strong>{formatCurrency(doctor.consultationFee)}</strong>
      </p>

      {error && <Alert type="danger">{error}</Alert>}

      <div className="field-group">
        <label className="field-label">Select Date</label>
        <div className="date-picker-row">
          {dateOptions.map((date) => {
            const isSelected = date.toDateString() === selectedDate.toDateString();
            return (
              <button
                type="button"
                key={date.toISOString()}
                className={`date-chip ${isSelected ? 'selected' : ''}`}
                onClick={() => handleDateSelect(date)}
              >
                <div className="date-chip-day">{date.toLocaleDateString('en-US', { weekday: 'short' })}</div>
                <div className="date-chip-num">{date.getDate()}</div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="field-group">
        <label className="field-label">Available Time Slots</label>
        {loadingSlots ? (
          <p className="text-faint" style={{ fontSize: '0.85rem' }}>
            Loading slots…
          </p>
        ) : slots.length === 0 ? (
          <p className="text-faint" style={{ fontSize: '0.85rem' }}>
            No slots available on this date. Please try another day.
          </p>
        ) : (
          <div className="slot-grid">
            {slots.map((slot) => (
              <button
                type="button"
                key={slot}
                className={`slot-btn ${selectedSlot === slot ? 'selected' : ''}`}
                onClick={() => setSelectedSlot(slot)}
              >
                {slot}
              </button>
            ))}
          </div>
        )}
      </div>

      <FormField
        label="Reason for visit"
        name="reason"
        as="textarea"
        rows={3}
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        placeholder="Briefly describe your symptoms or reason for the appointment"
        required
      />

      <div className="modal-footer">
        <Button variant="secondary" onClick={onClose}>
          Cancel
        </Button>
        <Button variant="primary" onClick={handleSubmit} loading={submitting} disabled={!selectedSlot}>
          Confirm Booking
        </Button>
      </div>
    </Modal>
  );
};

export default BookAppointmentModal;
