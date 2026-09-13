function cleanText_(value) {
  return value == null ? '' : String(value).trim();
}

function normalizeAnswer(rows) {
  var seen = {};
  var normalized = (rows || []).map(function (row) {
    return {
      account: cleanText_(row && row.account),
      category: cleanText_(row && row.category),
      change: cleanText_(row && row.change)
    };
  }).filter(function (row) {
    return row.account || row.category || row.change;
  }).filter(function (row) {
    var key = [row.account, row.category, row.change].join('|');
    if (seen[key]) return false;
    seen[key] = true;
    return true;
  });

  normalized.sort(function (a, b) {
    return [a.account, a.category, a.change].join('|')
      .localeCompare([b.account, b.category, b.change].join('|'), 'th');
  });
  return normalized;
}

function gradeQuestion(keyRows, studentRows) {
  var key = normalizeAnswer(keyRows);
  var student = normalizeAnswer(studentRows);
  var expectedCount = key.length || 1;
  var byAccount = {};

  student.forEach(function (row) {
    if (row.account && !byAccount[row.account]) byAccount[row.account] = row;
  });

  var accountHits = 0;
  var categoryHits = 0;
  var changeHits = 0;

  key.forEach(function (expected) {
    var actual = byAccount[expected.account];
    if (!actual) return;
    accountHits += 1;
    if (actual.category === expected.category) categoryHits += 1;
    if (actual.change === expected.change) changeHits += 1;
  });

  var accountScore = accountHits / expectedCount;
  var categoryScore = categoryHits / expectedCount;
  var changeScore = changeHits / expectedCount;
  var score = (accountScore + categoryScore + changeScore) / 3;

  return {
    score: score,
    accountScore: accountScore,
    categoryScore: categoryScore,
    changeScore: changeScore
  };
}

function pickQuestionKeys(questionKeys, assignedIds) {
  var out = {};
  (assignedIds || []).forEach(function (id) {
    if (Object.prototype.hasOwnProperty.call(questionKeys || {}, id)) out[id] = questionKeys[id];
  });
  return out;
}

function gradeExam(questionKeys, responses) {
  var ids = Object.keys(questionKeys || {});
  var count = ids.length || 1;
  var total = 0;
  var account = 0;
  var category = 0;
  var change = 0;
  var questionResults = {};

  ids.forEach(function (id) {
    var result = gradeQuestion(questionKeys[id], (responses || {})[id] || []);
    questionResults[id] = result;
    total += result.score;
    account += result.accountScore;
    category += result.categoryScore;
    change += result.changeScore;
  });

  function pct(value) {
    return Math.round((value / count) * 10000) / 100;
  }

  return {
    questionCount: ids.length,
    percent: pct(total),
    accountPercent: pct(account),
    categoryPercent: pct(category),
    changePercent: pct(change),
    questionResults: questionResults
  };
}

if (typeof module !== 'undefined') {
  module.exports = { normalizeAnswer, gradeQuestion, gradeExam, pickQuestionKeys };
}
