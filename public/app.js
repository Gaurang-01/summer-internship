// State management
let activeSession = null;
let timerInterval = null;
let refreshLogInterval = null;

// Elements
const btnGenerate = document.getElementById('btnGenerate');
const btnRegenerate = document.getElementById('btnRegenerate');
const btnScan = document.getElementById('btnScan');
const classIdInput = document.getElementById('classId');
const facultyIdInput = document.getElementById('facultyId');
const expirySelect = document.getElementById('expirySeconds');

const qrPlaceholder = document.getElementById('qrPlaceholder');
const qrImage = document.getElementById('qrImage');
const qrOverlay = document.getElementById('qrOverlay');
const timerContainer = document.getElementById('timerContainer');
const timerBar = document.getElementById('timerBar');
const timerText = document.getElementById('timerText');

const simToken = document.getElementById('simToken');
const simStudentId = document.getElementById('simStudentId');
const simFeedbackSuccess = document.getElementById('simFeedbackSuccess');
const simFeedbackSuccessText = document.getElementById('simFeedbackSuccessText');
const simFeedbackError = document.getElementById('simFeedbackError');
const simFeedbackErrorText = document.getElementById('simFeedbackErrorText');

const logBody = document.getElementById('logBody');
const emptyState = document.getElementById('emptyState');

// Event Listeners
btnGenerate.addEventListener('click', generateQR);
btnRegenerate.addEventListener('click', generateQR);
btnScan.addEventListener('click', simulateScan);

// Initial log fetch & poll setup
fetchAttendanceLogs();
refreshLogInterval = setInterval(fetchAttendanceLogs, 2000);

