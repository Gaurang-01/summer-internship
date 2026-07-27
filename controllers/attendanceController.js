const { verifySessionToken } = require('../services/tokenService');
const { getSession, hasStudentScanned, recordAttendance } = require('../services/attendanceStore');

async function scanQR(req, res) {
  const { token, studentId } = req.body;

  if (!token || !studentId) {
    return res.status(400).json({ success: false, message: 'token and studentId are required' });
  }

  let decoded;
  try {
    decoded = verifySessionToken(token);
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(410).json({ success: false, message: 'QR code has expired' });
    }
    return res.status(401).json({ success: false, message: 'Invalid QR code' });
  }

  const { sessionId } = decoded;
  const session = getSession(sessionId);

  if (!session) {
    return res.status(404).json({ success: false, message: 'Session not found' });
  }

  if (hasStudentScanned(sessionId, studentId)) {
    return res.status(409).json({ success: false, message: 'Attendance already marked for this session' });
  }

  const record = recordAttendance({ sessionId, studentId, classId: session.classId });
  return res.status(200).json({ success: true, message: 'Attendance marked', record });
}

module.exports = { scanQR };
