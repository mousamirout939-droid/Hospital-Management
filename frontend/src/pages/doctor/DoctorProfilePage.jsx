import { useAuth } from '../../context/AuthContext';
import { getInitials } from '../../utils/formatters';

const DoctorProfilePage = () => {
  const { user } = useAuth();

  return (
    <div className="card">
      <div className="flex items-center gap-3 mb-2" style={{ marginBottom: 20 }}>
        <div className="doctor-avatar" style={{ width: 64, height: 64, fontSize: '1.4rem' }}>
          {getInitials(user?.name)}
        </div>
        <div>
          <h3>{user?.name}</h3>
          <p className="text-faint" style={{ fontSize: '0.85rem' }}>{user?.email}</p>
        </div>
      </div>

      <div className="field-group">
        <div className="doc-sheet-label">Role</div>
        <div className="doc-sheet-value">Doctor</div>
      </div>
      <div className="field-group">
        <div className="doc-sheet-label">Account Status</div>
        <div className="doc-sheet-value">{user?.isActive ? 'Active' : 'Inactive'}</div>
      </div>
    </div>
  );
};

export default DoctorProfilePage;
