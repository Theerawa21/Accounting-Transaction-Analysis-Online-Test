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
    key.push({
      account: row['Account' + i],
      category: row['Category' + i],
      change: row['Change' + i]
    });
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
    .filter(function (row) {
      return String(row.FormID) === String(formId) && String(row.Active).toUpperCase() !== 'FALSE';
    })
    .map(parseQuestionRow_)
    .sort(function (a, b) { return a.sequence - b.sequence; });
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

function startExam(student) {
  var check = validateStudent(student);
  if (!check.ok) throw new Error(check.message);

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
      StudentID: String(student.studentId).trim(),
      FirstName: String(student.firstName).trim(),
      LastName: String(student.lastName).trim(),
      Class: String(student.className).trim(),
      Room: String(student.room).trim(),
      Number: String(student.number).trim(),
      FormID: formId,
      StartTime: now,
      SubmitTime: '',
      DurationSeconds: '',
      RawScore: '',
      Percent: '',
      AccountScore: '',
      CategoryScore: '',
      ChangeScore: '',
      Status: 'IN_PROGRESS',
      QuestionIDs: JSON.stringify(questions.map(function (q) { return q.id; }))
    }]);
  } finally {
    lock.releaseLock();
  }

  return {
    attemptId: attemptId,
    formId: formId,
    startedAt: now.toISOString(),
    expiresAt: expires.toISOString(),
    questions: questions.map(publicQuestion_)
  };
}

function getQuestions(attemptId) {
  var attempt = findRowBy_(APP.SHEETS.ATTEMPTS, 'AttemptID', attemptId);
  if (!attempt) throw new Error('ไม่พบรหัสการสอบ');
  return shuffle_(getActiveQuestionsForForm_(attempt.FormID)).map(publicQuestion_);
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
    var allKeyMap = {};
    var questionById = {};
    allQuestions.forEach(function (q) { allKeyMap[q.id] = q.key; questionById[q.id] = q; });
    var assignedIds;
    try { assignedIds = JSON.parse(String(attempt.QuestionIDs || '[]')); } catch (_) { assignedIds = []; }
    if (!assignedIds.length) assignedIds = allQuestions.map(function (q) { return q.id; });
    var keyMap = pickQuestionKeys(allKeyMap, assignedIds);
    var questions = assignedIds.map(function (id) { return questionById[id]; }).filter(Boolean);

    var responses = payload.responses || {};
    var grading = gradeExam(keyMap, responses);
    var settings = getSettings_();
    var status = grading.percent >= settings.pass_percent ? 'ผ่าน' : 'ควรทบทวน';
    var submittedAt = new Date();
    var startTime = new Date(attempt.StartTime);
    var duration = Math.max(0, Math.round((submittedAt.getTime() - startTime.getTime()) / 1000));
    var rawScore = Math.round((grading.percent / 100) * questions.length * 100) / 100;

    var responseRows = questions.map(function (q) {
      var qr = grading.questionResults[q.id];
      return {
        AttemptID: attempt.AttemptID,
        QuestionID: q.id,
        StudentAnswerJSON: JSON.stringify(responses[q.id] || []),
        Score: Math.round(qr.score * 10000) / 100,
        AccountScore: Math.round(qr.accountScore * 10000) / 100,
        CategoryScore: Math.round(qr.categoryScore * 10000) / 100,
        ChangeScore: Math.round(qr.changeScore * 10000) / 100
      };
    });
    appendObjectRows_(APP.SHEETS.RESPONSES, responseRows);

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
