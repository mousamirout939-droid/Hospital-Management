import { Routes, Route } from 'react-router-dom';

import ProtectedRoute from './routes/ProtectedRoute';
import PublicOnlyRoute from './routes/PublicOnlyRoute';
import DashboardLayout from './layouts/DashboardLayout';

import LandingPage from './pages/LandingPage';
import NotFoundPage from './pages/NotFoundPage';

import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage';
import ResetPasswordPage from './pages/auth/ResetPasswordPage';

import PatientDashboard from './pages/patient/PatientDashboard';
import FindDoctorsPage from './pages/patient/FindDoctorsPage';
import PatientAppointmentsPage from './pages/patient/PatientAppointmentsPage';
import PatientMedicalRecordsPage from './pages/patient/PatientMedicalRecordsPage';
import PatientPrescriptionsPage from './pages/patient/PatientPrescriptionsPage';
import PatientLabReportsPage from './pages/patient/PatientLabReportsPage';
import PatientBillingPage from './pages/patient/PatientBillingPage';
import PatientProfilePage from './pages/patient/ProfilePage';

import AdminDashboard from './pages/admin/AdminDashboard';
import AdminAppointmentsPage from './pages/admin/AdminAppointmentsPage';
import AdminDoctorsPage from './pages/admin/AdminDoctorsPage';
import AdminPatientsPage from './pages/admin/AdminPatientsPage';
import AdminMedicalRecordsPage from './pages/admin/AdminMedicalRecordsPage';
import AdminPrescriptionsPage from './pages/admin/AdminPrescriptionsPage';
import AdminLabReportsPage from './pages/admin/AdminLabReportsPage';
import AdminBillingPage from './pages/admin/AdminBillingPage';
import AdminProfilePage from './pages/admin/AdminProfilePage';

function App() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/" element={<LandingPage />} />

      {/* Auth (only for logged-out users) */}
      <Route element={<PublicOnlyRoute />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password/:token" element={<ResetPasswordPage />} />
      </Route>

      {/* Patient area */}
      <Route element={<ProtectedRoute allowedRoles={['patient']} />}>
        <Route path="/patient" element={<DashboardLayout />}>
          <Route path="dashboard" element={<PatientDashboard />} />
          <Route path="find-doctors" element={<FindDoctorsPage />} />
          <Route path="appointments" element={<PatientAppointmentsPage />} />
          <Route path="medical-records" element={<PatientMedicalRecordsPage />} />
          <Route path="prescriptions" element={<PatientPrescriptionsPage />} />
          <Route path="lab-reports" element={<PatientLabReportsPage />} />
          <Route path="billing" element={<PatientBillingPage />} />
          <Route path="profile" element={<PatientProfilePage />} />
        </Route>
      </Route>

      {/* Admin area */}
      <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
        <Route path="/admin" element={<DashboardLayout />}>
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="appointments" element={<AdminAppointmentsPage />} />
          <Route path="doctors" element={<AdminDoctorsPage />} />
          <Route path="patients" element={<AdminPatientsPage />} />
          <Route path="medical-records" element={<AdminMedicalRecordsPage />} />
          <Route path="prescriptions" element={<AdminPrescriptionsPage />} />
          <Route path="lab-reports" element={<AdminLabReportsPage />} />
          <Route path="billing" element={<AdminBillingPage />} />
          <Route path="profile" element={<AdminProfilePage />} />
        </Route>
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}

export default App;
