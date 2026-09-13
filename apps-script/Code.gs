var APP = {
  SPREADSHEET_ID: '1fZ3Q88T_5ggfXyXWCRCu8epeSn0qyf2LzvVlcJlW6rI',
  SHEETS: {
    ACCOUNTS: 'Accounts', QUESTIONS: 'Questions', ATTEMPTS: 'Attempts',
    RESPONSES: 'Responses', SETTINGS: 'Settings', STUDENTS: 'Students'
  },
  CATEGORIES: ['สินทรัพย์', 'หนี้สิน', 'ส่วนของเจ้าของ'],
  CHANGES: ['เพิ่มขึ้น', 'ลดลง'],
  FORMS: ['A', 'B', 'C', 'D', 'E'],
  DEFAULTS: {
    exam_title: 'แบบทดสอบการวิเคราะห์รายการค้า',
    question_count: 20,
    exam_time: 30,
    pass_percent: 60,
    show_answer: false
  }
};

function doGet(e) {
  var view = e && e.parameter && e.parameter.view === 'teacher' ? 'teacher' : 'student';
  return HtmlService.createHtmlOutput(buildHtml_(view))
    .setTitle('แบบทดสอบการวิเคราะห์รายการค้า')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

function getSpreadsheet_() {
  var overrideId = PropertiesService.getScriptProperties().getProperty('SPREADSHEET_ID');
  return SpreadsheetApp.openById(overrideId || APP.SPREADSHEET_ID);
}

function getSheetOrThrow_(sheetName) {
  var sheet = getSpreadsheet_().getSheetByName(sheetName);
  if (!sheet) throw new Error('ไม่พบชีต ' + sheetName);
  return sheet;
}

function readTable_(sheetName) {
  var sheet = getSheetOrThrow_(sheetName);
  var values = sheet.getDataRange().getValues();
  if (!values.length || !values[0].length) return [];
  var headers = values[0].map(function(v) { return String(v).trim(); });
  return values.slice(1).filter(function(row) {
    return row.some(function(v) { return v !== '' && v != null; });
  }).map(function(row, idx) {
    var obj = { _rowNumber: idx + 2 };
    headers.forEach(function(h, col) { if (h) obj[h] = row[col]; });
    return obj;
  });
}

function headersFor_(sheetName) {
  var sheet = getSheetOrThrow_(sheetName);
  var lastColumn = sheet.getLastColumn();
  if (!lastColumn) return [];
  return sheet.getRange(1, 1, 1, lastColumn).getValues()[0].map(function(v) { return String(v).trim(); });
}

function appendObjectRows_(sheetName, objects) {
  if (!objects || !objects.length) return;
  var sheet = getSheetOrThrow_(sheetName);
  var headers = headersFor_(sheetName);
  var rows = objects.map(function(obj) {
    return headers.map(function(h) { return obj[h] == null ? '' : obj[h]; });
  });
  sheet.getRange(sheet.getLastRow() + 1, 1, rows.length, headers.length).setValues(rows);
}

function updateObjectRow_(sheetName, rowNumber, patch) {
  var sheet = getSheetOrThrow_(sheetName);
  var headers = headersFor_(sheetName);
  var values = sheet.getRange(rowNumber, 1, 1, headers.length).getValues()[0];
  headers.forEach(function(h, i) {
    if (Object.prototype.hasOwnProperty.call(patch, h)) values[i] = patch[h];
  });
  sheet.getRange(rowNumber, 1, 1, headers.length).setValues([values]);
}

function findRowBy_(sheetName, field, value) {
  var rows = readTable_(sheetName);
  for (var i = 0; i < rows.length; i += 1) {
    if (String(rows[i][field]).trim() === String(value).trim()) return rows[i];
  }
  return null;
}

function getSettings_() {
  var rows = readTable_(APP.SHEETS.SETTINGS);
  var out = {};
  rows.forEach(function(row) {
    if (row.Setting) out[String(row.Setting).trim()] = row.Value;
  });
  Object.keys(APP.DEFAULTS).forEach(function(key) {
    if (out[key] === '' || out[key] == null) out[key] = APP.DEFAULTS[key];
  });
  out.question_count = Number(out.question_count) || APP.DEFAULTS.question_count;
  out.exam_time = Number(out.exam_time) || APP.DEFAULTS.exam_time;
  out.pass_percent = Number(out.pass_percent) || APP.DEFAULTS.pass_percent;
  out.show_answer = String(out.show_answer).toUpperCase() === 'TRUE';
  return out;
}

function getExamConfig() {
  var s = getSettings_();
  return {
    title: s.exam_title,
    questionCount: s.question_count,
    examTimeMinutes: s.exam_time,
    passPercent: s.pass_percent,
    categories: APP.CATEGORIES.slice(),
    changes: APP.CHANGES.slice()
  };
}

function getAccounts() {
  return readTable_(APP.SHEETS.ACCOUNTS)
    .filter(function(r) { return String(r.Active).toUpperCase() !== 'FALSE'; })
    .map(function(r) { return { id: r.AccountID, name: r.AccountName, category: r.Category }; });
}

function getBootstrapData() {
  return { config: getExamConfig(), accounts: getAccounts() };
}

function getStudentProfile(studentId) {
  var id = String(studentId == null ? '' : studentId).trim();
  if (!id) throw new Error('กรุณากรอกรหัสประจำตัวนักเรียน');
  var row = findRowBy_(APP.SHEETS.STUDENTS, 'StudentID', id);
  if (!row) throw new Error('ไม่พบรหัสนักเรียน ' + id + ' ในระบบ');
  if (String(row.Active).toUpperCase() === 'FALSE') throw new Error('นักเรียนรหัสนี้ถูกปิดการใช้งาน');
  return {
    studentId: String(row.StudentID).trim(),
    firstName: String(row.FirstName || '').trim(),
    lastName: String(row.LastName || '').trim(),
    className: String(row.Class || '').trim(),
    room: String(row.Room || '').trim(),
    number: String(row.Number || '').trim()
  };
}

function validationResult_(ok, message) {
  return { ok: ok, message: message || '' };
}

function validateSubmission(payload) {
  payload = payload || {};
  if (!/^AT-\d{8}-[A-Z0-9]{8}$/.test(String(payload.attemptId || ''))) {
    return validationResult_(false, 'AttemptID ไม่ถูกต้อง');
  }
  if (!payload.responses || typeof payload.responses !== 'object' || Array.isArray(payload.responses)) {
    return validationResult_(false, 'ไม่พบคำตอบที่ส่งมา');
  }
  return validationResult_(true, '');
}

function cleanText_(value) {
  return value == null ? '' : String(value).trim();
}

function normalizeAnswer(rows) {
  var seen = {};
  var normalized = (rows || []).map(function(row) {
    return {
      account: cleanText_(row && row.account),
      category: cleanText_(row && row.category),
      change: cleanText_(row && row.change)
    };
  }).filter(function(row) {
    return row.account || row.category || row.change;
  }).filter(function(row) {
    var key = [row.account, row.category, row.change].join('|');
    if (seen[key]) return false;
    seen[key] = true;
    return true;
  });
  normalized.sort(function(a, b) {
    return [a.account, a.category, a.change].join('|').localeCompare([b.account, b.category, b.change].join('|'), 'th');
  });
  return normalized;
}

function gradeQuestion(keyRows, studentRows) {
  var key = normalizeAnswer(keyRows);
  var student = normalizeAnswer(studentRows);
  var expectedCount = key.length || 1;
  var byAccount = {};
  student.forEach(function(row) {
    if (row.account && !byAccount[row.account]) byAccount[row.account] = row;
  });
  var accountHits = 0, categoryHits = 0, changeHits = 0;
  key.forEach(function(expected) {
    var actual = byAccount[expected.account];
    if (!actual) return;
    accountHits += 1;
    if (actual.category === expected.category) categoryHits += 1;
    if (actual.change === expected.change) changeHits += 1;
  });
  var accountScore = accountHits / expectedCount;
  var categoryScore = categoryHits / expectedCount;
  var changeScore = changeHits / expectedCount;
  return {
    score: (accountScore + categoryScore + changeScore) / 3,
    accountScore: accountScore,
    categoryScore: categoryScore,
    changeScore: changeScore
  };
}

function pickQuestionKeys(questionKeys, assignedIds) {
  var out = {};
  (assignedIds || []).forEach(function(id) {
    if (Object.prototype.hasOwnProperty.call(questionKeys || {}, id)) out[id] = questionKeys[id];
  });
  return out;
}

function gradeExam(questionKeys, responses) {
  var ids = Object.keys(questionKeys || {});
  var count = ids.length || 1;
  var total = 0, account = 0, category = 0, change = 0;
  var questionResults = {};
  ids.forEach(function(id) {
    var result = gradeQuestion(questionKeys[id], (responses || {})[id] || []);
    questionResults[id] = result;
    total += result.score;
    account += result.accountScore;
    category += result.categoryScore;
    change += result.changeScore;
  });
  function pct(value) { return Math.round((value / count) * 10000) / 100; }
  return {
    questionCount: ids.length,
    percent: pct(total),
    accountPercent: pct(account),
    categoryPercent: pct(category),
    changePercent: pct(change),
    questionResults: questionResults
  };
}

function generateAttemptId() {
  var tz = Session.getScriptTimeZone() || 'Asia/Bangkok';
  var date = Utilities.formatDate(new Date(), tz, 'yyyyMMdd');
  var token = Utilities.getUuid().replace(/-/g, '').substring(0, 8).toUpperCase();
  return 'AT-' + date + '-' + token;
}

function parseQuestionRow_(row) {
  var answerCount = Number(row.AnswerCount) || 2;
  var key = [];
  for (var i = 1; i <= answerCount; i += 1) {
    key.push({ account: row['Account' + i], category: row['Category' + i], change: row['Change' + i] });
  }
  return {
    id: String(row.QuestionID),
    formId: String(row.FormID),
    sequence: Number(row.Sequence),
    text: String(row.QuestionText),
    difficulty: String(row.Difficulty || ''),
    answerCount: answerCount,
    key: key
  };
}

function getActiveQuestionsForForm_(formId) {
  return readTable_(APP.SHEETS.QUESTIONS)
    .filter(function(row) {
      return String(row.FormID) === String(formId) && String(row.Active).toUpperCase() !== 'FALSE';
    })
    .map(parseQuestionRow_)
    .sort(function(a, b) { return a.sequence - b.sequence; });
}

function shuffle_(items) {
  var a = items.slice();
  for (var i = a.length - 1; i > 0; i -= 1) {
    var j = Math.floor(Math.random() * (i + 1));
    var t = a[i]; a[i] = a[j]; a[j] = t;
  }
  return a;
}

function publicQuestion_(q) {
  return { id: q.id, text: q.text, difficulty: q.difficulty, answerCount: q.answerCount };
}

function chooseForm_() {
  return APP.FORMS[Math.floor(Math.random() * APP.FORMS.length)];
}

function startExam(studentInput) {
  var studentId = typeof studentInput === 'object' && studentInput ? studentInput.studentId : studentInput;
  var student = getStudentProfile(studentId);
  var settings = getSettings_();
  var formId = chooseForm_();
  var questions = getActiveQuestionsForForm_(formId);
  if (questions.length < settings.question_count) throw new Error('จำนวนข้อสอบในชุด ' + formId + ' ไม่เพียงพอ');
  questions = shuffle_(questions).slice(0, settings.question_count);

  var now = new Date();
  var expires = new Date(now.getTime() + settings.exam_time * 60000);
  var attemptId = generateAttemptId();
  var lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    appendObjectRows_(APP.SHEETS.ATTEMPTS, [{
      AttemptID: attemptId,
      StudentID: student.studentId,
      FirstName: student.firstName,
      LastName: student.lastName,
      Class: student.className,
      Room: student.room,
      Number: student.number,
      FormID: formId,
      StartTime: now,
      SubmitTime: '', DurationSeconds: '', RawScore: '', Percent: '',
      AccountScore: '', CategoryScore: '', ChangeScore: '', Status: 'IN_PROGRESS',
      QuestionIDs: JSON.stringify(questions.map(function(q) { return q.id; }))
    }]);
  } finally {
    lock.releaseLock();
  }

  return {
    attemptId: attemptId,
    formId: formId,
    startedAt: now.toISOString(),
    expiresAt: expires.toISOString(),
    questions: questions.map(publicQuestion_),
    student: student
  };
}

