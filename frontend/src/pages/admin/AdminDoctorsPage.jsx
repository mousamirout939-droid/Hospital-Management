import { useEffect, useState, useCallback } from 'react';
import { doctorService } from '../../services/doctorService';
import { extractErrorMessage } from '../../services/api';
import DoctorFormModal from '../../components/admin/DoctorFormModal';
import FormField from '../../components/common/FormField';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import EmptyState from '../../components/common/EmptyState';
import LoadingScreen from '../../components/common/LoadingScreen';
import Alert from '../../components/common/Alert';
import Modal from '../../components/common/Modal';
import Pagination from '../../components/common/Pagination';
import { formatCurrency } from '../../utils/formatters';
import { IconPlus, IconEdit, IconTrash } from '../../components/common/Icons';

const AdminDoctorsPage = () => {
  const [doctors, setDoctors] = useState([]);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [formTarget, setFormTarget] = useState(undefined); // undefined = closed, null = create, object = edit
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [feedback, setFeedback] = useState('');

  const fetchDoctors = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await doctorService.getAllAdmin({ search, page, limit: 10 });
      setDoctors(res.data.data);
      setPagination(res.data.pagination);
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [search, page]);

  useEffect(() => {
    fetchDoctors();
  }, [fetchDoctors]);

  const handleSaved = () => {
    setFormTarget(undefined);
    setFeedback(formTarget === null ? 'Doctor added successfully.' : 'Doctor updated successfully.');
    fetchDoctors();
    setTimeout(() => setFeedback(''), 4000);
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await doctorService.remove(deleteTarget._id);
      setDeleteTarget(null);
      fetchDoctors();
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div>
      {feedback && <Alert type="success">{feedback}</Alert>}
      {error && <Alert type="danger">{error}</Alert>}

      <div className="card" style={{ marginBottom: 20 }}>
        <div className="flex justify-between items-center gap-3" style={{ flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 220 }}>
            <FormField
              name="search"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Search doctors by name, specialization, department…"
            />
          </div>
          <Button variant="primary" onClick={() => setFormTarget(null)}>
            <IconPlus width={16} height={16} /> Add Doctor
          </Button>
        </div>
      </div>

      {loading ? (
        <LoadingScreen message="Loading doctors…" />
      ) : doctors.length === 0 ? (
        <EmptyState title="No doctors found" message="Add your first doctor to get started." />
      ) : (
        <>
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Specialization</th>
                  <th>Department</th>
                  <th>Fee</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {doctors.map((doc) => (
                  <tr key={doc._id}>
                    <td>{doc.name}</td>
                    <td>{doc.specialization}</td>
                    <td>{doc.department}</td>
                    <td>{formatCurrency(doc.consultationFee)}</td>
                    <td>
                      <Badge status={doc.isActive ? 'completed' : 'cancelled'}>
                        {doc.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </td>
                    <td>
                      <div className="flex gap-2">
                        <button className="btn btn-ghost btn-icon" onClick={() => setFormTarget(doc)} aria-label="Edit">
                          <IconEdit width={16} height={16} />
                        </button>
                        <button className="btn btn-ghost btn-icon" onClick={() => setDeleteTarget(doc)} aria-label="Delete">
                          <IconTrash width={16} height={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination currentPage={page} totalPages={pagination.totalPages} onPageChange={setPage} />
        </>
      )}

      {formTarget !== undefined && (
        <DoctorFormModal doctor={formTarget} onClose={() => setFormTarget(undefined)} onSaved={handleSaved} />
      )}

      {deleteTarget && (
        <Modal
          title="Delete Doctor"
          onClose={() => setDeleteTarget(null)}
          footer={
            <>
              <Button variant="secondary" onClick={() => setDeleteTarget(null)}>
                Cancel
              </Button>
              <Button variant="danger" onClick={handleDelete} loading={deleting}>
                Delete
              </Button>
            </>
          }
        >
          <p>
            Are you sure you want to delete <strong>Dr. {deleteTarget.name}</strong>? If they have upcoming
            appointments, their profile will be deactivated instead of permanently deleted.
          </p>
        </Modal>
      )}
    </div>
  );
};

export default AdminDoctorsPage;
