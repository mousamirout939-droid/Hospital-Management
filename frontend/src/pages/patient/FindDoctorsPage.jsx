import { useEffect, useState, useCallback } from 'react';
import { doctorService } from '../../services/doctorService';
import DoctorCard from '../../components/patient/DoctorCard';
import BookAppointmentModal from '../../components/patient/BookAppointmentModal';
import FormField from '../../components/common/FormField';
import EmptyState from '../../components/common/EmptyState';
import LoadingScreen from '../../components/common/LoadingScreen';
import Alert from '../../components/common/Alert';
import Pagination from '../../components/common/Pagination';

const FindDoctorsPage = () => {
  const [doctors, setDoctors] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [search, setSearch] = useState('');
  const [department, setDepartment] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [bookingDoctor, setBookingDoctor] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');

  const fetchDoctors = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await doctorService.getAll({ search, department, page, limit: 9 });
      setDoctors(res.data.data);
      setPagination(res.data.pagination);
    } catch (err) {
      setError('Unable to load doctors right now. Please try again shortly.');
    } finally {
      setLoading(false);
    }
  }, [search, department, page]);

  useEffect(() => {
    doctorService.getDepartments().then((res) => setDepartments(res.data.data)).catch(() => {});
  }, []);

  useEffect(() => {
    fetchDoctors();
  }, [fetchDoctors]);

  const handleSearchChange = (e) => {
    setSearch(e.target.value);
    setPage(1);
  };

  const handleDeptChange = (e) => {
    setDepartment(e.target.value);
    setPage(1);
  };

  const handleBookingSuccess = () => {
    setBookingDoctor(null);
    setSuccessMessage('Your appointment request has been submitted! You can track its status under My Appointments.');
    setTimeout(() => setSuccessMessage(''), 6000);
  };

  return (
    <div>
      {successMessage && <Alert type="success">{successMessage}</Alert>}

      <div className="card" style={{ marginBottom: 24 }}>
        <div className="field-row" style={{ alignItems: 'end' }}>
          <FormField
            label="Search"
            name="search"
            value={search}
            onChange={handleSearchChange}
            placeholder="Search by name or specialization"
          />
          <FormField
            label="Department"
            name="department"
            as="select"
            value={department}
            onChange={handleDeptChange}
            placeholder="All Departments"
            options={departments.map((d) => ({ value: d, label: d }))}
          />
        </div>
      </div>

      {loading ? (
        <LoadingScreen message="Finding doctors…" />
      ) : error ? (
        <Alert type="danger">{error}</Alert>
      ) : doctors.length === 0 ? (
        <EmptyState
          title="No doctors found"
          message="Try adjusting your search or department filter."
        />
      ) : (
        <>
          <div className="doctor-grid">
            {doctors.map((doctor) => (
              <DoctorCard key={doctor._id} doctor={doctor} onBook={setBookingDoctor} />
            ))}
          </div>
          <Pagination currentPage={page} totalPages={pagination.totalPages} onPageChange={setPage} />
        </>
      )}

      {bookingDoctor && (
        <BookAppointmentModal
          doctor={bookingDoctor}
          onClose={() => setBookingDoctor(null)}
          onSuccess={handleBookingSuccess}
        />
      )}
    </div>
  );
};

export default FindDoctorsPage;
