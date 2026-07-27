const { generateAttendanceQR } = require('../services/qrService');
const { getAttendanceLog } = require('../services/attendanceStore');

async function generateQR(req, res) {
  const { classId, facultyId, expirySeconds } = req.body;

  if (!classId || !facultyId) {
    return res.status(400).json({ success: false, message: 'classId and facultyId are required' });
  }

  try {
    const qr = await generateAttendanceQR({ classId, facultyId, expirySeconds });
    return res.status(200).json({ success: true, ...qr });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to generate QR', error: err.message });
  }
}

function viewAttendance(req, res) {
  const { classId } = req.query;
  return res.status(200).json({ success: true, records: getAttendanceLog(classId) });
}

module.exports = { generateQR, viewAttendance };
