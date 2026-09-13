# Accounting Transaction Analysis Online Test — Design Specification

Date: 2026-09-13

## 1. Goal

Build an online assessment system for Grade 10 (Mathayom 4) introductory accounting focused on transaction analysis using only three account categories:

- สินทรัพย์ (Assets)
- หนี้สิน (Liabilities)
- ส่วนของเจ้าของ (Owner's Equity)

Students analyze each transaction by identifying the affected accounts, each account's category, and whether it increases or decreases.

The system uses Google Sheets as the data store, Google Apps Script as the backend and grading engine, and GitHub as the source-code repository. The UI must work well on phones, tablets, and desktop devices and use Thai language with the Sarabun font.

## 2. Scope

### In scope

- Student information form
- Five parallel test forms
- 20 questions per form
- Transaction analysis using Assets, Liabilities, and Owner's Equity only
- Two-account and three-account transactions
- Randomized test form assignment and question order
- Timer
- Autosave in browser storage
- Server-side grading
- Order-independent answer matching
- Scores for account identification, category classification, and increase/decrease analysis
- Google Sheets persistence
- Student results page
- Teacher dashboard data endpoint
- CSV export support for results
- Deployment and setup documentation

### Out of scope for this version

- Revenue accounts
- Expense accounts
- Debit/credit recording
- General journal entry exercises
- General ledger and trial balance
- Student Google authentication

## 3. Accounting Model

The assessment is based on:

สินทรัพย์ = หนี้สิน + ส่วนของเจ้าของ

Only these three categories are selectable in the test.

Examples of accounts:

### Assets

- เงินสด
- เงินฝากธนาคาร
- ลูกหนี้
- วัสดุสำนักงาน
- อุปกรณ์สำนักงาน
- เครื่องคอมพิวเตอร์
- เครื่องพิมพ์
- เครื่องถ่ายเอกสาร
- รถจักรยานยนต์
- รถยนต์
- ที่ดิน
- อาคาร

### Liabilities

- เจ้าหนี้
- เงินกู้
- เจ้าหนี้อื่น

### Owner's Equity

- ทุน
- ถอนใช้ส่วนตัว

For the assessment interface, withdrawal transactions are represented as a decrease in owner's equity.

## 4. Parallel Test Design

There are five parallel forms: A, B, C, D, and E.

Each form contains 20 questions with the same content blueprint, same cognitive demand, and comparable difficulty. The scenarios, asset names, and amounts vary between forms.

Question blueprint:

1–2: owner investment — asset increase / owner's equity increase
3–6: exchange of assets — one asset increases / another decreases
7–8: conversion within assets — one asset increases / another decreases
9–11: purchase of asset on credit — asset increase / liability increase
12: borrowing — asset increase / liability increase
13–16: debt repayment — asset decrease / liability decrease
17–18: owner withdrawal — asset decrease / owner's equity decrease
19: three-account transaction — asset increase / asset decrease / liability increase
20: three-account investment with assumed debt — asset increase / liability increase / owner's equity increase

The five forms use the previously agreed 20-question parallel-form sets.

## 5. Student Flow

1. Open exam page.
2. Enter:
   - Student ID
   - First name
   - Last name
   - Class
   - Room
   - Number
3. Press “เริ่มทำแบบทดสอบ”.
4. Backend creates a unique AttemptID and assigns one of five parallel forms.
5. Questions are returned without answer keys.
6. Student answers one question at a time.
7. Browser stores answers locally so navigation or accidental refresh does not erase progress.
8. Timer counts down.
9. Before submission, show answered and unanswered counts.
10. Student confirms submission.
11. Backend validates and grades the submission.
12. Backend stores attempt and response records.
13. Student receives result summary.

## 6. Question UI

Each question displays:

- Question number and total
- Transaction statement
- Two or three answer rows depending on the expected number of affected accounts
- Account dropdown
- Category dropdown
- Change dropdown
- Previous button
- Next button
- Question navigator
- Progress bar
- Countdown timer

Category dropdown contains only:

- สินทรัพย์
- หนี้สิน
- ส่วนของเจ้าของ

Change dropdown contains:

- เพิ่มขึ้น
- ลดลง

## 7. Grading Logic

Answer keys stay on the server side.

A student's answer is normalized into account-category-change triples.

Example key:

- เงินสด | สินทรัพย์ | เพิ่มขึ้น
- ทุน | ส่วนของเจ้าของ | เพิ่มขึ้น

Student row order does not matter.

The grading engine compares normalized sets rather than fixed row positions.

Each question produces three skill dimensions:

- Account identification score
- Category score
- Increase/decrease score

Question scores are normalized so two-row and three-row questions have comparable total weight.

Overall outputs:

- Total percentage
- Account identification percentage
- Category percentage
- Change percentage
- Pass / review status

Default pass threshold: 60%.

## 8. Google Sheets Schema

### Accounts

Columns:

- AccountID
- AccountName
- Category
- Active

### Questions

Columns:

- QuestionID
- FormID
- Sequence
- QuestionText
- Difficulty
- Active
- AnswerCount
- Account1
- Category1
- Change1
- Amount1
- Account2
- Category2
- Change2
- Amount2
- Account3
- Category3
- Change3
- Amount3
- Explanation

### Attempts

Columns:

- AttemptID
- StudentID
- FirstName
- LastName
- Class
- Room
- Number
- FormID
- StartTime
- SubmitTime
- DurationSeconds
- RawScore
- Percent
- AccountScore
- CategoryScore
- ChangeScore
- Status

### Responses

Columns:

- AttemptID
- QuestionID
- StudentAnswerJSON
- Score
- AccountScore
- CategoryScore
- ChangeScore

### Settings

Columns:

- Setting
- Value

Default settings:

- exam_title = แบบทดสอบการวิเคราะห์รายการค้า
- question_count = 20
- exam_time = 30
- pass_percent = 60
- show_answer = FALSE

### Students

Columns:

- StudentID
- FirstName
- LastName
- Class
- Room
- Number
- Active

### Dashboard

The sheet may contain summary formulas or be populated from the Attempts data, but the web dashboard should rely on backend aggregation rather than hard-coded cell positions.

## 9. Backend Architecture

Google Apps Script modules:

- Code.gs — entry point and routing
- Config.gs — constants and configuration helpers
- SheetService.gs — sheet reads/writes
- ExamService.gs — start exam and question delivery
- GradingService.gs — normalization and grading
- AdminService.gs — dashboard and export data
- SecurityService.gs — validation, duplicate protection, token/attempt checks

Primary functions:

- doGet()
- getExamConfig()
- getAccounts()
- startExam(student)
- getQuestions(attemptId)
- submitExam(payload)
- gradeExam(questions, responses)
- saveAttempt()
- saveResponses()
- getStudentResult()
- getDashboardData()
- generateAttemptId()
- normalizeAnswer()
- validateSubmission()

Concurrent sheet writes use LockService where appropriate.

## 10. Frontend Architecture

HTMLService serves the application.

Files:

- Index.html
- Styles.html
- JavaScript.html

The frontend contains screens for:

- Start / student information
- Exam
- Submit confirmation
- Result
- Teacher dashboard

UI principles:

- Mobile first
- Responsive
- Sarabun font
- Dark blue, light blue, and white as main colors
- Green for pass status
- Restrained red for review status
- Large touch-friendly buttons
- Minimal animation
- Clear cards and spacing

## 11. Data Security and Integrity

- No answer key in client-side JavaScript.
- Questions returned to the client exclude answer columns.
- Every attempt has a unique AttemptID.
- Server validates AttemptID before grading.
- Duplicate submissions are rejected or treated idempotently.
- Inputs are validated and sanitized before persistence.
- LockService protects concurrent writes.
- Sensitive IDs and deployment settings are stored in Script Properties where appropriate.

## 12. Repository Layout

```text
Accounting-Transaction-Analysis-Online-Test/
├── README.md
├── apps-script/
│   ├── Code.gs
│   ├── Config.gs
│   ├── ExamService.gs
│   ├── GradingService.gs
│   ├── SheetService.gs
│   ├── AdminService.gs
│   ├── SecurityService.gs
│   ├── Index.html
│   ├── Styles.html
│   ├── JavaScript.html
│   └── appsscript.json
├── data/
│   ├── sample-accounts.csv
│   └── sample-questions.csv
├── docs/
│   ├── SETUP.md
│   └── GOOGLE-SHEET-STRUCTURE.md
└── docs/superpowers/specs/
    └── 2026-09-13-accounting-transaction-analysis-online-test-design.md
```

## 13. Testing Requirements

Before declaring completion:

- App opens successfully.
- Student form validates required fields.
- Attempt creation works.
- Parallel form is assigned.
- 20 questions load.
- Only three account categories appear.
- Timer works.
- Navigation preserves answers.
- Reload recovery works when possible.
- Submission confirmation reports unanswered questions.
- Two-account questions grade correctly.
- Three-account questions grade correctly.
- Row order does not affect grading.
- Account/category/change subscores are correct.
- Attempts persist.
- Responses persist.
- Duplicate submission handling works.
- No answer keys are exposed to the client.
- Layout works on mobile width.
- JavaScript has no blocking runtime errors.
- README and setup documentation are complete.

## 14. Deployment

Deployment target is a Google Apps Script Web App.

Teacher steps that cannot be automated from this repository workflow:

1. Open the Google Sheet.
2. Open Extensions → Apps Script.
3. Copy/import the project files.
4. Configure Spreadsheet ID or bind the script to the target sheet.
5. Deploy → New deployment → Web app.
6. Execute as the owner.
7. Choose the required access policy.
8. Deploy and copy the Web App URL.

The setup guide must document these steps exactly.

## 15. Future Extension

The model should remain extensible for later modules:

transaction analysis → increase/decrease → debit/credit → general journal → ledger → trial balance.

The current data model must not prevent adding new account categories and assessment types later, even though the current UI exposes only the three approved categories.
