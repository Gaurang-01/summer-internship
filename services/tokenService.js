const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../config');

/**
 * Creates a signed token for an attendance session that automatically
 * becomes invalid after `expirySeconds`. This is what gives the QR code
 * its "time limit" - no separate cleanup job needed, jwt.verify()
 * will reject it once expired.
 */
function createSessionToken(sessionId, expirySeconds) {
  return jwt.sign({ sessionId }, JWT_SECRET, { expiresIn: expirySeconds });
}

/**
 * Verifies a token's signature and expiry.
 * Throws TokenExpiredError if expired, JsonWebTokenError if tampered/invalid.
 */
function verifySessionToken(token) {
  return jwt.verify(token, JWT_SECRET);
}

module.exports = { createSessionToken, verifySessionToken };
