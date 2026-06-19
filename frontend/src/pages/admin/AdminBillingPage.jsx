import { useEffect, useState, useCallback } from 'react';
import { invoiceService } from '../../services/invoiceService';
import { extractErrorMessage } from '../../services/api';
import CreateInvoiceModal from '../../components/admin/CreateInvoiceModal';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import EmptyState from '../../components/common/EmptyState';
import LoadingScreen from '../../components/common/LoadingScreen';
import Alert from '../../components/common/Alert';
import Pagination from '../../components/common/Pagination';
import Modal from '../../components/common/Modal';
import FormField from '../../components/common/FormField';
import { formatDate, formatCurrency } from '../../utils/formatters';
import { IconPlus } from '../../components/common/Icons';

const AdminBillingPage = () => {
  const [invoices, setInvoices] = useState([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [payTarget, setPayTarget] = useState(null);
  const [payAmount, setPayAmount] = useState('');
  const [payMethod, setPayMethod] = useState('cash');
  const [paying, setPaying] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await invoiceService.getAll({ paymentStatus: statusFilter || undefined, page, limit: 10 });
      setInvoices(res.data.data);
      setPagination(res.data.pagination);
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [statusFilter, page]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSaved = () => {
    setShowCreate(false);
    setFeedback('Invoice created successfully.');
    fetchData();
    setTimeout(() => setFeedback(''), 4000);
  };

  const openPayModal = (invoice) => {
    setPayTarget(invoice);
    setPayAmount((invoice.totalAmount - invoice.paidAmount).toFixed(2));
    setPayMethod('cash');
  };

  const handleRecordPayment = async () => {
    setPaying(true);
    try {
      await invoiceService.recordPayment(payTarget._id, { amount: payAmount, paymentMethod: payMethod });
      setPayTarget(null);
      fetchData();
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setPaying(false);
    }
  };

  return (
    <div>
      {feedback && <Alert type="success">{feedback}</Alert>}
      {error && <Alert type="danger">{error}</Alert>}

      <div className="tabs-row" style={{ justifyContent: 'space-between' }}>
        <div className="flex gap-2">
          {['', 'unpaid', 'partially-paid', 'paid'].map((s) => (
            <button
              key={s}
              className={`tab-btn ${statusFilter === s ? 'active' : ''}`}
              onClick={() => {
                setStatusFilter(s);
                setPage(1);
              }}
            >
              {s === '' ? 'All' : s.split('-').map((w) => w[0].toUpperCase() + w.slice(1)).join(' ')}
            </button>
          ))}
        </div>
        <Button variant="primary" onClick={() => setShowCreate(true)} style={{ marginBottom: 8 }}>
          <IconPlus width={16} height={16} /> Create Invoice
        </Button>
      </div>

      {loading ? (
        <LoadingScreen message="Loading invoices…" />
      ) : invoices.length === 0 ? (
        <EmptyState title="No invoices found" message="Create a new invoice to get started." />
      ) : (
        <>
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Invoice #</th>
                  <th>Patient</th>
                  <th>Date</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((inv) => (
                  <tr key={inv._id}>
                    <td className="text-mono">{inv.invoiceNumber}</td>
                    <td>{inv.patient?.name}</td>
                    <td>{formatDate(inv.createdAt)}</td>
                    <td>{formatCurrency(inv.totalAmount)}</td>
                    <td>
                      <Badge status={inv.paymentStatus} />
                    </td>
                    <td>
                      {inv.paymentStatus !== 'paid' && (
                        <Button size="sm" variant="outline" onClick={() => openPayModal(inv)}>
                          Record Payment
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

      {showCreate && <CreateInvoiceModal onClose={() => setShowCreate(false)} onSaved={handleSaved} />}

      {payTarget && (
        <Modal
          title={`Record Payment — ${payTarget.invoiceNumber}`}
          onClose={() => setPayTarget(null)}
          footer={
            <>
              <Button variant="secondary" onClick={() => setPayTarget(null)}>
                Cancel
              </Button>
              <Button variant="primary" onClick={handleRecordPayment} loading={paying}>
                Record Payment
              </Button>
            </>
          }
        >
          <p className="text-soft mb-2" style={{ fontSize: '0.85rem' }}>
            Total: {formatCurrency(payTarget.totalAmount)} • Already paid: {formatCurrency(payTarget.paidAmount)}
          </p>
          <FormField label="Amount Received" name="amount" type="number" min="0" value={payAmount} onChange={(e) => setPayAmount(e.target.value)} required />
          <FormField
            label="Payment Method"
            name="paymentMethod"
            as="select"
            value={payMethod}
            onChange={(e) => setPayMethod(e.target.value)}
            options={[
              { value: 'cash', label: 'Cash' },
              { value: 'card', label: 'Card' },
              { value: 'upi', label: 'UPI' },
              { value: 'insurance', label: 'Insurance' },
              { value: 'bank-transfer', label: 'Bank Transfer' },
            ]}
          />
        </Modal>
      )}
    </div>
  );
};

export default AdminBillingPage;
