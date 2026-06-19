import { useState } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { NotificationProvider } from '../context/NotificationContext';
import NotificationBell from '../components/common/NotificationBell';
import { getInitials } from '../utils/formatters';
import {
  IconDashboard,
  IconCalendar,
  IconDoctor,
  IconUsers,
  IconFile,
  IconPill,
  IconFlask,
  IconReceipt,
  IconLogout,
  IconMenu,
  IconClose,
} from '../components/common/Icons';

const adminLinks = [
  { to: '/admin/dashboard', label: 'Dashboard', icon: IconDashboard },
  { to: '/admin/appointments', label: 'Appointments', icon: IconCalendar },
  { to: '/admin/doctors', label: 'Doctors', icon: IconDoctor },
  { to: '/admin/patients', label: 'Patients', icon: IconUsers },
  { to: '/admin/medical-records', label: 'Medical Records', icon: IconFile },
  { to: '/admin/prescriptions', label: 'Pharmacy', icon: IconPill },
  { to: '/admin/lab-reports', label: 'Lab Reports', icon: IconFlask },
  { to: '/admin/billing', label: 'Billing', icon: IconReceipt },
];

const patientLinks = [
  { to: '/patient/dashboard', label: 'Dashboard', icon: IconDashboard },
  { to: '/patient/find-doctors', label: 'Find Doctors', icon: IconDoctor },
  { to: '/patient/appointments', label: 'My Appointments', icon: IconCalendar },
  { to: '/patient/medical-records', label: 'Medical Records', icon: IconFile },
  { to: '/patient/prescriptions', label: 'Prescriptions', icon: IconPill },
  { to: '/patient/lab-reports', label: 'Lab Reports', icon: IconFlask },
  { to: '/patient/billing', label: 'Billing', icon: IconReceipt },
];

const pageTitles = {
  '/admin/dashboard': 'Dashboard',
  '/admin/appointments': 'Appointments',
  '/admin/doctors': 'Doctor Management',
  '/admin/patients': 'Patients',
  '/admin/medical-records': 'Medical Records',
  '/admin/prescriptions': 'Pharmacy',
  '/admin/lab-reports': 'Lab Reports',
  '/admin/billing': 'Billing',
  '/admin/profile': 'My Profile',
  '/patient/dashboard': 'Dashboard',
  '/patient/find-doctors': 'Find a Doctor',
  '/patient/appointments': 'My Appointments',
  '/patient/medical-records': 'Medical Records',
  '/patient/prescriptions': 'Prescriptions',
  '/patient/lab-reports': 'Lab Reports',
  '/patient/billing': 'Billing',
  '/patient/profile': 'My Profile',
};

const DashboardLayoutInner = () => {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const links = isAdmin ? adminLinks : patientLinks;
  const profilePath = isAdmin ? '/admin/profile' : '/patient/profile';

  const matchedTitle = Object.keys(pageTitles)
    .filter((path) => location.pathname.startsWith(path))
    .sort((a, b) => b.length - a.length)[0];
  const title = pageTitles[matchedTitle] || 'MediCare HMS';

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="app-shell">
      <button className="sidebar-mobile-toggle" onClick={() => setSidebarOpen(true)} aria-label="Open menu">
        <IconMenu width={20} height={20} />
      </button>

      <div className={`sidebar-overlay ${sidebarOpen ? 'open' : ''}`} onClick={() => setSidebarOpen(false)} />

      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-brand">
          <div className="sidebar-brand-mark">M+</div>
          <div>
            <div className="sidebar-brand-text">MediCare</div>
            <div className="sidebar-brand-sub">{isAdmin ? 'Admin Console' : 'Patient Portal'}</div>
          </div>
          <button
            className="modal-close"
            style={{ marginLeft: 'auto', color: '#fff', display: sidebarOpen ? 'block' : 'none' }}
            onClick={() => setSidebarOpen(false)}
          >
            <IconClose width={18} height={18} />
          </button>
        </div>

        <nav className="sidebar-nav">
          {links.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
              onClick={() => setSidebarOpen(false)}
            >
              <Icon width={18} height={18} />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <NavLink to={profilePath} className="sidebar-user" style={{ textDecoration: 'none' }}>
            <div className="sidebar-avatar">{getInitials(user?.name)}</div>
            <div className="sidebar-user-info">
              <div className="sidebar-user-name">{user?.name}</div>
              <div className="sidebar-user-role">{user?.role}</div>
            </div>
          </NavLink>
          <button
            onClick={handleLogout}
            className="sidebar-link"
            style={{ width: '100%', marginTop: 8, background: 'none', border: 'none', textAlign: 'left' }}
          >
            <IconLogout width={18} height={18} />
            Log Out
          </button>
        </div>
      </aside>

      <div className="main-content">
        <header className="topbar">
          <h1 className="topbar-title">{title}</h1>
          <div className="topbar-actions">
            <NotificationBell />
          </div>
        </header>

        <main className="page-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

const DashboardLayout = () => (
  <NotificationProvider>
    <DashboardLayoutInner />
  </NotificationProvider>
);

export default DashboardLayout;
