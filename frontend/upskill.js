document.addEventListener('DOMContentLoaded', () => {

    // --- DOM Elements ---
    const loadingState = document.getElementById('loading-state');
    const resultState = document.getElementById('result-state');
    const loadingCareerTarget = document.getElementById('loading-career-target');
    const aiIntroduction = document.getElementById('ai-introduction');
    const resultCareerTitle = document.getElementById('result-career-title');
    const upskillPlanContainer = document.getElementById('upskill-plan-container');

    // --- App State ---
    const APP_STORAGE_KEY = 'skilldexFormData';
    // ลบตัวแปร let UPSKILL_PLAN_KEY ออกไป เพื่อป้องกันการต่อ string สะสม

    // --- Main Initialization Function ---
    async function init() {
        const userData = loadUserData();

        if (!userData) {
            displayErrorState("ไม่พบข้อมูลผู้ใช้", "กรุณากลับไปกรอกข้อมูลในหน้าฟอร์มก่อน");
            return;
        }

        const targetCareer = userData.targetProfession || null;

        if (targetCareer && targetCareer.trim() !== '') {
            console.log(`✅ Target career found: "${targetCareer}"`);
            startUpskillingPlan(userData, targetCareer);
        } else {
            console.warn("Target career not found in user data. Showing input overlay.");
            showCareerInputOverlay((manualCareer) => {
                startUpskillingPlan(userData, manualCareer);
            });
        }
    }

    // --- Core Logic for Upskilling Plan ---
    async function startUpskillingPlan(userData, targetCareer) {
        // --- ⚠️ จุดแก้ไขหลัก: สร้าง Cache Key ที่ถูกต้องทุกครั้งที่เรียกใช้ฟังก์ชัน ---
        const cacheKey = `skilldexUpskillPlan_${targetCareer.replace(/\s+/g, '-')}`;

        displayLoadingState(targetCareer);

        try {
            // ส่ง cacheKey ที่ถูกต้องเข้าไปในฟังก์ชัน
            const upskillPlan = await fetchUpskillPlan(userData, targetCareer, cacheKey);
            
            // บันทึกผลลัพธ์ลง Cache ด้วย Key ที่ถูกต้อง
            localStorage.setItem(cacheKey, JSON.stringify(upskillPlan));
            
            // ส่ง cacheKey ไปให้ฟังก์ชัน render เพื่อใช้กับปุ่ม Reset
            renderResults(upskillPlan, cacheKey);
        } catch (error) {
            console.error("Failed to fetch upskill plan:", error);
            displayErrorState("เกิดข้อผิดพลาดในการสร้างแผน", error.message);
        }
    }

    // --- Data & Cache Management ---
    function loadUserData() {
        const savedData = localStorage.getItem(APP_STORAGE_KEY);
        return savedData ? JSON.parse(savedData) : null;
    }

    function getCachedPlan(cacheKey) {
        const cachedData = localStorage.getItem(cacheKey);
        return cachedData ? JSON.parse(cachedData) : null;
    }

    function clearCache(cacheKey) {
        localStorage.removeItem(cacheKey);
    }

    // --- API Fetching ---
    async function fetchUpskillPlan(userData, targetCareer, cacheKey) {
        // --- ⚠️ จุดแก้ไข: รับ cacheKey เข้ามาเพื่อใช้ตรวจสอบ ---
        const cachedPlan = getCachedPlan(cacheKey);
        if (cachedPlan) {
            console.log(`✅ Loading upskill plan for "${targetCareer}" from Cache`);
            return cachedPlan;
        }

        console.log(`➡️  Sending data to /api/upskill for "${targetCareer}" (No Cache)`);
        const response = await fetch('/api/upskill', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userData, targetCareer })
        });

        if (!response.ok) {
            const errorResult = await response.json();
            throw new Error(errorResult.error || 'ไม่สามารถติดต่อกับเซิร์ฟเวอร์ AI ได้');
        }

        return await response.json();
    }

    // --- UI State & Rendering ---

    function displayLoadingState(targetCareer) {
        resultState.classList.add('hidden');
        loadingState.classList.remove('hidden');
        loadingCareerTarget.textContent = `เป้าหมาย: ${targetCareer}`;
    }
    
    function displayErrorState(title, subtitle = "กรุณาลองใหม่อีกครั้ง") {
        document.body.innerHTML = `
            <div class="page-container" style="text-align: center; padding-top: 4rem;">
                <h1 style="color: #ef4444;">${title}</h1>
                <p>${subtitle}</p>
                <a href="dashboard.html" style="margin-top: 1rem; display: inline-block; text-decoration: none; background-color: #e5e7eb; color: #1f2937; padding: 0.5rem 1rem; border-radius: 0.5rem;">กลับหน้า Dashboard</a>
            </div>`;
    }

    function renderResults(data, cacheKey) {
        // --- ⚠️ จุดแก้ไข: รับ cacheKey เข้ามา ---
        loadingState.classList.add('hidden');
        resultState.classList.remove('hidden');

        aiIntroduction.textContent = data.introduction;
        resultCareerTitle.textContent = data.target_career;
        upskillPlanContainer.innerHTML = '';

        if (data.upskill_plan && data.upskill_plan.length > 0) {
            data.upskill_plan.forEach(skill => {
                const card = createSkillCard(skill);
                upskillPlanContainer.appendChild(card);
            });
        }
        
        // ส่ง cacheKey ไปให้ปุ่ม Reset
        addResetButton(cacheKey);
    }

    function createSkillCard(skill) {
        const card = document.createElement('div');
        card.className = 'skill-card';

        const importanceClass = (skill.importance_level || 'medium').toLowerCase();
        
        const coursesHtml = skill.recommended_courses.map(item => `
            <div class="resource-item">
                <h5 class="resource-title">${item.title}</h5>
                <span class="resource-type course">${item.platform} - ${item.type}</span>
            </div>`).join('');

        const projectsHtml = skill.recommended_projects.map(item => `
            <div class="resource-item">
                <h5 class="resource-title">${item.title}</h5>
                <p class="resource-description">${item.description}</p>
            </div>`).join('');
        
        const resourcesHtml = skill.additional_resources.map(item => `
            <div class="resource-item">
                <h5 class="resource-title">${item.title}</h5>
                <span class="resource-type ${item.type.toLowerCase()}">${item.type}</span>
            </div>`).join('');

        card.innerHTML = `
            <div class="skill-card-header">
                <span class="importance-badge ${importanceClass}">ความสำคัญ${skill.importance_level === 'High' ? 'สูง' : skill.importance_level === 'Medium' ? 'ปานกลาง' : 'พื้นฐาน'}</span>
                <h2 class="skill-title">${skill.skill_to_learn}</h2>
            </div>
            <div class="skill-card-body">
                <p class="skill-reason">${skill.reason_to_learn}</p>
                ${coursesHtml ? `<div class="resource-section"><h4> คอร์สเรียนแนะนำ</h4><div class="resource-list">${coursesHtml}</div></div>` : ''}
                ${projectsHtml ? `<div class="resource-section"><h4> โปรเจกต์ที่ควรทำ</h4><div class="resource-list">${projectsHtml}</div></div>` : ''}
                ${resourcesHtml ? `<div class="resource-section"><h4> แหล่งข้อมูลเพิ่มเติม</h4><div class="resource-list">${resourcesHtml}</div></div>` : ''}
            </div>
        `;
        return card;
    }
    
    function addResetButton(cacheKey) {
        const existingFooter = resultState.querySelector('.result-footer');
        if (!existingFooter) return;

        // Clear previous buttons to avoid duplicates
        existingFooter.innerHTML = '<a href="dashboard.html" class="back-to-dashboard-button">กลับไปหน้า Dashboard</a>';

        const resetButton = document.createElement('button');
        resetButton.textContent = 'สร้างแผนการเรียนรู้ใหม่';
        resetButton.className = 'reset-button';
        
        resetButton.onclick = () => {
            if (confirm('คุณต้องการลบแผนการเรียนรู้นี้ และให้ AI วิเคราะห์ข้อมูลเพื่อสร้างแผนใหม่หรือไม่?')) {
                clearCache(cacheKey);
                window.location.reload();
            }
        };

        existingFooter.appendChild(resetButton);
    }

    function showCareerInputOverlay(onSubmit) {
        loadingState.classList.add('hidden');
        resultState.classList.add('hidden');

        const overlay = document.createElement('div');
        overlay.id = 'career-input-overlay';
        overlay.style.cssText = `
            position: fixed; top: 0; left: 0; width: 100%; height: 100%;
            background-color: rgba(0,0,0,0.6);
            display: flex; align-items: center; justify-content: center;
            z-index: 1000; animation: fadeIn 0.3s;
        `;

        const modal = document.createElement('div');
        modal.style.cssText = `
            background-color: white; padding: 2rem; border-radius: 1rem;
            width: 90%; max-width: 500px; text-align: center;
            box-shadow: 0 10px 25px rgba(0,0,0,0.1);
        `;

        modal.innerHTML = `
            <h2 style="margin-top: 0; font-size: 1.5rem;">ไม่พบอาชีพเป้าหมาย</h2>
            <p style="color: #6b7280; margin-bottom: 1.5rem;">กรุณาระบุชื่ออาชีพที่คุณต้องการพัฒนาทักษะไปสู่</p>
            <input type="text" id="manual-career-input" placeholder="เช่น Product Manager, Data Scientist" style="width: 100%; padding: 0.75rem; font-size: 1rem; border: 1px solid #e5e7eb; border-radius: 0.5rem; margin-bottom: 1rem; box-sizing: border-box;">
            <button id="submit-manual-career" style="width: 100%; padding: 0.75rem; font-size: 1rem; background-color: #4f46e5; color: white; border: none; border-radius: 0.5rem; cursor: pointer;">สร้างแผนการเรียนรู้</button>
        `;

        overlay.appendChild(modal);
        document.body.appendChild(overlay);

        document.getElementById('submit-manual-career').addEventListener('click', () => {
            const input = document.getElementById('manual-career-input');
            const career = input.value.trim();
            if (career) {
                document.body.removeChild(overlay);
                onSubmit(career);
            } else {
                alert('กรุณากรอกชื่ออาชีพ');
                input.focus();
            }
        });
    }

    // --- Start the application ---
    init();
});