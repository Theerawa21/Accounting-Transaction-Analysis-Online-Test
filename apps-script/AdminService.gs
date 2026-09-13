function requireAdmin_(adminKey) {
  var expected = PropertiesService.getScriptProperties().getProperty('ADMIN_KEY');
  if (!expected) throw new Error('ยังไม่ได้ตั้งค่า ADMIN_KEY ใน Script Properties');
  if (String(adminKey || '') !== String(expected)) throw new Error('รหัสผู้ดูแลไม่ถูกต้อง');
}

function getDashboardData(adminKey) {
  requireAdmin_(adminKey);
  var attempts = readTable_(APP.SHEETS.ATTEMPTS).filter(function (r) { return !!r.SubmitTime; });
  var numeric = attempts.map(function (r) { return Number(r.Percent) || 0; });
  var pass = attempts.filter(function (r) { return String(r.Status) === 'ผ่าน'; }).length;
  var avg = numeric.length ? numeric.reduce(function (a,b){return a+b;},0) / numeric.length : 0;
  return {
    summary: {
      total: attempts.length,
      pass: pass,
      review: attempts.length - pass,
      average: Math.round(avg * 100) / 100,
      highest: numeric.length ? Math.max.apply(null, numeric) : 0,
      lowest: numeric.length ? Math.min.apply(null, numeric) : 0
    },
    attempts: attempts.map(function (r) {
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
