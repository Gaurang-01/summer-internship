const express = require('express');
const router = express.Router();
const { generateQR, viewAttendance } = require('../controllers/qrController');
const { scanQR } = require('../controllers/attendanceController');

router.post('/qr/generate', generateQR);     // Faculty/organizer: generate a session QR
router.post('/attendance/scan', scanQR);      // Scanner app: submit token + studentId
router.get('/attendance', viewAttendance);    // View logged attendance (optional ?classId=)

module.exports = router;
