var APP = {
  SHEETS: {
    ACCOUNTS: 'Accounts',
    QUESTIONS: 'Questions',
    ATTEMPTS: 'Attempts',
    RESPONSES: 'Responses',
    SETTINGS: 'Settings',
    STUDENTS: 'Students',
    DASHBOARD: 'Dashboard'
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

function getSpreadsheet_() {
  var id = PropertiesService.getScriptProperties().getProperty('SPREADSHEET_ID');
  if (id) return SpreadsheetApp.openById(id);
  var active = SpreadsheetApp.getActiveSpreadsheet();
  if (!active) throw new Error('กรุณาตั้งค่า Script Property ชื่อ SPREADSHEET_ID');
  return active;
}

function getSettings_() {
  var rows = readTable_(APP.SHEETS.SETTINGS);
  var out = {};
  rows.forEach(function (row) {
    if (row.Setting) out[String(row.Setting).trim()] = row.Value;
  });
  Object.keys(APP.DEFAULTS).forEach(function (key) {
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
