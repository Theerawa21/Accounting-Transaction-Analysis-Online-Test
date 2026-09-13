# Accounting Transaction Analysis Online Test

ระบบทดสอบออนไลน์เรื่อง **การวิเคราะห์รายการค้า** สำหรับนักเรียนชั้นมัธยมศึกษาปีที่ 4 โดยใช้เพียง 3 หมวดบัญชี:

- สินทรัพย์
- หนี้สิน
- ส่วนของเจ้าของ

ระบบใช้ Google Sheets เป็นฐานข้อมูล, Google Apps Script เป็น Backend/ระบบตรวจคำตอบ และใช้ GitHub Pages เป็นหน้าทางเข้าระบบ

## Features

- แบบทดสอบคู่ขนาน 5 ชุด A-E ชุดละ 20 ข้อ
- สุ่มชุดและสุ่มลำดับคำถาม
- รองรับโจทย์ 2 และ 3 บัญชี
- ตรวจคำตอบแบบไม่ยึดลำดับแถว
- ให้คะแนนแยก 3 ด้าน: ระบุบัญชี / หมวดบัญชี / เพิ่ม-ลด
- Timer และ localStorage autosave
- เก็บ Attempts และ Responses ลง Google Sheets
- Dashboard ครูพร้อมค้นหาและ Export CSV
- เฉลยอยู่ฝั่ง Server เท่านั้น
- Responsive และใช้ฟอนต์ Sarabun
- มีหน้า GitHub Pages สำหรับนักเรียน (`index.html`) และครู (`teacher.html`)

## Repository

```text
index.html
teacher.html
apps-script/
  Code.gs
  Config.gs
  SheetService.gs
  ExamService.gs
  GradingService.gs
  SecurityService.gs
  AdminService.gs
  Index.html
  Styles.html
  JavaScript.html
  appsscript.json
data/
  sample-accounts.csv
  sample-questions.csv
docs/
  SETUP.md
  GOOGLE-SHEET-STRUCTURE.md
tests/
  grading.test.js
```

## Google Apps Script Web App

Backend ที่ Deploy แล้ว:

```text
https://script.google.com/macros/s/AKfycbwGK6Y9o1sanqMWWHTs1tRDkMp9g4a30M1FjgO95HzwgCf9OSqI8AXGr8gi-_lT3ARe/exec
```

Dashboard ครู:

```text
https://script.google.com/macros/s/AKfycbwGK6Y9o1sanqMWWHTs1tRDkMp9g4a30M1FjgO95HzwgCf9OSqI8AXGr8gi-_lT3ARe/exec?view=teacher
```

## เปิด GitHub Pages

หลัง Merge branch นี้เข้า `main`:

1. เปิด repository บน GitHub
2. ไปที่ **Settings → Pages**
3. ใน **Build and deployment** เลือก **Deploy from a branch**
4. เลือก Branch = `main`
5. Folder = `/ (root)`
6. กด **Save**

เมื่อ GitHub Pages สร้างเว็บไซต์แล้ว URL หลักจะมีรูปแบบ:

```text
https://theerawa21.github.io/Accounting-Transaction-Analysis-Online-Test/
```

หน้าครู:

```text
https://theerawa21.github.io/Accounting-Transaction-Analysis-Online-Test/teacher.html
```

> GitHub Pages ทำหน้าที่เป็นหน้าเว็บทางเข้า ส่วนข้อมูลนักเรียน ข้อสอบ เฉลย และคะแนนยังคงอยู่ที่ Google Sheets / Google Apps Script

## Test

ต้องมี Node.js 18+ แล้วรัน:

```bash
node tests/grading.test.js
```

ชุดทดสอบครอบคลุมการสลับลำดับแถว, คะแนนบางส่วน, โจทย์ 3 บัญชี, แถวซ้ำ และการเลือกเฉพาะ QuestionID ที่ถูกมอบหมาย

## Deploy Apps Script

ดูขั้นตอนละเอียดที่ `docs/SETUP.md`

ค่าที่ต้องตั้งใน Apps Script > Project Settings > Script Properties:

- `SPREADSHEET_ID` = ID ของ Google Sheet ที่ใช้เป็นฐานข้อมูล
- `ADMIN_KEY` = รหัสลับสำหรับเข้า Dashboard ครู

ห้าม commit ค่า `ADMIN_KEY` ลง repository
