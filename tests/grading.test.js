const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const code = fs.readFileSync(path.join(__dirname, '../apps-script/Code.gs'), 'utf8');
const context = { console };
vm.createContext(context);
vm.runInContext(code, context);

const key2 = [
  { account: 'เงินสด', category: 'สินทรัพย์', change: 'เพิ่มขึ้น' },
  { account: 'ทุน', category: 'ส่วนของเจ้าของ', change: 'เพิ่มขึ้น' }
];
const key3 = [
  { account: 'เครื่องคอมพิวเตอร์', category: 'สินทรัพย์', change: 'เพิ่มขึ้น' },
  { account: 'เงินสด', category: 'สินทรัพย์', change: 'ลดลง' },
  { account: 'เจ้าหนี้', category: 'หนี้สิน', change: 'เพิ่มขึ้น' }
];

let r = context.gradeQ_(key2, [...key2].reverse());
assert.equal(r.score, 1);
assert.equal(r.accountScore, 1);
assert.equal(r.categoryScore, 1);
assert.equal(r.changeScore, 1);

r = context.gradeQ_(key2, [
  { account: 'เงินสด', category: 'หนี้สิน', change: 'เพิ่มขึ้น' },
  { account: 'ทุน', category: 'ส่วนของเจ้าของ', change: 'ลดลง' }
]);
assert.equal(r.accountScore, 1);
assert.equal(r.categoryScore, 0.5);
assert.equal(r.changeScore, 0.5);

r = context.gradeQ_(key3, [key3[2], key3[0], key3[1]]);
assert.equal(r.score, 1);

const exam = context.grade_({ Q1: key2, Q2: key3 }, {
  Q1: key2,
  Q2: [key3[0], key3[1], { account: 'เจ้าหนี้', category: 'หนี้สิน', change: 'ลดลง' }]
});
assert.equal(exam.accountPercent, 100);
assert.equal(exam.categoryPercent, 100);
assert.ok(exam.changePercent < 100);
assert.ok(exam.percent > 80 && exam.percent < 100);

const html = context.page_('student');
assert.match(html, /รหัสประจำตัวนักเรียน/);
assert.match(html, /google\.script\.run/);
assert.doesNotMatch(html, /createTemplateFromFile\('Index'\)/);

const client = html.match(/<script>([\s\S]*?)<\/script>/);
assert.ok(client, 'client script not found');
new vm.Script(client[1]);

console.log('single Code.gs tests passed');
