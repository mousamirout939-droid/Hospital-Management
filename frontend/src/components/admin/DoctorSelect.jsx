import { useState, useEffect } from 'react';
import { doctorService } from '../../services/doctorService';
import FormField from '../common/FormField';

const DoctorSelect = ({ value, onChange, label = 'Doctor', required = false }) => {
  const [doctors, setDoctors] = useState([]);

  useEffect(() => {
    doctorService.getAllAdmin({ limit: 100 }).then((res) => setDoctors(res.data.data));
  }, []);

  return (
    <FormField
      label={label}
      name="doctor"
      as="select"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      required={required}
      options={doctors.map((d) => ({ value: d._id, label: `${d.name} (${d.specialization})` }))}
    />
  );
};

export default DoctorSelect;
