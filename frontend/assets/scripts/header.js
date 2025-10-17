// รอให้หน้าเว็บโหลดเสร็จก่อนเริ่มทำงาน
document.addEventListener('DOMContentLoaded', function() {

  // เลือกองค์ประกอบ header
  const header = document.querySelector('.gradient-header');

  // สร้างฟังก์ชันเพื่อจัดการการเปลี่ยนสไตล์
  function handleScroll() {
    // ตรวจสอบว่าตำแหน่ง scroll ในแนวตั้งมากกว่า 100px หรือไม่
    if (window.scrollY > 50) {
      // ถ้าใช่, ให้ header เลื่อนเข้ามาในจอและมองเห็นชัดเจน
      header.style.top = '0px';
      header.style.opacity = '1';
    } else {
      // ถ้าไม่ใช่, ให้ header เลื่อนกลับออกไปนอกจอและจางหายไป
      header.style.top = '-100px'; // ค่านี้ควรเท่ากับหรือมากกว่าความสูงของ header
      header.style.opacity = '0';
    }
  }

  // เพิ่ม Event Listener เพื่อเรียกใช้ฟังก์ชัน handleScroll ทุกครั้งที่มีการ scroll
  window.addEventListener('scroll', handleScroll);

});