function resultFromAttempt_(attempt) {
  return {
    attemptId: attempt.AttemptID,
    studentName: (attempt.FirstName + ' ' + attempt.LastName).trim(),
    className: attempt.Class,
    room: attempt.Room,
    number: attempt.Number,
    formId: attempt.FormID,
    percent: Number(attempt.Percent) || 0,
    accountPercent: Number(attempt.AccountScore) || 0,
    categoryPercent: Number(attempt.CategoryScore) || 0,
    changePercent: Number(attempt.ChangeScore) || 0,
    status: attempt.Status,
    submittedAt: attempt.SubmitTime ? new Date(attempt.SubmitTime).toISOString() : ''
  };
}

function submitExam(payload) {
  var validation = validateSubmission(payload);
  if (!validation.ok) throw new Error(validation.message);
  var lock = LockService.getScriptLock();
  lock.waitLock(15000);
  try {
    var attempt = findRowBy_(APP.SHEETS.ATTEMPTS, 'AttemptID', payload.attemptId);
    if (!attempt) throw new Error('ไม่พบรหัสการสอบ');
    if (attempt.SubmitTime) return resultFromAttempt_(attempt);

    var allQuestions = getActiveQuestionsForForm_(attempt.FormID);
    var allKeyMap = {}, questionById = {};
    allQuestions.forEach(function(q) { allKeyMap[q.id] = q.key; questionById[q.id] = q; });
    var assignedIds;
    try { assignedIds = JSON.parse(String(attempt.QuestionIDs || '[]')); } catch (err) { assignedIds = []; }
    if (!assignedIds.length) assignedIds = allQuestions.map(function(q) { return q.id; });
    var keyMap = pickQuestionKeys(allKeyMap, assignedIds);
    var questions = assignedIds.map(function(id) { return questionById[id]; }).filter(Boolean);

    var grading = gradeExam(keyMap, payload.responses || {});
    var settings = getSettings_();
    var status = grading.percent >= settings.pass_percent ? 'ผ่าน' : 'ควรทบทวน';
    var submittedAt = new Date();
    var startTime = new Date(attempt.StartTime);
    var duration = Math.max(0, Math.round((submittedAt.getTime() - startTime.getTime()) / 1000));
    var rawScore = Math.round((grading.percent / 100) * questions.length * 100) / 100;

    appendObjectRows_(APP.SHEETS.RESPONSES, questions.map(function(q) {
      var qr = grading.questionResults[q.id];
      return {
        AttemptID: attempt.AttemptID,
        QuestionID: q.id,
        StudentAnswerJSON: JSON.stringify((payload.responses || {})[q.id] || []),
        Score: Math.round(qr.score * 10000) / 100,
        AccountScore: Math.round(qr.accountScore * 10000) / 100,
        CategoryScore: Math.round(qr.categoryScore * 10000) / 100,
        ChangeScore: Math.round(qr.changeScore * 10000) / 100
      };
    }));

    updateObjectRow_(APP.SHEETS.ATTEMPTS, attempt._rowNumber, {
      SubmitTime: submittedAt,
      DurationSeconds: duration,
      RawScore: rawScore,
      Percent: grading.percent,
      AccountScore: grading.accountPercent,
      CategoryScore: grading.categoryPercent,
      ChangeScore: grading.changePercent,
      Status: status
    });

    attempt.SubmitTime = submittedAt;
    attempt.Percent = grading.percent;
    attempt.AccountScore = grading.accountPercent;
    attempt.CategoryScore = grading.categoryPercent;
    attempt.ChangeScore = grading.changePercent;
    attempt.Status = status;
    return resultFromAttempt_(attempt);
  } finally {
    lock.releaseLock();
  }
}

