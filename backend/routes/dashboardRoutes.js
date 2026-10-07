const express = require('express');
const {
  getAdminDashboard,
  getPatientDashboard,
  getDoctorDashboard,
  getReceptionDashboard,
  getPharmacistDashboard,
  getLabTechnicianDashboard,
} = require('../controllers/dashboardController');
const { protect, restrictTo } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(protect);

router.get('/admin', restrictTo('admin'), getAdminDashboard);
router.get('/patient', restrictTo('patient'), getPatientDashboard);
router.get('/doctor', restrictTo('doctor'), getDoctorDashboard);
router.get('/receptionist', restrictTo('receptionist'), getReceptionDashboard);
router.get('/pharmacist', restrictTo('pharmacist'), getPharmacistDashboard);
router.get('/lab-technician', restrictTo('lab-technician'), getLabTechnicianDashboard);

module.exports = router;
