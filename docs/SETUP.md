# Setup & Deployment — Single Code.gs

## 1. Google Sheet

ระบบใช้ Google Sheet เดิมที่มีชีต:

`Accounts`, `Questions`, `Attempts`, `Responses`, `Settings`, `Students`, `Dashboard`

Spreadsheet ID ปัจจุบัน:

```text
1fZ3Q88T_5ggfXyXWCRCu8epeSn0qyf2LzvVlcJlW6rI
```

## 2. Google Apps Script ใช้ไฟล์เดียว

1. เปิด Google Sheet
2. เลือก **Extensions → Apps Script**
3. ใช้ไฟล์ `Code.gs` เพียงไฟล์เดียว
4. ลบโค้ดเดิมใน `Code.gs`
5. คัดลอกเนื้อหาจาก `apps-script/Code.gs` ใน GitHub มาวางทั้งหมด
6. กด Save

ไม่ต้องสร้างไฟล์เหล่านี้อีก:

- `Index.html`
- `Styles.html`
- `JavaScript.html`
- `Config.gs`
- `SheetService.gs`
- `ExamService.gs`
- `GradingService.gs`
- `SecurityService.gs`
- `AdminService.gs`

หน้า HTML, CSS, JavaScript และ Backend ถูกรวมอยู่ใน `Code.gs` แล้ว

## 3. Script Properties

สำหรับ Dashboard ครู ให้ไปที่ **Project Settings → Script Properties** แล้วเพิ่ม:

```text
ADMIN_KEY = รหัสที่ครูต้องการ
```

`SPREADSHEET_ID` ไม่จำเป็นต้องตั้ง เพราะระบบมี ID ของ Google Sheet นี้อยู่ใน `Code.gs` แล้ว แต่สามารถตั้ง `SPREADSHEET_ID` เพื่อเปลี่ยนฐานข้อมูลในอนาคตได้

## 4. Deploy โดยใช้ URL เดิม

ถ้ามี Deployment อยู่แล้ว ไม่ต้องสร้างใหม่:

1. **Deploy → Manage deployments**
2. กด Edit ที่ Web App เดิม
3. Version เลือก **New version**
4. Execute as: **Me**
5. Who has access: **Anyone** ตามนโยบายบัญชี Google Workspace
6. กด Deploy

URL นักเรียน:

```text
https://script.google.com/macros/s/AKfycbwGK6Y9o1sanqMWWHTs1tRDkMp9g4a30M1FjgO95HzwgCf9OSqI8AXGr8gi-_lT3ARe/exec
```

URL Dashboard ครู:

```text
https://script.google.com/macros/s/AKfycbwGK6Y9o1sanqMWWHTs1tRDkMp9g4a30M1FjgO95HzwgCf9OSqI8AXGr8gi-_lT3ARe/exec?view=teacher
```

## 5. วิธีใช้งานนักเรียน

หน้าแรกให้นักเรียนกรอก **รหัสประจำตัวนักเรียนเพียงอย่างเดียว** ระบบจะตรวจในชีต `Students` และดึงข้อมูลต่อไปนี้อัตโนมัติ:

- ชื่อ
- นามสกุล
- ชั้น
- ห้อง
- เลขที่

ถ้ารหัสไม่อยู่ในชีต Students หรือ `Active = FALSE` จะไม่สามารถเริ่มสอบได้

## 6. ตรวจหลัง Deploy

ทดสอบตามลำดับ:

1. เปิด URL นักเรียนแล้วต้องไม่ขึ้นข้อความ `ไม่พบไฟล์ HTML ชื่อ Index`
2. กรอกรหัสนักเรียนที่มีอยู่จริงใน `Students`
3. ระบบแสดงชื่อและเริ่มข้อสอบ 20 ข้อ
4. เปลี่ยนข้อแล้วคำตอบไม่หาย
5. Refresh แล้วระบบกู้สถานะจาก localStorage
6. ส่งข้อสอบแล้วแสดงคะแนนรวมและคะแนน 3 ด้าน
7. ตรวจ Google Sheet ว่ามีข้อมูลใหม่ใน `Attempts` และ `Responses`
8. เปิด URL `?view=teacher` และทดสอบ `ADMIN_KEY`

## 7. การตั้งค่าข้อสอบ

แก้ค่าในชีต `Settings` ได้โดยไม่ต้องแก้ Code.gs:

- `exam_title`
- `question_count`
- `exam_time`
- `pass_percent`

## 8. ความปลอดภัย

- อย่าใส่ `ADMIN_KEY` ใน Source Code หรือ GitHub
- Answer Key อยู่ใน Google Sheet / Backend เท่านั้น
- Frontend ได้รับเฉพาะข้อความโจทย์ จำนวนแถวคำตอบ และข้อมูลที่จำเป็นต่อการสอบ
- จำกัดสิทธิ์แก้ไข Google Sheet เฉพาะครูหรือผู้ดูแล
