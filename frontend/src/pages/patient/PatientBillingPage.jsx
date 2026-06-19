import { useEffect, useState, useCallback } from 'react';
import { invoiceService } from '../../services/invoiceService';
import { extractErrorMessage } from '../../services/api';
import EmptyState from '../../components/common/EmptyState';
import LoadingScreen from '../../components/common/LoadingScreen';
import Alert from '../../components/common/Alert';
import Badge from '../../components/common/Badge';
import Pagination from '../../components/common/Pagination';
import Modal from '../../components/common/Modal';
import { formatDate, formatCurrency } from '../../utils/formatters';

const PatientBillingPage = () => {
  const [invoices, setInvoices] = useState([]);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selected, setSelected] = useState(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await invoiceService.getMy({ page, limit: 8 });
      setInvoices(res.data.data);
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

  if (loading) return <LoadingScreen message="Loading your invoices…" />;

  return (
    <div>
      {error && <Alert type="danger">{error}</Alert>}

      {invoices.length === 0 ? (
        <EmptyState title="No invoices yet" message="Your billing history will appear here." />
      ) : (
        <>
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Invoice #</th>
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
                    <td>{formatDate(inv.createdAt)}</td>
                    <td>{formatCurrency(inv.totalAmount)}</td>
                    <td>
                      <Badge status={inv.paymentStatus} />
                    </td>
                    <td>
                      <button
                        onClick={() => setSelected(inv)}
                        style={{ background: 'none', border: 'none', color: 'var(--color-primary)', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem' }}
                      >
                        View Invoice
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
        <Modal title="" onClose={() => setSelected(null)} maxWidth="640px">
          <div className="doc-sheet" style={{ border: 'none', padding: 0 }}>
            <div className="doc-sheet-header">
              <div>
                <div className="doc-sheet-title">Invoice</div>
                <div className="doc-sheet-number">{selected.invoiceNumber}</div>
              </div>
              <Badge status={selected.paymentStatus} />
            </div>

            <div className="doc-sheet-grid">
              <div>
                <div className="doc-sheet-label">Billed To</div>
                <div className="doc-sheet-value">{selected.patient?.name}</div>
              </div>
              <div>
                <div className="doc-sheet-label">Date</div>
                <div className="doc-sheet-value">{formatDate(selected.createdAt)}</div>
              </div>
            </div>

            <div className="table-wrap" style={{ marginBottom: 20 }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Description</th>
                    <th>Qty</th>
                    <th>Unit Price</th>
                    <th>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {selected.items.map((item, idx) => (
                    <tr key={idx}>
                      <td>{item.description}</td>
                      <td>{item.quantity}</td>
                      <td>{formatCurrency(item.unitPrice)}</td>
                      <td>{formatCurrency(item.total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="doc-sheet-total-row">
              <span>Subtotal</span>
              <span>{formatCurrency(selected.subtotal)}</span>
            </div>
            {selected.taxAmount > 0 && (
              <div className="doc-sheet-total-row">
                <span>Tax ({selected.taxPercent}%)</span>
                <span>{formatCurrency(selected.taxAmount)}</span>
              </div>
            )}
            {selected.discount > 0 && (
              <div className="doc-sheet-total-row">
                <span>Discount</span>
                <span>-{formatCurrency(selected.discount)}</span>
              </div>
            )}
            <div className="doc-sheet-total-row grand">
              <span>Total Amount</span>
              <span>{formatCurrency(selected.totalAmount)}</span>
            </div>
            {selected.paidAmount > 0 && (
              <div className="doc-sheet-total-row">
                <span>Paid</span>
                <span>{formatCurrency(selected.paidAmount)}</span>
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
};

export default PatientBillingPage;
