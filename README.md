# [cite_start]SkillDe* - AI Career Coach [cite: 1, 6]

[cite_start]SkillDe* คือ AI Career Coach ที่ถูกสร้างขึ้นเพื่อช่วยเหลือนักศึกษาในการค้นหาเส้นทางอาชีพที่เหมาะสมกับตัวเอง [cite: 6, 10, 11] โดยใช้ AI ช่วยจับคู่ทักษะและความสนใจเข้ากับตำแหน่งงาน พร้อมทั้งสร้างแผนที่เส้นทางอาชีพ (Roadmap) ส่วนบุคคลเพื่อการเติบโตอย่างมีทิศทาง [cite: 7]

![image](URL_ของภาพหน้าจอโปรเจกต์_หรือ_GIF_การใช้งาน)
*(แนะนำ: หลังจากทำโปรเจกต์เสร็จแล้ว ให้อัดวิดีโอสั้นๆ แปลงเป็น GIF แล้วนำมาใส่ตรงนี้)*

---

## ✨ คุณสมบัติหลัก (Key Features)

โปรเจกต์นี้มีฟังก์ชันการทำงานหลักๆ ดังนี้:

* [cite_start]**ค้นหาอาชีพที่ใช่ (Find Career):** วิเคราะห์ข้อมูลผู้ใช้ เช่น ทักษะ, ความสนใจ, และค่านิยมในการทำงาน เพื่อแนะนำอาชีพที่เหมาะสมที่สุด [cite: 32, 34, 35, 36]
* [cite_start]**วางแผนเส้นทางอาชีพ (Career Path):** สร้างแผนที่เส้นทางอาชีพส่วนบุคคล ผู้ใช้สามารถปรับแต่งเส้นทางและดูทักษะที่ต้องพัฒนาเพิ่มเติมได้ [cite: 38, 41]
* [cite_start]**แนะนำการพัฒนาตนเอง (Upskilling):** AI จะวิเคราะห์ทักษะที่ยังขาดหายไป และแนะนำคอร์สเรียน, โปรเจกต์ที่น่าทำ, หรือบทความที่ควรอ่านเพื่อการพัฒนาตัวเอง [cite: 42]

---

## 🛠️ เทคโนโลยีที่ใช้ (Tech Stack)

* [cite_start]**Frontend:** HTML, CSS, JavaScript [cite: 59]
* **Backend:** Node.js, Express.js
* [cite_start]**AI:** Google Gemini 2.5 API [cite: 53]

---

## 🚀 วิธีการติดตั้งและรันโปรเจกต์ (How to Run Locally)

ทำตามขั้นตอนต่อไปนี้เพื่อรันโปรเจกต์บนเครื่องของคุณ:

1.  **Clone the repository:**
    ```bash
    git clone [https://github.com/YourUsername/skilldex-project.git](https://github.com/YourUsername/skilldex-project.git)
    cd skilldex-project
    ```

2.  **ตั้งค่าฝั่ง Backend:**
    ```bash
    cd backend
    npm install
    ```

3.  **ตั้งค่า Environment Variable:**
    * สร้างไฟล์ `.env` ภายในโฟลเดอร์ `backend`
    * เพิ่ม API Key ของคุณลงในไฟล์:
        ```env
        GEMINI_API_KEY="YOUR_GEMINI_API_KEY_HERE"
        ```

4.  **รัน Backend Server:**
    ```bash
    node server.js
    ```
    เซิร์ฟเวอร์จะทำงานที่ `http://localhost:3000` (หรือ Port ที่คุณตั้งไว้)

5.  **เปิด Frontend:**
    * เปิดไฟล์ `frontend/index.html` ด้วย Live Server Extension บน VS Code

---