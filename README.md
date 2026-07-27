# QR Attendance Service (Node.js)

Backend-only service for the QR Generation module: generates time-limited
dynamic QR codes and logs attendance when scanned. 

## How the "time limit" works

Each QR encodes a JWT signed with an expiry (`expiresIn`). There's no
scheduler or cron job cleaning things up — `jwt.verify()` simply throws
`TokenExpiredError` once the expiry passes, so an old QR just stops working
on its own the moment someone tries to scan it.

## Setup

```bash
npm install
npm start
```

Server runs on `http://localhost:4000` by default. Override with env vars:

```bash
QR_JWT_SECRET=your-real-secret QR_EXPIRY_SECONDS=60 PORT=4000 npm start
```

## Endpoints

### 1. Generate a QR code
`POST /api/qr/generate`

Request body:
```json
{ "classId": "CS101", "facultyId": "fac_1", "expirySeconds": 60 }
```
(`expirySeconds` optional, defaults to 60)

Response:
```json
{
  "success": true,
  "sessionId": "...",
  "token": "...",
  "qrDataUrl": "data:image/png;base64,....",
  "expiresAt": 1783674638000
}
```
`qrDataUrl` is a ready-to-display base64 PNG — pass it straight into an
`Image.memory()` / `<img src=...>` on whatever client ends up doing the
scanning.

### 2. Scan / mark attendance
`POST /api/attendance/scan`

Request body:
```json
{ "token": "<token from the QR>", "studentId": "stu_1" }
```

Responses:
- `200` — attendance marked
- `410` — QR has expired
- `401` — token invalid/tampered
- `409` — this student already scanned this session

### 3. View attendance log
`GET /api/attendance?classId=CS101` (classId optional — omit to see everything)

## Swapping in a real database

Everything reads/writes through `services/attendanceStore.js`. It's
in-memory right now (fine for building/demoing). Since the project plan
uses Firebase/Firestore, when you're ready, replace the function bodies in
that one file with Firestore calls (e.g. `db.collection('sessions')`,
`db.collection('attendance')`) — nothing else in the app needs to change.

## Project structure

```
qr-attendance-service/
├── server.js                       # entry point
├── config.js                       # secret, default expiry, port
├── routes/index.js                 # route definitions
├── controllers/
│   ├── qrController.js             # generate + view-log handlers
│   └── attendanceController.js     # scan handler
└── services/
    ├── qrService.js                # builds the QR image + session
    ├── tokenService.js             # signs/verifies time-limited tokens
    └── attendanceStore.js          # data layer (swap for Firestore later)
```

## Tested

Verified end-to-end: generate → scan (success) → re-scan same student
(rejected as duplicate) → scan after expiry (rejected as expired) → log
retrieval. All behaved as expected.
# summer-internship