function getStudentResult(attemptId) {
  var attempt = findRowBy_(APP.SHEETS.ATTEMPTS, 'AttemptID', attemptId);
  if (!attempt || !attempt.SubmitTime) throw new Error('ยังไม่พบผลการสอบ');
  return resultFromAttempt_(attempt);
}

function requireAdmin_(adminKey) {
  var expected = PropertiesService.getScriptProperties().getProperty('ADMIN_KEY');
  if (!expected) throw new Error('กรุณาตั้งค่า ADMIN_KEY ใน Script Properties');
  if (String(adminKey || '') !== String(expected)) throw new Error('รหัสผู้ดูแลไม่ถูกต้อง');
}

function getDashboardData(adminKey) {
  requireAdmin_(adminKey);
  var attempts = readTable_(APP.SHEETS.ATTEMPTS).filter(function(r) { return !!r.SubmitTime; });
  var numeric = attempts.map(function(r) { return Number(r.Percent) || 0; });
  var pass = attempts.filter(function(r) { return String(r.Status) === 'ผ่าน'; }).length;
  var avg = numeric.length ? numeric.reduce(function(a, b) { return a + b; }, 0) / numeric.length : 0;
  return {
    summary: {
      total: attempts.length,
      pass: pass,
      review: attempts.length - pass,
      average: Math.round(avg * 100) / 100,
      highest: numeric.length ? Math.max.apply(null, numeric) : 0,
      lowest: numeric.length ? Math.min.apply(null, numeric) : 0
    },
    attempts: attempts.map(function(r) {
      return {
        attemptId: r.AttemptID,
        studentId: r.StudentID,
        name: (r.FirstName + ' ' + r.LastName).trim(),
        className: r.Class,
        room: r.Room,
        number: r.Number,
        formId: r.FormID,
        percent: Number(r.Percent) || 0,
        accountPercent: Number(r.AccountScore) || 0,
        categoryPercent: Number(r.CategoryScore) || 0,
        changePercent: Number(r.ChangeScore) || 0,
        status: r.Status,
        submitTime: r.SubmitTime ? new Date(r.SubmitTime).toISOString() : ''
      };
    })
  };
}

