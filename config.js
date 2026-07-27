module.exports = {
  // In production, set this via environment variable - never hardcode a real secret
  JWT_SECRET: process.env.QR_JWT_SECRET || 'change-this-secret-in-production',

  // Default time limit (in seconds) before a generated QR code expires
  QR_EXPIRY_SECONDS: Number(process.env.QR_EXPIRY_SECONDS) || 60,

  PORT: process.env.PORT || 4000
};
