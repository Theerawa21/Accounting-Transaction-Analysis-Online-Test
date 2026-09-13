# Google Sheet Structure

ระบบใช้ 7 ชีตและอ่านข้อมูลตามชื่อหัวคอลัมน์ จึงไม่ควรเปลี่ยนชื่อคอลัมน์โดยไม่แก้โค้ด Backend ให้สอดคล้องกัน

## Accounts

`AccountID, AccountName, Category, Active`

Category ในเวอร์ชันนี้มีเพียง `สินทรัพย์`, `หนี้สิน`, `ส่วนของเจ้าของ`

## Questions

`QuestionID, FormID, Sequence, QuestionText, Difficulty, Active, AnswerCount, Account1, Category1, Change1, Amount1, Account2, Category2, Change2, Amount2, Account3, Category3, Change3, Amount3, Explanation`

- FormID: A-E
- AnswerCount: 2 หรือ 3
- Difficulty: Easy / Medium / Hard
- คอลัมน์ Account/Category/Change คือ Answer Key และไม่ถูกส่งไป Frontend

## Attempts

`AttemptID, StudentID, FirstName, LastName, Class, Room, Number, FormID, StartTime, SubmitTime, DurationSeconds, RawScore, Percent, AccountScore, CategoryScore, ChangeScore, Status, QuestionIDs`

`QuestionIDs` เก็บ JSON array ของข้อที่มอบหมายจริง เพื่อให้เปลี่ยนจำนวนข้อใน Settings ได้โดยไม่ทำให้การตรวจคะแนนคลาดเคลื่อน

## Responses

`AttemptID, QuestionID, StudentAnswerJSON, Score, AccountScore, CategoryScore, ChangeScore`

คะแนนรายข้อเก็บเป็นเปอร์เซ็นต์ 0-100

## Settings

| Setting | ค่าเริ่มต้น |
|---|---|
| exam_title | แบบทดสอบการวิเคราะห์รายการค้า |
| question_count | 20 |
| exam_time | 30 |
| pass_percent | 60 |
| show_answer | FALSE |

## Students

`StudentID, FirstName, LastName, Class, Room, Number, Active`

เวอร์ชันแรกยังไม่บังคับตรวจรายชื่อก่อนสอบ ชีตนี้สำรองไว้สำหรับเพิ่มการอนุญาตผู้เข้าสอบภายหลัง

## Dashboard

สำรองไว้สำหรับสูตรหรือสรุปข้อมูลใน Sheet ส่วน Dashboard บนเว็บดึงข้อมูลจาก `Attempts` โดยตรง
