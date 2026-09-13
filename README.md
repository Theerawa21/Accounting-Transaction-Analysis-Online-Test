# Accounting Transaction Analysis Online Test

ระบบทดสอบออนไลน์เรื่อง **การวิเคราะห์รายการค้า** สำหรับนักเรียนชั้นมัธยมศึกษาปีที่ 4 โดยใช้เพียง 3 หมวดบัญชี:

- สินทรัพย์
- หนี้สิน
- ส่วนของเจ้าของ

ระบบใช้ Google Sheets เป็นฐานข้อมูล, Google Apps Script เป็น Backend/เว็บแอป และเก็บ Source Code ใน GitHub

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

## Repository

```text
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

## Test

ต้องมี Node.js 18+ แล้วรัน:

```bash
node tests/grading.test.js
```

ชุดทดสอบครอบคลุมการสลับลำดับแถว, คะแนนบางส่วน, โจทย์ 3 บัญชี, แถวซ้ำ และการเลือกเฉพาะ QuestionID ที่ถูกมอบหมาย

## Deploy

ดูขั้นตอนละเอียดที่ `docs/SETUP.md`

ค่าที่ต้องตั้งใน Apps Script > Project Settings > Script Properties:

- `SPREADSHEET_ID` = ID ของ Google Sheet ที่ใช้เป็นฐานข้อมูล
- `ADMIN_KEY` = รหัสลับสำหรับเข้า Dashboard ครู

ห้าม commit ค่า `ADMIN_KEY` ลง repository
