const assert = require('node:assert/strict');
const { normalizeAnswer, gradeQuestion, gradeExam, pickQuestionKeys } = require('../apps-script/GradingService.gs');
const { validateStudent, validateSubmission } = require('../apps-script/SecurityService.gs');

function approx(actual, expected, epsilon = 1e-9) {
  assert.ok(Math.abs(actual - expected) <= epsilon, `${actual} != ${expected}`);
}

const key2 = [
  { account: 'เงินสด', category: 'สินทรัพย์', change: 'เพิ่มขึ้น' },
  { account: 'ทุน', category: 'ส่วนของเจ้าของ', change: 'เพิ่มขึ้น' }
];

assert.deepEqual(normalizeAnswer([...key2].reverse()), normalizeAnswer(key2));

let r = gradeQuestion(key2, [...key2].reverse());
approx(r.score, 1);
approx(r.accountScore, 1);
approx(r.categoryScore, 1);
approx(r.changeScore, 1);

r = gradeQuestion(key2, [
  { account: 'เงินสด', category: 'หนี้สิน', change: 'เพิ่มขึ้น' },
  { account: 'ทุน', category: 'ส่วนของเจ้าของ', change: 'ลดลง' }
]);
approx(r.accountScore, 1);
approx(r.categoryScore, 0.5);
approx(r.changeScore, 0.5);
approx(r.score, (1 + 0.5 + 0.5) / 3);

const key3 = [
  { account: 'เครื่องคอมพิวเตอร์', category: 'สินทรัพย์', change: 'เพิ่มขึ้น' },
  { account: 'เงินสด', category: 'สินทรัพย์', change: 'ลดลง' },
  { account: 'เจ้าหนี้', category: 'หนี้สิน', change: 'เพิ่มขึ้น' }
];
r = gradeQuestion(key3, [key3[2], key3[0], key3[1]]);
approx(r.score, 1);

r = gradeQuestion(key2, [
  { account: 'เงินสด', category: 'สินทรัพย์', change: 'เพิ่มขึ้น' },
  { account: 'เงินสด', category: 'สินทรัพย์', change: 'เพิ่มขึ้น' },
  { account: '', category: '', change: '' }
]);
approx(r.accountScore, 0.5);

const exam = gradeExam(
  { Q1: key2, Q2: key3 },
  {
    Q1: key2,
    Q2: [key3[0], key3[1], { account: 'เจ้าหนี้', category: 'หนี้สิน', change: 'ลดลง' }]
  }
);
assert.equal(exam.questionCount, 2);
assert.ok(exam.percent < 100 && exam.percent > 80);
assert.equal(exam.accountPercent, 100);
assert.equal(exam.categoryPercent, 100);
assert.ok(exam.changePercent < 100);

assert.equal(validateStudent({studentId:'123', firstName:'ก', lastName:'ข', className:'ม.4', room:'1', number:'2'}).ok, true);
assert.equal(validateStudent({studentId:'', firstName:'ก', lastName:'ข', className:'ม.4', room:'1', number:'2'}).ok, false);
assert.equal(validateSubmission({attemptId:'AT-20260913-ABC12345', responses:{Q1:key2}}).ok, true);
assert.equal(validateSubmission({attemptId:'bad', responses:{}}).ok, false);

assert.deepEqual(Object.keys(pickQuestionKeys({A:key2,B:key3,C:key2}, ['C','A'])), ['C','A']);
console.log('grading tests passed');
