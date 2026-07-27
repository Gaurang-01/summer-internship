const QRCode = require('qrcode');
const { v4: uuidv4 } = require('uuid');
const { createSessionToken } = require('./tokenService');
const { QR_EXPIRY_SECONDS } = require('../config');
const { registerSession } = require('./attendanceStore');

/**
 * Generates a new dynamic, time-limited QR code for a class/event session.
 * Returns a base64 PNG data URL - easy to hand to any client (Flutter app,
 * web dashboard, etc.) which just needs to render it as an <img>/Image widget.
 */
async function generateAttendanceQR({ classId, facultyId, expirySeconds = QR_EXPIRY_SECONDS }) {
  const sessionId = uuidv4();
  const token = createSessionToken(sessionId, Number(expirySeconds));
  const expiresAt = Date.now() + Number(expirySeconds) * 1000;

  registerSession(sessionId, {
    classId,
    facultyId,
    createdAt: Date.now(),
    expiresAt,
    scannedBy: new Set()
  });

  // Payload embedded inside the QR image itself
  const payload = JSON.stringify({ sessionId, token });
  const qrDataUrl = await QRCode.toDataURL(payload, { errorCorrectionLevel: 'M' });

  return { sessionId, token, qrDataUrl, expiresAt };
}

module.exports = { generateAttendanceQR };
