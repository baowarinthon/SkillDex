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
    // --- ⚠️ ส่วนที่เพิ่มเข้ามา: Key สำหรับจำข้อมูลของหน้านี้ ---
    const MYPATH_RESULTS_KEY = 'skilldexMyPathResults';

    // --- Main Initialization Function ---
    async function init() {
        const userData = loadData(APP_STORAGE_KEY);
        if (!userData) {
            displayErrorState("ไม่พบข้อมูลผู้ใช้", "กรุณากลับไปกรอกข้อมูลก่อน");
            return;
        }

        displayLoadingState();
        startLoadingProcess();

        try {
            const multiPathData = await fetchMultiPathRoadmap(userData);
            // --- ⚠️ ส่วนที่เพิ่มเข้ามา: บันทึกผลลัพธ์ที่ได้ลง Cache ---
            localStorage.setItem(MYPATH_RESULTS_KEY, JSON.stringify(multiPathData));
            
            renderResults(multiPathData);
        } catch (error) {
            console.error("Failed to generate career paths:", error);
            displayErrorState(error.message || "ไม่สามารถสร้างแผนที่เส้นทางอาชีพได้");
        }
    }

    // --- Data & Cache Management ---
    function loadData(key) {
        const savedData = localStorage.getItem(key);
        return savedData ? JSON.parse(savedData) : null;
    }

    // --- ⚠️ ส่วนที่เพิ่มเข้ามา: ฟังก์ชันสำหรับล้าง Cache ---
    function clearCache(key) {
        localStorage.removeItem(key);
    }

    // --- API Fetching ---
    async function fetchMultiPathRoadmap(userData) {
        // --- ⚠️ ส่วนที่เพิ่มเข้ามา: ตรวจสอบ Cache ก่อนยิง API ---
        const cachedData = localStorage.getItem(MYPATH_RESULTS_KEY);
        if (cachedData) {
            console.log("✅ Loading my-path data from Cache");
            return JSON.parse(cachedData);
        }

        console.log("➡️  Sending user data to /api/my-path (No Cache Found)");
        const response = await fetch('/api/my-path', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userData })
        });

        if (!response.ok) {
            const errorResult = await response.json();
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
            "กำลังวิเคราะห์โปรไฟล์ของคุณ...", "ประเมินทักษะและความสนใจ...",
            "ค้นหาแนวโน้มตลาดงานในกรุงเทพฯ...", "สร้าง Roadmap แต่ละเส้นทาง...",
            "กำลังเปรียบเทียบข้อดี-ข้อเสีย...", "จัดทำข้อมูลสรุป... เกือบเสร็จแล้ว!"
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

        aiIntroduction.textContent = data.introduction;
        pathTabsContainer.innerHTML = '';
        pathContentsContainer.innerHTML = '';

        if (data.career_paths && Array.isArray(data.career_paths)) {
            data.career_paths.forEach((path, index) => {
                if (!path) return;

                const isActive = index === 0;
                const tabButton = document.createElement('button');
                tabButton.className = `tab-button ${isActive ? 'active' : ''}`;
                tabButton.dataset.target = `path-${index + 1}`;
                tabButton.innerHTML = `<span class="tab-rank">เส้นทางที่ ${index + 1}</span><span class="tab-title">${path.path_title}</span>`;
                pathTabsContainer.appendChild(tabButton);

                const tabContent = document.createElement('div');
                tabContent.id = `path-${index + 1}`;
                tabContent.className = `tab-content ${isActive ? 'active' : ''}`;
                
                const prosHtml = path.pros ? path.pros.map(p => `<li>${p}</li>`).join('') : '';
                const consHtml = path.cons ? path.cons.map(c => `<li>${c}</li>`).join('') : '';
                
                const roadmapHtml = path.roadmap.map(phase => {
                    const milestonesHtml = phase.milestones.map(ms => `
                        <div class="milestone-card">
                            <h5>${ms.title}</h5>
                            <p>${ms.description}</p>
                            <div class="resource-tags">
                                ${ms.resources ? ms.resources.map(r => `<span>${r}</span>`).join('') : ''}
                            </div>
                        </div>`).join('');

                    return `
                        <div class="phase-container">
                            <div class="phase-header simple">
                                <div class="phase-title">
                                    <h4>${phase.phase_title}</h4>
                                </div>
                            </div>
                            <div class="milestone-list">${milestonesHtml}</div>
                        </div>`;
                }).join('');

                tabContent.innerHTML = `
                    <div class="analysis-grid">
                        <div class="analysis-card pros"><h4>ข้อดี / โอกาสสำหรับคุณ</h4><ul>${prosHtml}</ul></div>
                        <div class="analysis-card cons"><h4>ความท้าทาย / สิ่งที่ต้องพิจารณา</h4><ul>${consHtml}</ul></div>
                    </div>
                    <div class="market-data-grid">
                        <div class="market-data-item"><span class="data-label">เงินเดือนเริ่มต้น (กทม.)</span><span class="data-value">${path.supporting_data.avg_starting_salary_bkk}</span></div>
                        <div class="market-data-item"><span class="data-label">แนวโน้มตลาด</span><span class="data-value">${path.supporting_data.market_trend}</span></div>
                    </div>
                    <div class="roadmap-timeline">${roadmapHtml}</div>`;
                pathContentsContainer.appendChild(tabContent);
            });
            setupTabListeners();
            // --- ⚠️ ส่วนที่เพิ่มเข้ามา: เรียกใช้ฟังก์ชันสร้างปุ่ม ---
            addFooterButtons();
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
                document.getElementById(button.dataset.target).classList.add('active');
            });
        });
    }

    // --- ⚠️ ส่วนที่เพิ่มเข้ามา: ฟังก์ชันสร้างปุ่มท้ายหน้า ---
    function addFooterButtons() {
        const footer = resultState.querySelector('.result-footer');
        if (!footer) return;

        // สร้างปุ่ม "สร้างแผนที่ใหม่"
        const resetButton = document.createElement('button');
        resetButton.textContent = '🔄 สร้างแผนที่ใหม่';
        resetButton.className = 'reset-button'; // ใช้ class จาก css เดิมได้เลย
        resetButton.onclick = () => {
            if (confirm('คุณต้องการลบแผนที่ที่เคยสร้างไว้ และให้ AI วิเคราะห์ใหม่ทั้งหมดหรือไม่?')) {
                clearCache(MYPATH_RESULTS_KEY); // สั่งล้าง Cache ของหน้านี้
                window.location.reload(); // รีเฟรชหน้า
            }
        };

        // เพิ่มปุ่มใหม่เข้าไปใน footer ต่อจากปุ่มเดิม
        footer.appendChild(resetButton);
    }

    function displayErrorState(title, subtitle = "กรุณาลองใหม่อีกครั้ง") {
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