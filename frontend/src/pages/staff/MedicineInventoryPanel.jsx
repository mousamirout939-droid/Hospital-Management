import { useCallback, useEffect, useState } from 'react';
import { medicineInventoryService } from '../../services/medicineInventoryService';
import { extractErrorMessage } from '../../services/api';
import Alert from '../../components/common/Alert';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import EmptyState from '../../components/common/EmptyState';
import FormField from '../../components/common/FormField';
import LoadingScreen from '../../components/common/LoadingScreen';
import Modal from '../../components/common/Modal';
import { formatDate } from '../../utils/formatters';

const emptyForm = {
  medicineName: '',
  category: '',
  batchNumber: '',
  quantity: '',
  unit: 'units',
  reorderLevel: '10',
  expiryDate: '',
  supplier: '',
};

const getExpiryValue = (expiryDate) => (expiryDate ? new Date(expiryDate).toISOString().slice(0, 10) : '');

const getStockStatus = (item) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (item.expiryDate && new Date(item.expiryDate) < today) return 'expired';
  if (item.quantity <= item.reorderLevel) return 'low stock';
  if (item.expiryDate) {
    const daysUntilExpiry = (new Date(item.expiryDate) - today) / (1000 * 60 * 60 * 24);
    if (daysUntilExpiry <= 30) return 'expiring soon';
  }
  return 'in stock';
};

const MedicineInventoryPanel = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [feedback, setFeedback] = useState('');
  const [activeItem, setActiveItem] = useState(null);
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const loadInventory = useCallback(async () => {
    setError('');
    try {
      const response = await medicineInventoryService.getAll();
      setItems(response.data.data);
    } catch (loadError) {
      setError(extractErrorMessage(loadError));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadInventory();
  }, [loadInventory]);

  const openForm = (item = null) => {
    setActiveItem(item);
    setFormOpen(true);
    setForm(item ? {
      medicineName: item.medicineName,
      category: item.category || '',
      batchNumber: item.batchNumber || '',
      quantity: String(item.quantity),
      unit: item.unit || 'units',
      reorderLevel: String(item.reorderLevel),
      expiryDate: getExpiryValue(item.expiryDate),
      supplier: item.supplier || '',
    } : emptyForm);
    setFeedback('');
  };

  const saveItem = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    setFeedback('');

    const payload = {
      ...form,
      quantity: Number(form.quantity),
      reorderLevel: Number(form.reorderLevel),
      expiryDate: form.expiryDate || null,
    };

    try {
      if (activeItem) {
        await medicineInventoryService.update(activeItem._id, payload);
        setFeedback('Medicine stock details updated.');
      } else {
        await medicineInventoryService.create(payload);
        setFeedback('Medicine added to inventory.');
      }
      setActiveItem(null);
      setFormOpen(false);
      await loadInventory();
    } catch (saveError) {
      setError(extractErrorMessage(saveError));
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingScreen message="Loading medicine inventory…" />;

  return (
    <section className="card staff-queue-card" style={{ marginTop: 24 }}>
      <div className="section-title-row">
        <div>
          <h3 className="card-title">Medicine inventory</h3>
          <p className="text-faint">Track quantities, reorder thresholds, batches, and expiry dates.</p>
        </div>
        <Button variant="primary" onClick={() => openForm()}>Add medicine</Button>
      </div>

      {error && <Alert type="danger">{error}</Alert>}
      {feedback && <Alert type="success">{feedback}</Alert>}

      {items.length === 0 ? (
        <EmptyState title="No medicines in inventory" message="Add your first medicine to start tracking stock." />
      ) : (
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Medicine</th>
                <th>Batch / Supplier</th>
                <th>Stock</th>
                <th>Reorder at</th>
                <th>Expiry</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => {
                const stockStatus = getStockStatus(item);
                const badgeStatus = stockStatus === 'in stock' ? 'completed' :
                  stockStatus === 'expiring soon' ? 'pending' : 'cancelled';
                return (
                  <tr key={item._id}>
                    <td>
                      <strong>{item.medicineName}</strong>
                      <div className="text-faint">{item.category || 'General'}</div>
                    </td>
                    <td>
                      {item.batchNumber || '—'}
                      <div className="text-faint">{item.supplier || 'No supplier listed'}</div>
                    </td>
                    <td>{item.quantity} {item.unit}</td>
                    <td>{item.reorderLevel} {item.unit}</td>
                    <td>{item.expiryDate ? formatDate(item.expiryDate) : '—'}</td>
                    <td><Badge status={badgeStatus} /> <span>{stockStatus}</span></td>
                    <td>
                      <Button size="sm" variant="outline" onClick={() => openForm(item)}>Update stock</Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {formOpen && (
        <Modal
          title={activeItem?._id ? 'Update medicine stock' : 'Add medicine'}
          onClose={() => { setActiveItem(null); setFormOpen(false); }}
        >
          <form onSubmit={saveItem}>
            <FormField label="Medicine name" name="medicineName" value={form.medicineName} onChange={(event) => setForm({ ...form, medicineName: event.target.value })} required maxLength={120} />
            <div className="field-row">
              <FormField label="Category" name="category" value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })} placeholder="e.g. Antibiotic" />
              <FormField label="Batch number" name="batchNumber" value={form.batchNumber} onChange={(event) => setForm({ ...form, batchNumber: event.target.value })} />
            </div>
            <div className="field-row">
              <FormField label="Quantity in stock" name="quantity" type="number" value={form.quantity} onChange={(event) => setForm({ ...form, quantity: event.target.value })} min={0} step={1} required />
              <FormField label="Unit" name="unit" value={form.unit} onChange={(event) => setForm({ ...form, unit: event.target.value })} placeholder="tablets, bottles, packs" required />
            </div>
            <div className="field-row">
              <FormField label="Low-stock alert at" name="reorderLevel" type="number" value={form.reorderLevel} onChange={(event) => setForm({ ...form, reorderLevel: event.target.value })} min={0} step={1} required />
              <FormField label="Expiry date" name="expiryDate" type="date" value={form.expiryDate} onChange={(event) => setForm({ ...form, expiryDate: event.target.value })} />
            </div>
            <FormField label="Supplier" name="supplier" value={form.supplier} onChange={(event) => setForm({ ...form, supplier: event.target.value })} />
            <div className="modal-footer">
              <Button variant="secondary" type="button" onClick={() => { setActiveItem(null); setFormOpen(false); }}>Cancel</Button>
              <Button variant="primary" type="submit" loading={saving}>{activeItem?._id ? 'Save stock details' : 'Add to inventory'}</Button>
            </div>
          </form>
        </Modal>
      )}
    </section>
  );
};

export default MedicineInventoryPanel;
