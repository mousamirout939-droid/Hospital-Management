import { useState } from 'react';
import Modal from '../common/Modal';
import Button from '../common/Button';
import FormField from '../common/FormField';
import Alert from '../common/Alert';
import PatientSelect from './PatientSelect';
import DoctorSelect from './DoctorSelect';
import { invoiceService } from '../../services/invoiceService';
import { extractErrorMessage } from '../../services/api';
import { formatCurrency } from '../../utils/formatters';

const emptyItem = { description: '', quantity: 1, unitPrice: 0 };

const CreateInvoiceModal = ({ onClose, onSaved }) => {
  const [patient, setPatient] = useState('');
  const [doctor, setDoctor] = useState('');
  const [items, setItems] = useState([{ ...emptyItem }]);
  const [taxPercent, setTaxPercent] = useState(0);
  const [discount, setDiscount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState('pending');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleItemChange = (idx, field, value) => {
    setItems((prev) => prev.map((item, i) => (i === idx ? { ...item, [field]: value } : item)));
  };
  const addItem = () => setItems((prev) => [...prev, { ...emptyItem }]);
  const removeItem = (idx) => setItems((prev) => prev.filter((_, i) => i !== idx));

  const subtotal = items.reduce((sum, item) => sum + (Number(item.quantity) || 0) * (Number(item.unitPrice) || 0), 0);
  const taxAmount = (subtotal * (Number(taxPercent) || 0)) / 100;
  const total = Math.max(subtotal + taxAmount - (Number(discount) || 0), 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!patient) {
      setError('Please select a patient');
      return;
    }
    const invalidItem = items.some((i) => !i.description || Number(i.unitPrice) < 0);
    if (invalidItem) {
      setError('Please provide a description and valid price for every item');
      return;
    }

    setSubmitting(true);
    try {
      await invoiceService.create({
        patient,
        doctor: doctor || undefined,
        items: items.map((i) => ({ ...i, quantity: Number(i.quantity), unitPrice: Number(i.unitPrice) })),
        taxPercent: Number(taxPercent),
        discount: Number(discount),
        paymentMethod,
        notes,
      });
      onSaved();
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal title="Create Invoice" onClose={onClose} maxWidth="680px">
      {error && <Alert type="danger">{error}</Alert>}

      <form onSubmit={handleSubmit}>
        <PatientSelect value={patient} onChange={setPatient} required />
        <DoctorSelect value={doctor} onChange={setDoctor} label="Related Doctor (optional)" />

        <div className="field-group">
          <label className="field-label">Billing Items</label>
          {items.map((item, idx) => (
            <div key={idx} className="flex gap-2 mt-2" style={{ alignItems: 'center' }}>
              <input
                className="field-input"
                placeholder="Description (e.g. Consultation Fee)"
                value={item.description}
                onChange={(e) => handleItemChange(idx, 'description', e.target.value)}
                style={{ flex: 2 }}
              />
              <input
                className="field-input"
                type="number"
                min="1"
                placeholder="Qty"
                value={item.quantity}
                onChange={(e) => handleItemChange(idx, 'quantity', e.target.value)}
                style={{ flex: 0.6 }}
              />
              <input
                className="field-input"
                type="number"
                min="0"
                placeholder="Unit Price"
                value={item.unitPrice}
                onChange={(e) => handleItemChange(idx, 'unitPrice', e.target.value)}
                style={{ flex: 1 }}
              />
              {items.length > 1 && (
                <button type="button" onClick={() => removeItem(idx)} className="btn btn-ghost btn-icon">
                  ×
                </button>
              )}
            </div>
          ))}
          <Button type="button" variant="outline" size="sm" onClick={addItem} style={{ marginTop: 8 }}>
            + Add Item
          </Button>
        </div>

        <div className="field-row">
          <FormField label="Tax (%)" name="taxPercent" type="number" min="0" value={taxPercent} onChange={(e) => setTaxPercent(e.target.value)} />
          <FormField label="Discount (₹)" name="discount" type="number" min="0" value={discount} onChange={(e) => setDiscount(e.target.value)} />
        </div>

        <FormField
          label="Payment Method"
          name="paymentMethod"
          as="select"
          value={paymentMethod}
          onChange={(e) => setPaymentMethod(e.target.value)}
          options={[
            { value: 'pending', label: 'Not yet decided' },
            { value: 'cash', label: 'Cash' },
            { value: 'card', label: 'Card' },
            { value: 'upi', label: 'UPI' },
            { value: 'insurance', label: 'Insurance' },
            { value: 'bank-transfer', label: 'Bank Transfer' },
          ]}
        />

        <FormField label="Notes" name="notes" as="textarea" rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />

        <div className="card card-compact" style={{ background: 'var(--color-primary-light)', border: 'none' }}>
          <div className="doc-sheet-total-row">
            <span>Subtotal</span>
            <span>{formatCurrency(subtotal)}</span>
          </div>
          <div className="doc-sheet-total-row">
            <span>Tax</span>
            <span>{formatCurrency(taxAmount)}</span>
          </div>
          <div className="doc-sheet-total-row grand">
            <span>Total</span>
            <span>{formatCurrency(total)}</span>
          </div>
        </div>

        <div className="modal-footer">
          <Button variant="secondary" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" type="submit" loading={submitting}>
            Create Invoice
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default CreateInvoiceModal;
