# Setup & Deployment

## 1. เตรียม Google Sheet

Google Sheet ต้องมีชีตต่อไปนี้:

`Accounts`, `Questions`, `Attempts`, `Responses`, `Settings`, `Students`, `Dashboard`

โครงสร้างคอลัมน์ดูที่ `GOOGLE-SHEET-STRUCTURE.md` และข้อมูลตัวอย่างอยู่ใน `data/`

## 2. เปิด Apps Script

1. เปิด Google Sheet
2. เลือก **Extensions > Apps Script**
3. สร้างไฟล์ให้ตรงกับโฟลเดอร์ `apps-script/`
4. คัดลอกเนื้อหาของไฟล์ `.gs` และ `.html` เข้า Project
5. เปิด Project Settings และเปิดการแสดงไฟล์ manifest หากต้องการแก้ `appsscript.json`

## 3. ตั้ง Script Properties

ที่ **Project Settings > Script Properties** เพิ่ม:

- `SPREADSHEET_ID` = ID ของ Google Sheet
- `ADMIN_KEY` = รหัสที่ครูตั้งเองสำหรับเปิด Dashboard

ตัวอย่าง Spreadsheet ID คือข้อความที่อยู่ระหว่าง `/d/` และ `/edit` ใน URL ของ Google Sheet

## 4. ทดสอบก่อน Deploy

ใน Apps Script Editor สามารถรัน `getExamConfig` เพื่อยืนยันว่า Backend อ่านชีต `Settings` ได้ หากมีหน้าต่างขอสิทธิ์ ให้เข้าสู่ระบบและอนุญาตเฉพาะ Project นี้

## 5. Deploy Web App

1. กด **Deploy > New deployment**
2. เลือก **Web app**
3. Execute as: **Me**
4. Who has access: **Anyone** (ถ้านโยบาย Workspace อนุญาต)
5. กด **Deploy**
6. คัดลอก Web App URL

หน้าเข้าสอบใช้ URL ปกติ

หน้า Dashboard ครูใช้ URL เดิมต่อท้าย:

```text
?view=teacher
```

ตัวอย่างรูปแบบ:

```text
https://script.google.com/macros/s/DEPLOYMENT_ID/exec?view=teacher
```

## 6. ตรวจการทำงาน

ทดสอบอย่างน้อย:

1. กรอกข้อมูลนักเรียนและเริ่มสอบ
2. ระบบแสดง 20 ข้อและชุด A-E
3. ตอบโจทย์และเปลี่ยนข้อแล้วคำตอบไม่หาย
4. Refresh แล้ว localStorage กู้สถานะได้
5. ส่งคำตอบและเห็นคะแนนรวม/คะแนนรายด้าน
6. ตรวจว่ามีแถวใหม่ใน Attempts และ Responses
7. สลับลำดับคำตอบในโจทย์เดียวกันแล้วผลตรวจยังถูก
8. เปิด `?view=teacher` และใช้ `ADMIN_KEY`

## 7. การเปลี่ยนเวลา/เกณฑ์ผ่าน

แก้เฉพาะค่าในชีต `Settings`:

- `question_count`
- `exam_time`
- `pass_percent`

ไม่ต้องแก้ Source Code

## 8. ความปลอดภัย

- อย่าใส่ `ADMIN_KEY` ลง GitHub
- Answer Key อยู่ใน Questions และ Backend เท่านั้น
- Frontend ได้รับเพียง QuestionID, โจทย์, ระดับ และจำนวนแถวคำตอบ
- ถ้าแชร์ Google Sheet ให้ผู้อื่น ควรจำกัดสิทธิ์เฉพาะครู/ผู้ดูแลที่จำเป็น
