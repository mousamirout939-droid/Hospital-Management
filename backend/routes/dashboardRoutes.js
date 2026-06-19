const express = require('express');
const { getAdminDashboard, getPatientDashboard } = require('../controllers/dashboardController');
const { protect, restrictTo } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(protect);

router.get('/admin', restrictTo('admin'), getAdminDashboard);
router.get('/patient', restrictTo('patient'), getPatientDashboard);

module.exports = router;
