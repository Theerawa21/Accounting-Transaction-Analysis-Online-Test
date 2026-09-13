# Accounting Transaction Analysis Online Test

ระบบทดสอบออนไลน์เรื่อง **การวิเคราะห์รายการค้า** สำหรับนักเรียนชั้นมัธยมศึกษาปีที่ 4 โดยใช้เพียง 3 หมวดบัญชี:

- สินทรัพย์
- หนี้สิน
- ส่วนของเจ้าของ

ระบบใช้ Google Sheets เป็นฐานข้อมูล, Google Apps Script เป็น Backend/หน้าแบบทดสอบ และ GitHub Pages เป็นหน้าทางเข้าระบบ

## Features

- แบบทดสอบคู่ขนาน 5 ชุด A-E ชุดละ 20 ข้อ
- สุ่มชุดและสุ่มลำดับคำถาม
- รองรับโจทย์ 2 และ 3 บัญชี
- ตรวจคำตอบแบบไม่ยึดลำดับแถว
- ให้คะแนนแยก 3 ด้าน: ระบุบัญชี / หมวดบัญชี / เพิ่ม-ลด
- นักเรียนกรอกเฉพาะรหัสประจำตัว ระบบดึงชื่อ ชั้น ห้อง และเลขที่จากชีต `Students`
- Timer และ localStorage autosave
- เก็บ Attempts และ Responses ลง Google Sheets
- Dashboard ครูพร้อมค้นหาและ Export CSV
- เฉลยอยู่ฝั่ง Server เท่านั้น
- Responsive และใช้ฟอนต์ Sarabun

## Google Apps Script แบบไฟล์เดียว

ใน Apps Script Editor ใช้ **ไฟล์เดียวเท่านั้น**:

```text
apps-script/
  Code.gs
```

ไม่ต้องสร้าง `Index.html`, `Styles.html`, `JavaScript.html`, `Config.gs` หรือไฟล์ `.gs` อื่น ๆ แล้ว เพราะ HTML, CSS, JavaScript, Backend และระบบตรวจคะแนนถูกรวมไว้ใน `Code.gs` ทั้งหมด

Spreadsheet ID ของระบบถูกกำหนดไว้ใน `Code.gs` แล้ว:

```text
1fZ3Q88T_5ggfXyXWCRCu8epeSn0qyf2LzvVlcJlW6rI
```

ถ้าต้องการเปลี่ยนฐานข้อมูลในอนาคต สามารถตั้ง Script Property ชื่อ `SPREADSHEET_ID` เพื่อ override ค่าเดิมได้

## Script Property ที่ต้องตั้ง

สำหรับ Dashboard ครู ให้ตั้ง:

```text
ADMIN_KEY = รหัสที่ครูต้องการ
```

ห้าม commit ค่า `ADMIN_KEY` ลง GitHub

## Deploy Apps Script

1. เปิด Google Sheet → **Extensions → Apps Script**
2. ลบโค้ดเดิมใน `Code.gs`
3. คัดลอก `apps-script/Code.gs` จาก repository ไปวางทั้งหมด
4. กด Save
5. ไปที่ **Deploy → Manage deployments**
6. กด Edit ที่ Web App เดิม
7. เลือก **New version**
8. กด Deploy

Web App เดิม:

```text
https://script.google.com/macros/s/AKfycbwGK6Y9o1sanqMWWHTs1tRDkMp9g4a30M1FjgO95HzwgCf9OSqI8AXGr8gi-_lT3ARe/exec
```

Dashboard ครู:

```text
https://script.google.com/macros/s/AKfycbwGK6Y9o1sanqMWWHTs1tRDkMp9g4a30M1FjgO95HzwgCf9OSqI8AXGr8gi-_lT3ARe/exec?view=teacher
```

## GitHub Pages

หน้าเว็บนักเรียน:

```text
https://theerawa21.github.io/Accounting-Transaction-Analysis-Online-Test/
```

หน้าครู:

```text
https://theerawa21.github.io/Accounting-Transaction-Analysis-Online-Test/teacher.html
```

GitHub Pages ทำหน้าที่เป็นหน้าเปิดระบบ ส่วนข้อมูลนักเรียน ข้อสอบ เฉลย และคะแนนอยู่ใน Google Sheets / Apps Script

## Test

รัน:

```bash
node tests/grading.test.js
```

ชุดทดสอบตรวจการให้คะแนนแบบสลับลำดับแถว, คะแนนบางส่วน, โจทย์ 3 บัญชี และ JavaScript ที่ถูกสร้างจาก `Code.gs`

ดูขั้นตอนละเอียดเพิ่มเติมที่ `docs/SETUP.md`
