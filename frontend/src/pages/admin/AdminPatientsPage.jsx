import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { userService } from '../../services/userService';
import { extractErrorMessage } from '../../services/api';
import FormField from '../../components/common/FormField';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import EmptyState from '../../components/common/EmptyState';
import LoadingScreen from '../../components/common/LoadingScreen';
import Alert from '../../components/common/Alert';
import Pagination from '../../components/common/Pagination';
import { formatDate } from '../../utils/formatters';

const AdminPatientsPage = () => {
  const [patients, setPatients] = useState([]);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [togglingId, setTogglingId] = useState(null);

  const fetchPatients = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await userService.getAllPatients({ search, page, limit: 10 });
      setPatients(res.data.data);
      setPagination(res.data.pagination);
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [search, page]);

  useEffect(() => {
    fetchPatients();
  }, [fetchPatients]);

  const handleToggleStatus = async (patient) => {
    setTogglingId(patient._id);
    try {
      await userService.updatePatientStatus(patient._id, { isActive: !patient.isActive });
      fetchPatients();
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setTogglingId(null);
    }
  };

  return (
    <div>
      <div className="card" style={{ marginBottom: 20 }}>
        <FormField
          name="search"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          placeholder="Search patients by name, email, or phone…"
        />
      </div>

      {error && <Alert type="danger">{error}</Alert>}

      {loading ? (
        <LoadingScreen message="Loading patients…" />
      ) : patients.length === 0 ? (
        <EmptyState title="No patients found" />
      ) : (
        <>
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Joined</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {patients.map((patient) => (
                  <tr key={patient._id}>
                    <td>{patient.name}</td>
                    <td>{patient.email}</td>
                    <td>{patient.phone || '—'}</td>
                    <td>{formatDate(patient.createdAt)}</td>
                    <td>
                      <Badge status={patient.isActive ? 'completed' : 'cancelled'}>
                        {patient.isActive ? 'Active' : 'Deactivated'}
                      </Badge>
                    </td>
                    <td>
                      <Button
                        size="sm"
                        variant={patient.isActive ? 'danger' : 'outline'}
                        loading={togglingId === patient._id}
                        onClick={() => handleToggleStatus(patient)}
                      >
                        {patient.isActive ? 'Deactivate' : 'Activate'}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination currentPage={page} totalPages={pagination.totalPages} onPageChange={setPage} />
        </>
      )}
    </div>
  );
};

export default AdminPatientsPage;