function buildHtml_(view) {
  var viewJson = JSON.stringify(view);
  return `<!DOCTYPE html>
<html lang="th">
<head>
  <base target="_top">
  <meta charset="utf-8">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Sarabun:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    :root{--navy:#15385f;--blue:#2878c7;--light:#eef6ff;--line:#d8e4ef;--ink:#183047;--muted:#66788a;--green:#238b57;--green-bg:#eaf8f0;--red:#b94a48;--red-bg:#fff0ef;--white:#fff;--shadow:0 12px 30px rgba(21,56,95,.09);--radius:18px}
    *{box-sizing:border-box}html,body{margin:0;min-height:100%;font-family:'Sarabun',sans-serif;color:var(--ink);background:#f6f9fc}button,input,select{font:inherit}.hidden{display:none!important}.app-shell{min-height:100vh}.topbar{min-height:76px;background:var(--navy);color:#fff;display:flex;align-items:center;justify-content:space-between;padding:14px max(18px,calc((100vw - 1180px)/2));gap:20px;position:sticky;top:0;z-index:20;box-shadow:0 3px 18px rgba(12,42,72,.16)}.brand-title{font-weight:700;font-size:1.12rem}.brand-subtitle{opacity:.78;font-size:.86rem;margin-top:2px}.timer-box{font-weight:700;font-variant-numeric:tabular-nums;background:rgba(255,255,255,.12);border:1px solid rgba(255,255,255,.3);padding:9px 14px;border-radius:12px;min-width:86px;text-align:center}.timer-box.warning{background:#8b2f2f}.container{width:min(1180px,calc(100% - 28px));margin:30px auto 64px}.panel{background:#fff;border:1px solid var(--line);border-radius:var(--radius);box-shadow:var(--shadow);padding:28px}.compact-panel{padding:18px}.center-panel{text-align:center;min-height:260px;display:grid;place-content:center;color:var(--muted)}.spinner{width:38px;height:38px;border:4px solid #d9e8f7;border-top-color:var(--blue);border-radius:50%;animation:spin .8s linear infinite;margin:auto}@keyframes spin{to{transform:rotate(360deg)}}.section-heading h1,.dashboard-head h1{margin:0 0 8px;color:var(--navy);font-size:clamp(1.45rem,3vw,2rem)}.section-heading p,.dashboard-head p{margin:0;color:var(--muted);line-height:1.65}.instruction-box{display:flex;gap:12px;align-items:flex-start;background:var(--light);border:1px solid #d4e8fb;border-radius:14px;padding:15px 18px;margin:24px 0}.instruction-box strong{color:var(--navy);white-space:nowrap}.student-box{max-width:620px;margin:auto}.student-form{display:flex;gap:10px;margin-top:22px}.student-form input,.inline-form input,.table-toolbar input{width:100%;border:1px solid #cbd9e6;border-radius:12px;padding:12px 13px;color:var(--ink);background:#fff;outline:none}.student-form input:focus,.inline-form input:focus,.table-toolbar input:focus,select:focus{border-color:var(--blue);box-shadow:0 0 0 3px rgba(40,120,199,.12)}.btn{border:0;border-radius:12px;padding:11px 18px;font-weight:700;cursor:pointer;transition:.16s ease;min-height:44px}.btn:hover{transform:translateY(-1px)}.btn:disabled{opacity:.5;cursor:not-allowed;transform:none}.btn.primary{background:var(--blue);color:#fff}.btn.secondary{background:#edf3f8;color:var(--navy);border:1px solid #d3e0ea}.btn.success{background:var(--green);color:#fff}.privacy-note{color:var(--muted);font-size:.86rem;margin:18px 0 0}.exam-meta{display:flex;justify-content:space-between;align-items:center;margin-bottom:13px;gap:15px}.exam-meta strong{display:block;color:var(--navy)}.exam-meta span{color:var(--muted);font-size:.9rem}.form-chip{background:#eaf3fd;color:var(--navy)!important;border:1px solid #d2e4f7;padding:7px 11px;border-radius:999px;font-weight:700;white-space:nowrap}.progress-track{height:8px;background:#dce8f3;border-radius:999px;overflow:hidden;margin-bottom:18px}.progress-fill{height:100%;width:0;background:var(--blue);transition:width .2s}.exam-layout{display:grid;grid-template-columns:210px 1fr;gap:18px}.nav-title{font-weight:700;color:var(--navy);margin-bottom:12px}.nav-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:8px}.nav-btn{aspect-ratio:1;border:1px solid #d6e1ea;background:#f7fafc;border-radius:10px;color:#50697d;font-weight:700;cursor:pointer}.nav-btn.answered{background:#e9f7ef;border-color:#bfe2cd;color:#26794e}.nav-btn.current{outline:3px solid rgba(40,120,199,.18);border-color:var(--blue);background:#eaf3fd;color:var(--navy)}.nav-legend{display:flex;flex-direction:column;gap:7px;margin-top:15px;color:var(--muted);font-size:.78rem}.nav-legend span{display:flex;align-items:center;gap:7px}.dot{width:9px;height:9px;border-radius:50%;display:inline-block}.dot.answered{background:#5ca57b}.dot.current{background:var(--blue)}.question-panel{min-height:510px;display:flex;flex-direction:column}.question-topline{display:flex;justify-content:space-between;align-items:center;color:var(--muted);font-size:.9rem}.difficulty{font-weight:600}.question-text{font-size:clamp(1.12rem,2.4vw,1.45rem);line-height:1.65;color:var(--navy);margin:22px 0 24px}.answer-table-wrap{overflow-x:auto}.answer-table{width:100%;border-collapse:separate;border-spacing:0 10px;min-width:650px}.answer-table th{text-align:left;font-size:.85rem;color:var(--muted);font-weight:600;padding:0 8px}.answer-table td{padding:0 8px}.answer-table select{width:100%;padding:12px;border:1px solid #cedae5;border-radius:11px;background:#fff;color:var(--ink);outline:none}.exam-actions{display:flex;gap:10px;justify-content:flex-end;margin-top:auto;padding-top:28px}.result-hero{text-align:center;padding:8px 0 22px}.result-status{display:inline-block;padding:7px 14px;border-radius:999px;background:var(--green-bg);color:var(--green);font-weight:700}.result-status.review{background:var(--red-bg);color:var(--red)}.result-score{font-size:clamp(3rem,10vw,5rem);font-weight:700;color:var(--navy);line-height:1.1;margin:12px}.result-hero h2{margin:0 0 5px}.result-hero p{margin:0;color:var(--muted)}.skill-grid,.summary-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:14px}.skill-card,.summary-card{border:1px solid var(--line);border-radius:14px;padding:16px;background:#fbfdff}.skill-card{display:grid;gap:7px}.skill-card span{color:var(--muted)}.skill-card b{font-size:1.35rem;color:var(--navy)}.mini-track{height:7px;background:#e4edf5;border-radius:999px;overflow:hidden}.mini-track i{display:block;height:100%;background:var(--blue);width:0}.recommendation{margin-top:20px;padding:16px 18px;border-left:4px solid var(--blue);background:var(--light);border-radius:10px;line-height:1.6}.teacher-login{max-width:620px;margin:auto}.inline-form{display:flex;gap:10px;margin-top:22px}.dashboard-head{display:flex;justify-content:space-between;align-items:flex-end;gap:15px;margin-bottom:18px}.summary-grid{grid-template-columns:repeat(6,1fr);margin-bottom:18px}.summary-card span{display:block;color:var(--muted);font-size:.82rem}.summary-card b{display:block;color:var(--navy);font-size:1.45rem;margin-top:4px}.table-toolbar{margin-bottom:14px}.table-toolbar input{max-width:420px}.table-scroll{overflow:auto}.result-table{width:100%;border-collapse:collapse;white-space:nowrap}.result-table th,.result-table td{padding:11px 10px;border-bottom:1px solid #e5edf4;text-align:left;font-size:.88rem}.result-table th{color:#526a7d;background:#f7fafc;position:sticky;top:0}.status-pass{color:var(--green);font-weight:700}.status-review{color:var(--red);font-weight:700}.modal{position:fixed;inset:0;background:rgba(10,31,50,.48);display:grid;place-items:center;padding:20px;z-index:50}.modal-card{width:min(460px,100%);background:#fff;border-radius:18px;padding:24px;box-shadow:0 20px 55px rgba(0,0,0,.2)}.modal-card h3{margin:0 0 10px;color:var(--navy)}.modal-card p{color:var(--muted);line-height:1.55}.modal-actions{display:flex;justify-content:flex-end;gap:10px;margin-top:20px}.toast{position:fixed;left:50%;bottom:26px;transform:translateX(-50%);background:#243a4d;color:#fff;border-radius:12px;padding:11px 16px;z-index:60;box-shadow:var(--shadow);max-width:calc(100% - 30px)}
    @media(max-width:900px){.exam-layout{grid-template-columns:1fr}.question-nav{order:2}.nav-grid{grid-template-columns:repeat(10,1fr)}.summary-grid{grid-template-columns:repeat(3,1fr)}}
    @media(max-width:640px){.topbar{min-height:68px;padding:11px 14px}.brand-subtitle{display:none}.container{width:min(100% - 18px,1180px);margin:18px auto 40px}.panel{padding:19px;border-radius:15px}.student-form,.inline-form{flex-direction:column}.exam-meta{align-items:flex-start}.question-panel{min-height:500px}.nav-grid{grid-template-columns:repeat(5,1fr)}.skill-grid,.summary-grid{grid-template-columns:1fr}.exam-actions{display:grid;grid-template-columns:1fr 1fr}.exam-actions .success{grid-column:1/-1}.dashboard-head{align-items:flex-start;flex-direction:column}.answer-table{min-width:590px}.result-score{font-size:3.6rem}}
  </style>
</head>
<body>
<div id="app" class="app-shell">
  <header class="topbar">
    <div><div class="brand-title" id="brandTitle">แบบทดสอบการวิเคราะห์รายการค้า</div><div class="brand-subtitle">สินทรัพย์ • หนี้สิน • ส่วนของเจ้าของ</div></div>
    <div id="timerBox" class="timer-box hidden">30:00</div>
  </header>
  <main class="container">
    <section id="loadingView" class="panel center-panel"><div class="spinner"></div><p>กำลังเตรียมระบบ...</p></section>
    <section id="startView" class="panel student-box hidden">
      <div class="section-heading"><h1>เริ่มทำแบบทดสอบ</h1><p>กรอกรหัสประจำตัวนักเรียน ระบบจะดึงชื่อ ชั้น ห้อง และเลขที่ให้อัตโนมัติ</p></div>
      <div class="instruction-box"><strong>คำชี้แจง</strong><span>สุ่มแบบทดสอบคู่ขนาน 1 ชุด จำนวน <b id="questionCountText">20</b> ข้อ ใช้เวลา <b id="examTimeText">30</b> นาที</span></div>
      <form id="studentForm" class="student-form" autocomplete="off">
        <input id="studentId" name="studentId" required inputmode="numeric" maxlength="20" placeholder="รหัสประจำตัวนักเรียน">
        <button type="submit" class="btn primary">เริ่มทำแบบทดสอบ</button>
      </form>
      <p class="privacy-note">ข้อมูลนักเรียนดึงจากชีต Students และเฉลยอยู่ฝั่งเซิร์ฟเวอร์เท่านั้น</p>
    </section>
    <section id="examView" class="hidden">
      <div class="exam-meta"><div><strong id="studentNameText"></strong><span id="studentMetaText"></span></div><div class="form-chip">ชุด <span id="formIdText">-</span></div></div>
      <div class="progress-track"><div id="progressBar" class="progress-fill"></div></div>
      <div class="exam-layout">
        <aside class="question-nav panel compact-panel"><div class="nav-title">ข้อสอบ</div><div id="questionNavGrid" class="nav-grid"></div><div class="nav-legend"><span><i class="dot answered"></i>ตอบแล้ว</span><span><i class="dot current"></i>ข้อปัจจุบัน</span></div></aside>
        <section class="panel question-panel">
          <div class="question-topline"><span id="questionPosition"></span><span id="difficultyText" class="difficulty"></span></div>
          <h2 id="questionText" class="question-text"></h2>
          <div class="answer-table-wrap"><table class="answer-table"><thead><tr><th>บัญชีที่เกี่ยวข้อง</th><th>หมวดบัญชี</th><th>การเปลี่ยนแปลง</th></tr></thead><tbody id="answerRows"></tbody></table></div>
          <div class="exam-actions"><button id="prevBtn" class="btn secondary" type="button">ย้อนกลับ</button><button id="nextBtn" class="btn primary" type="button">ถัดไป</button><button id="submitBtn" class="btn success hidden" type="button">ส่งคำตอบ</button></div>
        </section>
      </div>
    </section>
    <section id="resultView" class="panel hidden">
      <div class="result-hero"><div id="resultStatus" class="result-status"></div><div id="resultScore" class="result-score">0%</div><h2 id="resultName"></h2><p id="resultMeta"></p></div>
      <div class="skill-grid"><div class="skill-card"><span>ระบุบัญชี</span><b id="accountScore">0%</b><div class="mini-track"><i id="accountBar"></i></div></div><div class="skill-card"><span>จำแนกหมวดบัญชี</span><b id="categoryScore">0%</b><div class="mini-track"><i id="categoryBar"></i></div></div><div class="skill-card"><span>วิเคราะห์เพิ่ม/ลด</span><b id="changeScore">0%</b><div class="mini-track"><i id="changeBar"></i></div></div></div>
      <div id="recommendation" class="recommendation"></div>
      <div style="text-align:right;margin-top:18px"><button id="restartBtn" class="btn secondary" type="button">กลับหน้าแรก</button></div>
    </section>
    <section id="teacherView" class="hidden">
      <div class="panel teacher-login" id="teacherLogin"><div class="section-heading"><h1>แดชบอร์ดครู</h1><p>กรอกรหัสผู้ดูแลที่ตั้งไว้ใน Script Properties ชื่อ ADMIN_KEY</p></div><div class="inline-form"><input id="adminKey" type="password" placeholder="ADMIN_KEY"><button id="loadDashboardBtn" class="btn primary" type="button">เข้าสู่แดชบอร์ด</button></div></div>
      <div id="dashboardContent" class="hidden"><div class="dashboard-head"><div><h1>ผลการทดสอบ</h1><p>ภาพรวมผลการวิเคราะห์รายการค้า</p></div><button id="exportCsvBtn" class="btn secondary" type="button">Export CSV</button></div><div id="summaryCards" class="summary-grid"></div><div class="panel"><div class="table-toolbar"><input id="resultSearch" placeholder="ค้นหาชื่อ รหัส ชั้น หรือห้อง"></div><div class="table-scroll"><table class="result-table"><thead><tr><th>รหัส</th><th>ชื่อ-นามสกุล</th><th>ชั้น/ห้อง</th><th>ชุด</th><th>รวม</th><th>บัญชี</th><th>หมวด</th><th>เพิ่ม/ลด</th><th>สถานะ</th><th>เวลาส่ง</th></tr></thead><tbody id="resultTableBody"></tbody></table></div></div></div>
    </section>
  </main>
  <div id="modal" class="modal hidden"><div class="modal-card"><h3 id="modalTitle">ยืนยันการส่ง</h3><p id="modalMessage"></p><div class="modal-actions"><button id="modalCancel" class="btn secondary" type="button">ยกเลิก</button><button id="modalConfirm" class="btn primary" type="button">ยืนยัน</button></div></div></div>
  <div id="toast" class="toast hidden"></div>
</div>
<script>
window.INITIAL_VIEW = ` + viewJson + `;
(function(){
  'use strict';
  var STORAGE_KEY='ataot:session:v2';
  var state={config:null,accounts:[],student:null,attempt:null,questions:[],answers:{},index:0,timer:null,dashboard:null};
  function $(id){return document.getElementById(id);}
  function gas(name){var args=[].slice.call(arguments,1);return new Promise(function(resolve,reject){var runner=google.script.run.withSuccessHandler(resolve).withFailureHandler(function(err){reject(new Error(err&&err.message?err.message:String(err)));});runner[name].apply(runner,args);});}
  function showOnly(id){['loadingView','startView','examView','resultView','teacherView'].forEach(function(v){$(v).classList.toggle('hidden',v!==id);});}
  function toast(message){var el=$('toast');el.textContent=message;el.classList.remove('hidden');clearTimeout(toast.t);toast.t=setTimeout(function(){el.classList.add('hidden');},3200);}
  function setBusy(btn,busy,label){if(!btn)return;if(busy){btn.dataset.label=btn.textContent;btn.disabled=true;btn.textContent=label||'กำลังดำเนินการ...';}else{btn.disabled=false;btn.textContent=btn.dataset.label||btn.textContent;}}
  function pct(v){return Math.round(Number(v)||0)+'%';}
  function escapeCsv(v){var s=String(v==null?'':v);return /[\",\n]/.test(s)?'\"'+s.replace(/\"/g,'\"\"')+'\"':s;}
  async function boot(){try{if(window.INITIAL_VIEW==='teacher'){showOnly('teacherView');bindTeacher();return;}var data=await gas('getBootstrapData');state.config=data.config;state.accounts=data.accounts;$('brandTitle').textContent=data.config.title;$('questionCountText').textContent=data.config.questionCount;$('examTimeText').textContent=data.config.examTimeMinutes;bindStudent();if(!restoreSession())showOnly('startView');}catch(err){showOnly('startView');toast(err.message);}}
  function bindStudent(){$('studentForm').addEventListener('submit',startExamClient);$('prevBtn').addEventListener('click',function(){goTo(state.index-1);});$('nextBtn').addEventListener('click',function(){goTo(state.index+1);});$('submitBtn').addEventListener('click',function(){confirmSubmit(false);});$('restartBtn').addEventListener('click',function(){clearSession();location.reload();});$('modalCancel').addEventListener('click',closeModal);$('modalConfirm').addEventListener('click',function(){closeModal();submitExamClient(false);});}
  async function startExamClient(event){event.preventDefault();var btn=event.submitter||$('studentForm').querySelector('button[type=submit]');var studentId=$('studentId').value.trim();setBusy(btn,true,'กำลังสร้างข้อสอบ...');try{var attempt=await gas('startExam',{studentId:studentId});state.student=attempt.student;state.attempt=attempt;state.questions=attempt.questions;state.answers={};state.index=0;state.questions.forEach(function(q){state.answers[q.id]=emptyRows(q.answerCount);});saveSession();showExam();}catch(err){toast(err.message);}finally{setBusy(btn,false);}}
  function emptyRows(count){return Array.from({length:count},function(){return{account:'',category:'',change:''};});}
  function showExam(){showOnly('examView');$('timerBox').classList.remove('hidden');$('studentNameText').textContent=state.student.firstName+' '+state.student.lastName;$('studentMetaText').textContent=state.student.className+'/'+state.student.room+' เลขที่ '+state.student.number;$('formIdText').textContent=state.attempt.formId;renderNav();renderQuestion();startTimer();}
  function renderNav(){var grid=$('questionNavGrid');grid.innerHTML='';state.questions.forEach(function(q,i){var b=document.createElement('button');b.type='button';b.className='nav-btn';b.textContent=i+1;b.addEventListener('click',function(){goTo(i);});grid.appendChild(b);});updateNav();}
  function updateNav(){Array.prototype.slice.call($('questionNavGrid').children).forEach(function(b,i){var q=state.questions[i];b.classList.toggle('answered',isAnswered(q));b.classList.toggle('current',i===state.index);});var answered=state.questions.filter(isAnswered).length;$('progressBar').style.width=(state.questions.length?answered/state.questions.length*100:0)+'%';}
  function isAnswered(q){var rows=state.answers[q.id]||[];return rows.length===q.answerCount&&rows.every(function(r){return r.account&&r.category&&r.change;});}
  function renderQuestion(){var q=state.questions[state.index];if(!q)return;$('questionPosition').textContent='ข้อ '+(state.index+1)+' จาก '+state.questions.length;$('questionText').textContent=q.text;$('difficultyText').textContent=q.difficulty||'';var body=$('answerRows');body.innerHTML='';var rows=state.answers[q.id]||emptyRows(q.answerCount);rows.forEach(function(row,rowIndex){var tr=document.createElement('tr');tr.appendChild(selectCell(accountOptions(),row.account,'account',rowIndex));tr.appendChild(selectCell(state.config.categories,row.category,'category',rowIndex));tr.appendChild(selectCell(state.config.changes,row.change,'change',rowIndex));body.appendChild(tr);});$('prevBtn').disabled=state.index===0;var last=state.index===state.questions.length-1;$('nextBtn').classList.toggle('hidden',last);$('submitBtn').classList.toggle('hidden',!last);updateNav();}
  function accountOptions(){return state.accounts.map(function(a){return a.name;});}
  function selectCell(options,value,field,rowIndex){var td=document.createElement('td');var s=document.createElement('select');var blank=document.createElement('option');blank.value='';blank.textContent='— เลือก —';s.appendChild(blank);options.forEach(function(opt){var o=document.createElement('option');o.value=opt;o.textContent=opt;s.appendChild(o);});s.value=value||'';s.addEventListener('change',function(){var q=state.questions[state.index];state.answers[q.id][rowIndex][field]=s.value;saveSession();updateNav();});td.appendChild(s);return td;}
  function goTo(index){if(index<0||index>=state.questions.length)return;state.index=index;saveSession();renderQuestion();window.scrollTo({top:0,behavior:'smooth'});}
  function startTimer(){clearInterval(state.timer);tick();state.timer=setInterval(tick,1000);}
  function tick(){if(!state.attempt)return;var remaining=Math.max(0,new Date(state.attempt.expiresAt).getTime()-Date.now());var sec=Math.ceil(remaining/1000);var mm=String(Math.floor(sec/60)).padStart(2,'0');var ss=String(sec%60).padStart(2,'0');$('timerBox').textContent=mm+':'+ss;$('timerBox').classList.toggle('warning',sec<=300);if(sec<=0){clearInterval(state.timer);confirmSubmit(true);}}
  function confirmSubmit(auto){var answered=state.questions.filter(isAnswered).length;var unanswered=state.questions.length-answered;if(auto){submitExamClient(true);return;}$('modalMessage').textContent='ตอบแล้ว '+answered+' ข้อ • ยังไม่ตอบ '+unanswered+' ข้อ เมื่อส่งแล้วจะไม่สามารถแก้ไขคำตอบได้';$('modal').classList.remove('hidden');}
  function closeModal(){$('modal').classList.add('hidden');}
  async function submitExamClient(auto){var btn=$('submitBtn');setBusy(btn,true,'กำลังตรวจคำตอบ...');try{var result=await gas('submitExam',{attemptId:state.attempt.attemptId,responses:state.answers});clearInterval(state.timer);clearSession();showResult(result);if(auto)toast('หมดเวลา ระบบส่งคำตอบให้แล้ว');}catch(err){toast(err.message);}finally{setBusy(btn,false);}}
  function showResult(result){showOnly('resultView');$('timerBox').classList.add('hidden');$('resultScore').textContent=pct(result.percent);$('resultName').textContent=result.studentName;$('resultMeta').textContent=result.className+'/'+result.room+' เลขที่ '+result.number+' • ชุด '+result.formId;var pass=result.status==='ผ่าน';$('resultStatus').textContent=result.status;$('resultStatus').classList.toggle('review',!pass);setSkill('account',result.accountPercent);setSkill('category',result.categoryPercent);setSkill('change',result.changePercent);$('recommendation').textContent=recommendation(result);}
  function setSkill(prefix,value){$(prefix+'Score').textContent=pct(value);$(prefix+'Bar').style.width=Math.max(0,Math.min(100,Number(value)||0))+'%';}
  function recommendation(r){var scores=[['การระบุบัญชี',r.accountPercent],['การจำแนกหมวดบัญชี',r.categoryPercent],['การวิเคราะห์เพิ่ม/ลด',r.changePercent]].sort(function(a,b){return a[1]-b[1];});if(scores[0][1]>=80)return'ทำได้ดีในทั้ง 3 ทักษะ ควรรักษาความแม่นยำและฝึกโจทย์ 3 บัญชีต่อไป';if(scores[0][0]==='การจำแนกหมวดบัญชี')return'ควรทบทวนการจำแนกบัญชีเป็น สินทรัพย์ หนี้สิน และส่วนของเจ้าของ';if(scores[0][0]==='การวิเคราะห์เพิ่ม/ลด')return'ควรทบทวนผลกระทบของรายการค้าต่อสมการบัญชี โดยฝึกดูว่าบัญชีใดเพิ่มขึ้นหรือลดลง';return'ควรฝึกระบุชื่อบัญชีที่ได้รับผลกระทบจากรายการค้าให้ครบก่อนวิเคราะห์หมวดและการเพิ่ม/ลด';}
  function saveSession(){try{localStorage.setItem(STORAGE_KEY,JSON.stringify({student:state.student,attempt:state.attempt,questions:state.questions,answers:state.answers,index:state.index}));}catch(err){}}
  function restoreSession(){try{var saved=JSON.parse(localStorage.getItem(STORAGE_KEY)||'null');if(!saved||!saved.attempt||!saved.questions||Date.now()>new Date(saved.attempt.expiresAt).getTime())return false;state.student=saved.student;state.attempt=saved.attempt;state.questions=saved.questions;state.answers=saved.answers||{};state.index=Number(saved.index)||0;state.questions.forEach(function(q){if(!state.answers[q.id])state.answers[q.id]=emptyRows(q.answerCount);});showExam();toast('กู้คืนคำตอบจากการทำข้อสอบครั้งก่อนแล้ว');return true;}catch(err){return false;}}
  function clearSession(){try{localStorage.removeItem(STORAGE_KEY);}catch(err){}}
  function bindTeacher(){$('loadDashboardBtn').addEventListener('click',loadDashboard);$('resultSearch').addEventListener('input',renderDashboardTable);$('exportCsvBtn').addEventListener('click',exportCsv);}
  async function loadDashboard(){var key=$('adminKey').value.trim();if(!key){toast('กรุณากรอกรหัสผู้ดูแล');return;}var btn=$('loadDashboardBtn');setBusy(btn,true,'กำลังโหลด...');try{state.dashboard=await gas('getDashboardData',key);$('teacherLogin').classList.add('hidden');$('dashboardContent').classList.remove('hidden');renderSummary();renderDashboardTable();}catch(err){toast(err.message);}finally{setBusy(btn,false);}}
  function renderSummary(){var s=state.dashboard.summary;var items=[['ผู้เข้าสอบ',s.total],['ผ่าน',s.pass],['ควรทบทวน',s.review],['เฉลี่ย',pct(s.average)],['สูงสุด',pct(s.highest)],['ต่ำสุด',pct(s.lowest)]];$('summaryCards').innerHTML=items.map(function(x){return'<div class="summary-card"><span>'+x[0]+'</span><b>'+x[1]+'</b></div>';}).join('');}
  function renderDashboardTable(){if(!state.dashboard)return;var q=$('resultSearch').value.trim().toLowerCase();var rows=state.dashboard.attempts.filter(function(r){return[r.studentId,r.name,r.className,r.room,r.number,r.formId].join(' ').toLowerCase().indexOf(q)!==-1;});$('resultTableBody').innerHTML=rows.map(function(r){return'<tr><td>'+safe(r.studentId)+'</td><td>'+safe(r.name)+'</td><td>'+safe(r.className)+'/'+safe(r.room)+' #'+safe(r.number)+'</td><td>'+safe(r.formId)+'</td><td>'+pct(r.percent)+'</td><td>'+pct(r.accountPercent)+'</td><td>'+pct(r.categoryPercent)+'</td><td>'+pct(r.changePercent)+'</td><td class="'+(r.status==='ผ่าน'?'status-pass':'status-review')+'">'+safe(r.status)+'</td><td>'+formatDate(r.submitTime)+'</td></tr>';}).join('');}
  function safe(v){return String(v==null?'':v).replace(/[&<>'\"]/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','\"':'&quot;'}[c];});}
  function formatDate(v){if(!v)return'';try{return new Intl.DateTimeFormat('th-TH',{dateStyle:'short',timeStyle:'short'}).format(new Date(v));}catch(err){return v;}}
  function exportCsv(){if(!state.dashboard)return;var headers=['StudentID','Name','Class','Room','Number','Form','Percent','Account','Category','Change','Status','SubmitTime'];var rows=state.dashboard.attempts.map(function(r){return[r.studentId,r.name,r.className,r.room,r.number,r.formId,r.percent,r.accountPercent,r.categoryPercent,r.changePercent,r.status,r.submitTime];});var csv='\ufeff'+[headers].concat(rows).map(function(row){return row.map(escapeCsv).join(',');}).join('\n');var blob=new Blob([csv],{type:'text/csv;charset=utf-8'});var a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='accounting-test-results.csv';a.click();URL.revokeObjectURL(a.href);}
  boot();
})();
</script>
</body>
</html>`;
}
