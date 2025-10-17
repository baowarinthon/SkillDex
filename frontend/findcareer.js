document.addEventListener('DOMContentLoaded', () => {

    // --- DOM Elements ---
    const loadingState = document.getElementById('loading-state');
    const resultState = document.getElementById('result-state');
    const loadingUserName = document.getElementById('loading-user-name');
    const aiGreeting = document.getElementById('ai-greeting');
    const recommendationsContainer = document.getElementById('recommendations-container');
    
    // --- App State ---
    const APP_STORAGE_KEY = 'skilldexFormData';
    const CAREER_RESULTS_KEY = 'skilldexCareerResults';

    // --- Main Initialization Function ---
    async function init() {
        const userData = loadUserData();
        if (!userData) {
            displayErrorState("ไม่พบข้อมูลผู้ใช้", "กรุณากลับไปกรอกข้อมูลในหน้าฟอร์มก่อน");
            return;
        }

        displayLoadingState(userData);

        try {
            const recommendations = await fetchCareerRecommendations(userData);
            // บันทึกผลลัพธ์ที่ได้จาก AI ลงใน localStorage เพื่อไม่ต้องโหลดใหม่
            localStorage.setItem(CAREER_RESULTS_KEY, JSON.stringify(recommendations));
            renderResults(recommendations);
        } catch (error) {
            console.error("Failed to fetch career recommendations:", error);
            displayErrorState("เกิดข้อผิดพลาด", error.message);
        }
    }

    // --- Data & Cache Management ---
    function loadUserData() {
        const savedData = localStorage.getItem(APP_STORAGE_KEY);
        return savedData ? JSON.parse(savedData) : null;
    }

    function getCachedResults(key) {
        const cachedData = localStorage.getItem(key);
        return cachedData ? JSON.parse(cachedData) : null;
    }

    function clearCache(key) {
        localStorage.removeItem(key);
    }

    // --- API Fetching ---
    async function fetchCareerRecommendations(userData) {
        const cached = getCachedResults(CAREER_RESULTS_KEY);
        if (cached) {
            console.log("✅ Loading career recommendations from Cache");
            return cached;
        }

        console.log("➡️  Sending user data to /api/find-career (No Cache Found)");
        const response = await fetch('/api/find-career', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userData })
        });

        if (!response.ok) {
            const errorResult = await response.json();
            throw new Error(errorResult.error || 'ไม่สามารถติดต่อกับเซิร์ฟเวอร์ได้');
        }
        
        const data = await response.json();
        console.log("⬅️  Received AI response:", data);
        return data;
    }

    // --- UI State & Rendering ---
    function displayLoadingState(userData) {
        resultState.classList.add('hidden');
        loadingState.classList.remove('hidden');
        if (userData && userData.fullName) {
            loadingUserName.textContent = `อดใจรอแปปเดียว นะ${userData.fullName}!`;
        }
    }

    function renderResults(data) {
        if (!data || !data.career_recommendations || data.career_recommendations.length === 0) {
            displayErrorState("ข้อมูลไม่สมบูรณ์", "AI ไม่สามารถสร้างผลลัพธ์ที่ถูกต้องได้");
            return;
        }

        loadingState.classList.add('hidden');
        resultState.classList.remove('hidden');

        aiGreeting.textContent = data.greeting;
        recommendationsContainer.innerHTML = ''; // Clear previous results

        data.career_recommendations.forEach(rec => {
            const card = createRecommendationCard(rec);
            recommendationsContainer.appendChild(card);
        });

        // เรียกใช้ฟังก์ชันสร้างปุ่มท้ายหน้าเว็บจากโค้ดเดิมของคุณ
        addResetButton(CAREER_RESULTS_KEY);
    }

    function createRecommendationCard(rec) {
        const card = document.createElement('div');
        card.className = 'recommendation-card';

        const skillsHtml = rec.key_skills.map(skill => `<span>${skill}</span>`).join('');

        card.innerHTML = `
            <div class="card-header">
                <h3>${rec.career_title}</h3>
                <div class="alignment-score" title="ความเหมาะสมกับโปรไฟล์ของคุณ">${rec.alignment_score}%</div>
            </div>
            <p class="summary">${rec.summary}</p>
            <div class="key-skills">
                <h4>ทักษะสำคัญ</h4>
                <div class="tags-container">${skillsHtml}</div>
            </div>
            <div class="market-data">
                <div class="data-item"><strong>เงินเดือนเริ่มต้น (กทม.)</strong> <p>${rec.supporting_data.avg_starting_salary_bkk}</p></div>
                <div class="data-item"><strong>แนวโน้มตลาด</strong> <p>${rec.supporting_data.market_trend}</p></div>
            </div>`;
        return card;
    }

    function addResetButton(featureKey) {
        // ใช้ querySelector ใน resultState เพื่อหา footer ที่มีอยู่แล้วใน HTML
        const footer = resultState.querySelector('.result-footer');
        if (!footer) {
             console.error("Footer element not found in result-state");
             return;
        }
        
        // สร้างปุ่มต่างๆ
        const myPathButton = `<a href="dashboard.html" class="action-button">กลับไปที่ Dashboard</a>`;

        const resetButton = document.createElement('button');
        resetButton.textContent = 'สร้างผลลัพธ์ใหม่';
        resetButton.className = 'reset-button'; // เพิ่ม class สำหรับ styling
        resetButton.onclick = () => {
            if (confirm('คุณต้องการลบข้อมูลที่เคยสร้างไว้ และให้ AI วิเคราะห์ใหม่หรือไม่?')) {
                clearCache(featureKey);
                window.location.reload();
            }
        };

        // เพิ่มปุ่มเข้าไปใน footer
        footer.innerHTML = myPathButton;
        footer.appendChild(resetButton);
    }
    
    function displayErrorState(title, subtitle = "กรุณาลองใหม่อีกครั้ง") {
        loadingState.innerHTML = `
            <h1 class="loading-title" style="color: red;">${title}</h1>
            <p class="loading-subtitle">${subtitle}</p>
            <a href="dashboard.html" class="back-button">กลับหน้าแดชบอร์ด</a>`;
        loadingState.classList.remove('hidden');
        resultState.classList.add('hidden');
    }

    // --- Start the application ---
    init();
});