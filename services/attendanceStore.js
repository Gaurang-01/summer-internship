// In-memory store, good enough for development/demo/testing.
// Your project plan lists Firebase/Firestore as the backend - when you're
// ready, swap the bodies of these functions for Firestore reads/writes and
// nothing else in the app needs to change.

const sessions = new Map();  // sessionId -> { classId, facultyId, createdAt, expiresAt, scannedBy }
const attendanceLog = [];    // flat array of every attendance record ever logged

function registerSession(sessionId, data) {
  sessions.set(sessionId, data);
}

function getSession(sessionId) {
  return sessions.get(sessionId);
}

function hasStudentScanned(sessionId, studentId) {
  const session = sessions.get(sessionId);
  return session ? session.scannedBy.has(studentId) : false;
}

function recordAttendance({ sessionId, studentId, classId }) {
  const session = sessions.get(sessionId);
  session.scannedBy.add(studentId);

  const record = {
    sessionId,
    studentId,
    classId,
    timestamp: new Date().toISOString()
  };
  attendanceLog.push(record);

  // TODO: replace the two lines above with, e.g.:
  // await db.collection('attendance').add(record);

  return record;
}

function getAttendanceLog(classId) {
  return classId ? attendanceLog.filter((r) => r.classId === classId) : attendanceLog;
}

module.exports = {
  registerSession,
  getSession,
  hasStudentScanned,
  recordAttendance,
  getAttendanceLog
};
