document.addEventListener('DOMContentLoaded', () => {

    // --- DOM Elements ---
    const loadingState = document.getElementById('loading-state');
    const resultState = document.getElementById('result-state');
    const loadingProcessText = document.getElementById('loading-process-text');
    const aiIntroduction = document.getElementById('ai-introduction');
    const pathTabsContainer = document.getElementById('path-tabs');
    const pathContentsContainer = document.getElementById('path-contents');
    let loadingInterval;

    // --- App State ---
    const APP_STORAGE_KEY = 'skilldexFormData';
    const MYPATH_RESULTS_KEY = 'skilldexMyPathResults';

    // --- Main Initialization Function ---
    async function init() {
        const userData = loadUserData();

        if (!userData) {
            displayErrorState("ไม่พบข้อมูลผู้ใช้", "กรุณากลับไปกรอกข้อมูลก่อน");
            return;
        }

        displayLoadingState(userData);
        startLoadingProcess();

        try {
            const multiPathData = await fetchMultiPathRoadmap(userData);
            
            // ตรวจสอบว่าข้อมูลที่ได้รับถูกต้องหรือไม่
            if (!multiPathData || !multiPathData.career_paths || !Array.isArray(multiPathData.career_paths)) {
                throw new Error("ข้อมูลจาก AI ไม่สมบูรณ์");
            }

            // บันทึกผลลัพธ์ที่ได้ลง Cache
            localStorage.setItem(MYPATH_RESULTS_KEY, JSON.stringify(multiPathData));
            
            renderResults(multiPathData);
        } catch (error) {
            console.error("Failed to generate career paths:", error);
            displayErrorState("เกิดข้อผิดพลาด", error.message || "ไม่สามารถสร้างแผนที่เส้นทางอาชีพได้");
        }
    }

    // --- Data & Cache Management ---
    function loadUserData() {
        const savedData = localStorage.getItem(APP_STORAGE_KEY);
        return savedData ? JSON.parse(savedData) : null;
    }

    function clearCache(key) {
        localStorage.removeItem(key);
    }

    // --- API Fetching ---
    async function fetchMultiPathRoadmap(userData) {
        // ตรวจสอบ Cache ก่อนยิง API
        const cachedData = localStorage.getItem(MYPATH_RESULTS_KEY);
        if (cachedData) {
            console.log("✅ Loading my-path data from Cache");
            try {
                return JSON.parse(cachedData);
            } catch (e) {
                console.warn("⚠️ Cache data corrupted, fetching new data");
                localStorage.removeItem(MYPATH_RESULTS_KEY);
            }
        }

        console.log("➡️  Sending user data to /api/my-path (No Cache Found)");
        const response = await fetch('/api/my-path', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userData })
        });

        if (!response.ok) {
            const errorResult = await response.json().catch(() => ({ error: 'ไม่สามารถติดต่อกับเซิร์ฟเวอร์ได้' }));
            throw new Error(errorResult.error || 'ไม่สามารถติดต่อกับเซิร์ฟเวอร์ได้');
        }
        
        const data = await response.json();
        console.log("⬅️  Received AI response for my-path:", data);
        return data;
    }

    // --- UI State Management & Rendering ---
    function displayLoadingState() {
        resultState.classList.add('hidden');
        loadingState.classList.remove('hidden');
    }

    function startLoadingProcess() {
        if (!loadingProcessText) return;
        const messages = [
            "กำลังวิเคราะห์โปรไฟล์ของคุณ...", 
            "ประเมินทักษะและความสนใจ...",
            "ค้นหาแนวโน้มตลาดงานในกรุงเทพฯ...", 
            "สร้าง Roadmap แต่ละเส้นทาง...",
            "กำลังเปรียบเทียบข้อดี-ข้อเสีย...", 
            "จัดทำข้อมูลสรุป... เกือบเสร็จแล้ว!"
        ];
        let messageIndex = 0;
        loadingProcessText.textContent = messages[0];
        loadingInterval = setInterval(() => {
            messageIndex = (messageIndex + 1) % messages.length;
            loadingProcessText.textContent = messages[messageIndex];
        }, 3000);
    }

    function renderResults(data) {
        clearInterval(loadingInterval);
        loadingState.classList.add('hidden');
        resultState.classList.remove('hidden');

        aiIntroduction.textContent = data.introduction || "สวัสดีค่ะ! นี่คือแผนที่เส้นทางอาชีพที่เราสร้างขึ้นสำหรับคุณ";
        pathTabsContainer.innerHTML = '';
        pathContentsContainer.innerHTML = '';

        if (data.career_paths && Array.isArray(data.career_paths) && data.career_paths.length > 0) {
            data.career_paths.forEach((path, index) => {
                if (!path) return;

                const isActive = index === 0;
                
                // สร้างปุ่ม Tab
                const tabButton = document.createElement('button');
                tabButton.className = `tab-button ${isActive ? 'active' : ''}`;
                tabButton.dataset.target = `path-${index + 1}`;
                tabButton.innerHTML = `<span class="tab-rank">เส้นทางที่ ${index + 1}</span><span class="tab-title">${path.path_title || 'เส้นทางอาชีพ'}</span>`;
                pathTabsContainer.appendChild(tabButton);

                // สร้าง Content ของแต่ละ Tab
                const tabContent = document.createElement('div');
                tabContent.id = `path-${index + 1}`;
                tabContent.className = `tab-content ${isActive ? 'active' : ''}`;
                
                const prosHtml = path.pros && Array.isArray(path.pros) ? path.pros.map(p => `<li>${p}</li>`).join('') : '<li>ไม่มีข้อมูล</li>';
                const consHtml = path.cons && Array.isArray(path.cons) ? path.cons.map(c => `<li>${c}</li>`).join('') : '<li>ไม่มีข้อมูล</li>';
                
                const roadmapHtml = path.roadmap && Array.isArray(path.roadmap) ? path.roadmap.map(phase => {
                    const milestonesHtml = phase.milestones && Array.isArray(phase.milestones) ? phase.milestones.map(ms => `
                        <div class="milestone-card">
                            <h5>${ms.title || 'ไม่มีชื่อ'}</h5>
                            <p>${ms.description || ''}</p>
                            <div class="resource-tags">
                                ${ms.resources && Array.isArray(ms.resources) ? ms.resources.map(r => `<span>${r}</span>`).join('') : ''}
                            </div>
                        </div>`).join('') : '';

                    return `
                        <div class="phase-container">
                            <div class="phase-header simple">
                                <div class="phase-title">
                                    <h4>${phase.phase_title || 'ระยะเวลา'}</h4>
                                </div>
                            </div>
                            <div class="milestone-list">${milestonesHtml}</div>
                        </div>`;
                }).join('') : '<p>ไม่มีข้อมูล Roadmap</p>';

                tabContent.innerHTML = `
                    <div class="analysis-grid">
                        <div class="analysis-card pros"><h4>ข้อดี / โอกาสสำหรับคุณ</h4><ul>${prosHtml}</ul></div>
                        <div class="analysis-card cons"><h4>ความท้าทาย / สิ่งที่ต้องพิจารณา</h4><ul>${consHtml}</ul></div>
                    </div>
                    <div class="market-data-grid">
                        <div class="market-data-item"><span class="data-label">เงินเดือนเริ่มต้น (กทม.)</span><span class="data-value">${path.supporting_data?.avg_starting_salary_bkk || 'ไม่มีข้อมูล'}</span></div>
                        <div class="market-data-item"><span class="data-label">แนวโน้มตลาด</span><span class="data-value">${path.supporting_data?.market_trend || 'ไม่มีข้อมูล'}</span></div>
                    </div>
                    <div class="roadmap-timeline">${roadmapHtml}</div>`;
                pathContentsContainer.appendChild(tabContent);
            });
            setupTabListeners();
            addFooterButtons();
        } else {
            displayErrorState("ข้อมูลไม่สมบูรณ์", "AI ไม่สามารถสร้างเส้นทางอาชีพได้");
        }
    }

    function setupTabListeners() {
        const tabButtons = document.querySelectorAll('.tab-button');
        const tabContents = document.querySelectorAll('.tab-content');
        tabButtons.forEach(button => {
            button.addEventListener('click', () => {
                tabButtons.forEach(btn => btn.classList.remove('active'));
                tabContents.forEach(content => content.classList.remove('active'));
                button.classList.add('active');
                const targetContent = document.getElementById(button.dataset.target);
                if (targetContent) {
                    targetContent.classList.add('active');
                }
            });
        });
    }

    function addFooterButtons() {
        const footer = resultState.querySelector('.result-footer');
        if (!footer) {
            console.error("Footer element not found in result-state");
            return;
        }

        // ล้างปุ่มเดิมทั้งหมด
        footer.innerHTML = '';

        // สร้างปุ่ม "กลับไปที่ Dashboard"
        const dashboardButton = document.createElement('a');
        dashboardButton.href = 'dashboard.html';
        dashboardButton.className = 'back-button';
        dashboardButton.textContent = 'กลับไปที่ Dashboard';

        // สร้างปุ่ม "สร้างแผนที่ใหม่"
        const resetButton = document.createElement('button');
        resetButton.textContent = 'สร้างแผนที่ใหม่';
        resetButton.className = 'reset-button';
        resetButton.onclick = async () => {
            if (confirm('คุณต้องการลบแผนที่ที่เคยสร้างไว้ และให้ AI วิเคราะห์ใหม่ทั้งหมดหรือไม่?')) {
                // แสดง loading state ก่อน
                displayLoadingState();
                startLoadingProcess();
                
                // ลบ cache
                clearCache(MYPATH_RESULTS_KEY);
                
                try {
                    // ดึงข้อมูล user จาก localStorage
                    const userData = loadUserData();
                    if (!userData) {
                        throw new Error("ไม่พบข้อมูลผู้ใช้");
                    }
                    
                    // เรียก API ใหม่
                    const multiPathData = await fetchMultiPathRoadmap(userData);
                    
                    // ตรวจสอบข้อมูล
                    if (!multiPathData || !multiPathData.career_paths || !Array.isArray(multiPathData.career_paths)) {
                        throw new Error("ข้อมูลจาก AI ไม่สมบูรณ์");
                    }
                    
                    // บันทึกผลลัพธ์ใหม่และแสดงผล
                    localStorage.setItem(MYPATH_RESULTS_KEY, JSON.stringify(multiPathData));
                    renderResults(multiPathData);
                    
                } catch (error) {
                    console.error("Failed to regenerate career paths:", error);
                    displayErrorState("เกิดข้อผิดพลาด", error.message || "ไม่สามารถสร้างแผนที่เส้นทางอาชีพใหม่ได้");
                }
            }
        };

        // เพิ่มปุ่มทั้งสองเข้าไปใน footer
        footer.appendChild(dashboardButton);
        footer.appendChild(resetButton);
    }

    function displayErrorState(title, subtitle = "กรุณาลองใหม่อีกครั้ง") {
        clearInterval(loadingInterval);
        loadingState.innerHTML = `
            <h1 class="loading-title" style="color: red;">${title}</h1>
            <p class="loading-subtitle">${subtitle}</p>
            <a href="dashboard.html" class="back-button">กลับหน้าแดชบอร์ด</a>
        `;
        loadingState.classList.remove('hidden');
        resultState.classList.add('hidden');
    }

    // --- Start the application ---
    init();
});