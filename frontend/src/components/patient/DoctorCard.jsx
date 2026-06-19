import { getInitials, formatCurrency } from '../../utils/formatters';
import Button from '../common/Button';

const DoctorCard = ({ doctor, onBook }) => (
  <div className="doctor-card">
    <div className="doctor-card-top">
      <div className="doctor-avatar">
        {doctor.photo ? <img src={doctor.photo} alt={doctor.name} /> : getInitials(doctor.name)}
      </div>
      <div>
        <div className="doctor-name">{doctor.name}</div>
        <div className="doctor-specialization">{doctor.specialization}</div>
      </div>
    </div>

    <p className="text-soft" style={{ fontSize: '0.85rem', minHeight: '2.6em' }}>
      {doctor.bio || `${doctor.experienceYears}+ years of experience in ${doctor.department}.`}
    </p>

    <div className="doctor-meta-row">
      <span>{doctor.department}</span>
      <span className="doctor-fee">{formatCurrency(doctor.consultationFee)}</span>
    </div>

    <Button variant="primary" block onClick={() => onBook(doctor)}>
      Book Appointment
    </Button>
  </div>
);

export default DoctorCard;
