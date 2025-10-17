gsap.registerPlugin(ScrollTrigger);

document.addEventListener('DOMContentLoaded', () => {
    gsap.from(".analysis-card", {
        scrollTrigger: {
            trigger: ".analysis-grid",
            start: "top 85%", // เริ่มเมื่อเห็น Section ที่ 85% ของจอ
            once: true        // (แนะนำ) ให้ทำงานแค่ครั้งเดียว
        },
        opacity: 0,
        y: 30,
        duration: 0.7,
        ease: "power2.out",
        stagger: 0.1,
        delay: .25
    });

    gsap.from(".market-data-item", {
        scrollTrigger: {
            trigger: ".market-data-grid",
            start: "top 85%", // เริ่มเมื่อเห็น Section ที่ 85% ของจอ
            once: true        // (แนะนำ) ให้ทำงานแค่ครั้งเดียว
        },
        opacity: 0,
        y: 30,
        duration: 0.7,
        ease: "power2.out",
        stagger: 0.1,
        delay: .25
    });

    gsap.from(".milestone-card", {
        scrollTrigger: {
            trigger: ".milestone-list",
            start: "top 85%", // เริ่มเมื่อเห็น Section ที่ 85% ของจอ
            once: true        // (แนะนำ) ให้ทำงานแค่ครั้งเดียว
        },
        opacity: 0,
        y: 30,
        duration: 0.7,
        ease: "power2.out",
        stagger: 0.1,
        delay: .25
    });
});



