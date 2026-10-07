const dashboardPaths = {
  admin: '/admin/dashboard',
  doctor: '/doctor/dashboard',
  receptionist: '/receptionist/dashboard',
  pharmacist: '/pharmacist/dashboard',
  'lab-technician': '/lab-technician/dashboard',
  patient: '/patient/dashboard',
};

export const getDashboardPath = (role) => dashboardPaths[role] || dashboardPaths.patient;
