function validationResult_(ok, message) {
  return { ok: ok, message: message || '' };
}

function validateStudent(student) {
  student = student || {};
  var required = ['studentId', 'firstName', 'lastName', 'className', 'room', 'number'];
  for (var i = 0; i < required.length; i += 1) {
    var key = required[i];
    if (!String(student[key] == null ? '' : student[key]).trim()) {
      return validationResult_(false, 'กรุณากรอกข้อมูลนักเรียนให้ครบถ้วน');
    }
  }
  return validationResult_(true, '');
}

function validateSubmission(payload) {
  payload = payload || {};
  if (!/^AT-\d{8}-[A-Z0-9]{8}$/.test(String(payload.attemptId || ''))) {
    return validationResult_(false, 'AttemptID ไม่ถูกต้อง');
  }
  if (!payload.responses || typeof payload.responses !== 'object' || Array.isArray(payload.responses) || Object.keys(payload.responses).length === 0) {
    return validationResult_(false, 'ไม่พบคำตอบที่ส่งมา');
  }
  return validationResult_(true, '');
}

if (typeof module !== 'undefined') {
  module.exports = { validateStudent, validateSubmission };
}
