// 1. ลงทะเบียน SplitText Plugin กับ GSAP (สำคัญมาก!)
gsap.registerPlugin(SplitText);

const animatedSpan = document.getElementById('animated-text');
const animatedWrapper = document.querySelector('.animated-text-wrapper');

// 2. สร้าง Array ของข้อความที่ต้องการสลับ
const phrases = [
    "ค้นหาอาชีพที่ใช่",
    "วางแผนเส้นทางอาชีพ",
    "สร้างแผนพัฒนาสกิล"
];

let currentIndex = 0;

// 3. สร้างฟังก์ชันสำหรับ Animate ข้อความ
function animateText(text) {
    const oldWidth = animatedWrapper.offsetWidth;
    animatedSpan.textContent = text;
    
    // 💡 บรรทัดนี้สำคัญ: บังคับให้เบราว์เซอร์คำนวณ layout ใหม่ทันที
    // เพื่อให้ได้ความกว้างที่ถูกต้องของข้อความใหม่
    gsap.set(animatedWrapper, { width: 'auto' }); 
    const newWidth = animatedWrapper.offsetWidth;

    let mySplitText = new SplitText(animatedSpan, { type: "chars" });
    let chars = mySplitText.chars;

    gsap.from(chars, {
        duration: 0.8,
        y: 100,
        opacity: 0,
        ease: "power3.out",
        stagger: 0.05
    });

    gsap.fromTo(animatedWrapper, 
        { width: oldWidth },
        { 
            width: newWidth,
            duration: 0.8,
            ease: "power3.out",
            // 💡 เพิ่มบรรทัดนี้: เมื่อจบ animation ให้ล้างค่า width ที่กำหนดไว้
            // ทำให้ wrapper กลับไปมีขนาดพอดีกับ content อัตโนมัติ
            clearProps: "width" 
        }
    );
}

// 4. เริ่มต้น Animate ข้อความแรก
animateText(phrases[currentIndex]);

// 5. ตั้งค่าให้สลับข้อความ
setInterval(() => {
    currentIndex = (currentIndex + 1) % phrases.length;
    animateText(phrases[currentIndex]);
}, 3000);

// 5. ตั้งค่าให้สลับข้อความ
setInterval(() => {
    currentIndex = (currentIndex + 1) % phrases.length;
    animateText(phrases[currentIndex]);
}, 3000);

document.addEventListener("DOMContentLoaded", () => {
    const heroDesc = document.querySelector('.hero-desc');
    
    if (heroDesc) {
        // 💡 เพิ่มบรรทัดนี้: ทำให้ Description กลับมามองเห็นได้ก่อนเริ่ม Animate
        gsap.set(".hero-desc-wrapper", {visibility: 'visible'});

        let descSplit = new SplitText(heroDesc, { type: "chars, words" });

        gsap.from(descSplit.chars, {
            delay: .5,
            duration: 0.8,
            yPercent: 100,
            opacity: 0,
            ease: "power3.out",
            stagger: 0.015
        });
    }
});

gsap.to(".cta-button", {
    delay: 1.5,           // 💡 ดีเลย์ 3 วินาที
    duration: 1,        // ความเร็วของ animation
    autoAlpha: 1,       // ค่อยๆ ทำให้มองเห็น (GSAP จะจัดการ visibility และ opacity ให้เอง)
    y: -20,             // ค่อยๆ เลื่อนขึ้นเล็กน้อย
    ease: "power3.out"  // รูปแบบการเคลื่อนที่
});