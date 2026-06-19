import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { userService } from '../../services/userService';
import { authService } from '../../services/authService';
import { extractErrorMessage } from '../../services/api';
import FormField from '../../components/common/FormField';
import Button from '../../components/common/Button';
import Alert from '../../components/common/Alert';
import { getInitials } from '../../utils/formatters';

const AdminProfilePage = () => {
  const { user, updateLocalUser } = useAuth();
  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [profileMsg, setProfileMsg] = useState({ type: '', text: '' });
  const [savingProfile, setSavingProfile] = useState(false);

  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [passwordMsg, setPasswordMsg] = useState({ type: '', text: '' });
  const [savingPassword, setSavingPassword] = useState(false);

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    setProfileMsg({ type: '', text: '' });
    try {
      const res = await userService.updateProfile({ name, phone });
      updateLocalUser(res.data.user);
      setProfileMsg({ type: 'success', text: 'Profile updated successfully.' });
    } catch (err) {
      setProfileMsg({ type: 'danger', text: extractErrorMessage(err) });
    } finally {
      setSavingProfile(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setPasswordMsg({ type: '', text: '' });

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordMsg({ type: 'danger', text: 'New passwords do not match' });
      return;
    }

    setSavingPassword(true);
    try {
      await authService.updatePassword(passwordForm);
      setPasswordMsg({ type: 'success', text: 'Password updated successfully.' });
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      setPasswordMsg({ type: 'danger', text: extractErrorMessage(err) });
    } finally {
      setSavingPassword(false);
    }
  };

  return (
    <div className="dashboard-grid">
      <div className="card">
        <div className="flex items-center gap-3" style={{ marginBottom: 20 }}>
          <div className="doctor-avatar" style={{ width: 64, height: 64, fontSize: '1.4rem' }}>
            {getInitials(user?.name)}
          </div>
          <div>
            <h3>{user?.name}</h3>
            <p className="text-faint" style={{ fontSize: '0.85rem' }}>{user?.email} • Administrator</p>
          </div>
        </div>

        {profileMsg.text && <Alert type={profileMsg.type}>{profileMsg.text}</Alert>}

        <form onSubmit={handleProfileSubmit}>
          <FormField label="Full Name" name="name" value={name} onChange={(e) => setName(e.target.value)} required />
          <FormField label="Phone" name="phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
          <Button type="submit" variant="primary" loading={savingProfile}>
            Save Changes
          </Button>
        </form>
      </div>

      <div className="card">
        <h3 className="card-title" style={{ marginBottom: 16 }}>
          Change Password
        </h3>
        {passwordMsg.text && <Alert type={passwordMsg.type}>{passwordMsg.text}</Alert>}
        <form onSubmit={handlePasswordSubmit}>
          <FormField
            label="Current Password"
            name="currentPassword"
            type="password"
            value={passwordForm.currentPassword}
            onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
            required
          />
          <FormField
            label="New Password"
            name="newPassword"
            type="password"
            value={passwordForm.newPassword}
            onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
            required
          />
          <FormField
            label="Confirm New Password"
            name="confirmPassword"
            type="password"
            value={passwordForm.confirmPassword}
            onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
            required
          />
          <Button type="submit" variant="secondary" loading={savingPassword}>
            Update Password
          </Button>
        </form>
      </div>
    </div>
  );
};

export default AdminProfilePage;
