// result.js - สำหรับหน้า result.html

document.addEventListener('DOMContentLoaded', () => {
    const summaryContainer = document.getElementById('summary-container');

    // 1. ดึงข้อมูลจาก localStorage
    const jsonData = localStorage.getItem('onboardingData');

    if (jsonData) {
        try {
            // 2. แปลง String กลับเป็น Object
            const data = JSON.parse(jsonData);
            console.log("Data loaded from localStorage:", data);

            // 3. สร้าง HTML เพื่อแสดงผล
            let htmlContent = '';
            for (const key in data) {
                if (data.hasOwnProperty(key)) {
                    // สร้างชื่อ Label ให้อ่านง่ายขึ้น
                    const label = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
                    const value = data[key] || '<i>ไม่ได้กรอก</i>';
                    
                    htmlContent += `
                        <div class="summary-item">
                            <strong>${label}:</strong>
                            <span>${value}</span>
                        </div>
                    `;
                }
            }
            summaryContainer.innerHTML = htmlContent;

        } catch (error) {
            console.error("Could not parse data from localStorage:", error);
            summaryContainer.innerHTML = '<p class="error-text">ข้อมูลที่บันทึกไว้ไม่ถูกต้อง</p>';
        }
    } else {
        summaryContainer.innerHTML = '<p class="error-text">ไม่พบข้อมูลที่บันทึกไว้ กรุณากลับไปกรอกข้อมูลใหม่อีกครั้ง</p>';
    }

    // (ในอนาคต) เพิ่ม Event Listeners ให้กับปุ่ม AI
    document.getElementById('analyze-career-btn').addEventListener('click', () => {
        alert('ฟังก์ชันวิเคราะห์เส้นทางอาชีพด้วย AI (ยังไม่เปิดใช้งาน)');
    });
    document.getElementById('analyze-skills-btn').addEventListener('click', () => {
        alert('ฟังก์ชันวิเคราะห์ทักษะด้วย AI (ยังไม่เปิดใช้งาน)');
    });
    document.getElementById('generate-plan-btn').addEventListener('click', () => {
        alert('ฟังก์ชันสร้างแผนพัฒนาตัวเองด้วย AI (ยังไม่เปิดใช้งาน)');
    });
});