async function generateQR() {
  // Clear alerts
  hideFeedbacks();
  
  const payload = {
    classId: classIdInput.value.trim(),
    facultyId: facultyIdInput.value.trim(),
    expirySeconds: parseInt(expirySelect.value)
  };

  if (!payload.classId || !payload.facultyId) {
    showErrorAlert("Class ID and Faculty ID are required!");
    return;
  }

  try {
    btnGenerate.disabled = true;
    btnGenerate.innerText = 'Generating...';

    const response = await fetch('/api/qr/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const result = await response.json();
    
    if (result.success) {
      activeSession = result;
      
      // Render QR
      qrPlaceholder.style.display = 'none';
      qrOverlay.style.display = 'none';
      qrImage.src = result.qrDataUrl;
      qrImage.style.display = 'block';
      
      // Populate scan simulator
      simToken.value = result.token;
      btnScan.disabled = false;

      // Start Timer
      startTimer(result.expiresAt);
    } else {
      showErrorAlert(result.message || "Failed to generate QR");
    }
  } catch (err) {
    console.error(err);
    showErrorAlert("Server connection error.");
  } finally {
    btnGenerate.disabled = false;
    btnGenerate.innerHTML = `
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><rect x="7" y="7" width="3" height="3"/><rect x="14" y="7" width="3" height="3"/><rect x="7" y="14" width="3" height="3"/><rect x="14" y="14" width="3" height="3"/></svg>
      Generate Dynamic QR Code
    `;
  }
}

function startTimer(expiresAtMs) {
  if (timerInterval) clearInterval(timerInterval);
  
  timerContainer.style.display = 'block';
  
  const totalDuration = parseInt(expirySelect.value) * 1000;
  
  function updateTimer() {
    const remainingMs = expiresAtMs - Date.now();
    
    if (remainingMs <= 0) {
      clearInterval(timerInterval);
      timerText.textContent = '0.0s';
      timerBar.style.width = '0%';
      qrOverlay.style.display = 'flex';
      btnScan.disabled = true;
      return;
    }

    const remainingSeconds = (remainingMs / 1000).toFixed(1);
    timerText.textContent = `${remainingSeconds}s`;
    
    const percentage = Math.max(0, Math.min(100, (remainingMs / totalDuration) * 100));
    timerBar.style.width = `${percentage}%`;

    // Change color based on remaining time
    if (percentage < 25) {
      timerBar.style.background = 'var(--danger)';
      timerText.style.color = 'var(--danger)';
    } else if (percentage < 50) {
      timerBar.style.background = 'var(--warning)';
      timerText.style.color = 'var(--warning)';
    } else {
      timerBar.style.background = 'linear-gradient(90deg, var(--secondary), var(--primary))';
      timerText.style.color = 'var(--secondary)';
    }
  }

  updateTimer();
  timerInterval = setInterval(updateTimer, 100);
}

async function simulateScan() {
  hideFeedbacks();
  
  const payload = {
    token: simToken.value,
    studentId: simStudentId.value.trim()
  };

  if (!payload.token) {
    showSimFeedback(false, "Generate a QR code first!");
    return;
  }
  if (!payload.studentId) {
    showSimFeedback(false, "Enter a Student ID!");
    return;
  }

  try {
    btnScan.disabled = true;
    btnScan.innerText = 'Submitting Scan...';

    const response = await fetch('/api/attendance/scan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const result = await response.json();
    
    if (response.ok && result.success) {
      showSimFeedback(true, `Success! Attendance logged for ${result.record.studentId}`);
      fetchAttendanceLogs(); // immediate update
      
      // Auto increment student ID suffix for quick successive tests
      const match = simStudentId.value.match(/^(.*_)(\d+)$/);
      if (match) {
        const num = parseInt(match[2]) + 1;
        const paddedNum = num.toString().padStart(match[2].length, '0');
        simStudentId.value = match[1] + paddedNum;
      } else {
        simStudentId.value = simStudentId.value + "_next";
      }
    } else {
      showSimFeedback(false, result.message || "Attendance Scan Rejected");
    }
  } catch (err) {
    console.error(err);
    showSimFeedback(false, "Server connection failed.");
  } finally {
    btnScan.disabled = false;
    btnScan.innerHTML = `
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"/><path d="m9 12 2 2 4-4"/></svg>
      Submit Scan Check-in
    `;
  }
}

async function fetchAttendanceLogs() {
  try {
    const response = await fetch('/api/attendance');
    if (!response.ok) return;
    const result = await response.json();
    
    if (result.success && result.records) {
      renderLogs(result.records);
    }
  } catch (err) {
    console.warn("Log polling failed:", err.message);
  }
}

function renderLogs(records) {
  if (!records || records.length === 0) {
    logBody.innerHTML = '';
    emptyState.style.display = 'flex';
    return;
  }

  emptyState.style.display = 'none';
  
  // Sort records descending (newest first)
  const sortedRecords = [...records].reverse();
  
  logBody.innerHTML = sortedRecords.map(record => {
    const time = new Date(record.timestamp).toLocaleTimeString();
    return `
      <tr>
        <td><strong style="color: var(--secondary);">${escapeHtml(record.studentId)}</strong></td>
        <td><span class="badge">${escapeHtml(record.classId)}</span></td>
        <td><span class="badge badge-secondary" style="font-family: monospace; font-size: 0.75rem;">${record.sessionId.substring(0, 8)}...</span></td>
        <td><span style="color: var(--text-muted);">${time}</span></td>
      </tr>
    `;
  }).join('');
}

function showSimFeedback(isSuccess, text) {
  if (isSuccess) {
    simFeedbackSuccessText.textContent = text;
    simFeedbackSuccess.style.display = 'flex';
    simFeedbackError.style.display = 'none';
  } else {
    simFeedbackErrorText.textContent = text;
    simFeedbackError.style.display = 'flex';
    simFeedbackSuccess.style.display = 'none';
  }
}

function hideFeedbacks() {
  simFeedbackSuccess.style.display = 'none';
  simFeedbackError.style.display = 'none';
}

function showErrorAlert(message) {
  alert(message);
}

function escapeHtml(unsafe) {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
