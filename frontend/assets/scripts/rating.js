// frontend/scripts/rating.js

document.addEventListener('DOMContentLoaded', () => {
    // รอสักครู่เพื่อให้แน่ใจว่า findcareer.js ได้สร้างปุ่มเสร็จแล้ว
    // setTimeout เป็นวิธีง่ายๆ ในการหน่วงเวลา
    setTimeout(setupRatingWidget, 100); 
});

function setupRatingWidget() {
    const footer = document.querySelector('.result-footer');
    
    // หากไม่เจอ footer ให้หยุดทำงานไปเลย
    if (!footer) {
        console.error('Rating.js: Result footer not found. Cannot inject rating widget.');
        return;
    }

    // --- 1. สร้าง Element ของ Rating Widget แบบไดนามิก ---
    const ratingWidget = document.createElement('div');
    ratingWidget.className = 'rating-widget';
    ratingWidget.id = 'rating-widget';

    const title = document.createElement('h4');
    title.textContent = 'ข้อมูลนี้เป็นประโยชน์กับคุณหรือไม่?';

    const starsContainer = document.createElement('div');
    starsContainer.className = 'rating-stars';
    starsContainer.id = 'rating-stars';
    starsContainer.dataset.rating = "0";

    const thankYouMessage = document.createElement('div');
    thankYouMessage.id = 'rating-thank-you';
    thankYouMessage.className = 'hidden';
    thankYouMessage.innerHTML = '<p>ขอบคุณสำหรับความคิดเห็น! 🙏</p>';
    
    // สร้างดาว 5 ดวงด้วย loop
    for (let i = 1; i <= 5; i++) {
        const starSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        starSvg.setAttribute('class', 'rating-star');
        starSvg.setAttribute('data-value', i);
        starSvg.setAttribute('viewBox', '0 0 24 24');
        starSvg.innerHTML = `<path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/>`;
        starsContainer.appendChild(starSvg);
    }
    
    // --- 2. ประกอบร่าง Widget และนำไปต่อท้าย Footer ---
    ratingWidget.appendChild(title);
    ratingWidget.appendChild(starsContainer);
    ratingWidget.appendChild(thankYouMessage);
    footer.appendChild(ratingWidget);

    // --- 3. เพิ่ม Event Listeners และ Logic การทำงาน (เหมือนเดิม) ---
    const stars = starsContainer.querySelectorAll('.rating-star');
    const RATING_SUBMITTED_KEY = 'skilldexRatingSubmitted';

    function init() {
        if (localStorage.getItem(RATING_SUBMITTED_KEY)) {
            showThankYouState();
            return;
        }
        starsContainer.addEventListener('mouseover', handleMouseOver);
        starsContainer.addEventListener('mouseout', handleMouseOut);
        starsContainer.addEventListener('click', handleClick);
    }

    function handleMouseOver(e) {
        if (e.target.closest('.rating-star')) {
            highlightStars(e.target.closest('.rating-star').dataset.value);
        }
    }

    function handleMouseOut() {
        const currentRating = starsContainer.dataset.rating || 0;
        highlightStars(currentRating);
    }

    async function handleClick(e) {
        const star = e.target.closest('.rating-star');
        if (star) {
            const rating = star.dataset.value;
            starsContainer.dataset.rating = rating;
            
            try {
                await saveRating(parseInt(rating));
                localStorage.setItem(RATING_SUBMITTED_KEY, 'true');
                showThankYouState();
                console.log('✅ Rating saved successfully!');
            } catch (error) {
                console.error('❌ Failed to save rating:', error);
                alert('เกิดข้อผิดพลาดในการบันทึกข้อมูล');
            }
        }
    }

    function highlightStars(value) {
        stars.forEach(star => {
            star.classList.toggle('hover', star.dataset.value <= value);
        });
    }

    function showThankYouState() {
        starsContainer.classList.add('hidden');
        thankYouMessage.classList.remove('hidden');
        ratingWidget.querySelector('h4').classList.add('hidden');
    }

    async function saveRating(ratingValue) {
        // จำลองการส่งข้อมูลไปที่ Backend API
        const response = await fetch('/api/save-rating', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                rating: ratingValue,
                timestamp: new Date().toISOString()
            })
        });

        if (!response.ok) {
            throw new Error('Server responded with an error.');
        }
        return await response.json();
    }

    // เริ่มการทำงานของ Logic
    init();
}