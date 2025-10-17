document.addEventListener('DOMContentLoaded', () => {

    // --- STATE MANAGEMENT & CORE VARIABLES ---
    const form = document.getElementById('skilldexEditForm');
    const sections = document.querySelectorAll('form > section.skilldex-page');
    const navButtons = document.querySelectorAll('.skilldex-nav-button');
    const APP_STORAGE_KEY = 'skilldexFormData';
    const MAX_FILE_SIZE_MB = 5;
    const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;
    let formData = {};
    let cachedJsonData = {}; 

    // --- INITIALIZATION ---
    async function init() {
        loadDataFromStorage();
        setupNavigationListeners();      // 1. เปลี่ยนมาใช้ Nav Bar
        setupConditionalListeners();
        setupInputListeners();           // 2. เพิ่มการ Autosave ที่นี่
        await setupAllComponents();      // 3. รอสร้าง UI ให้เสร็จ
        populateForm();                  // 4. เติมข้อมูลลงฟอร์ม
        setupLimitListeners();
        setupFileUploadListeners(); 
        setupFormSubmitListener();       // 5. ปรับแก้ปุ่ม Submit
        
        restoreUiState();                // 6. เรียกคืนสถานะ UI หลังเติมข้อมูล

        showSection('sectionAbout');     // 7. เริ่มที่หน้าแรกเสมอ
    }

    // --- DATA HANDLING ---
    function loadDataFromStorage() {
        const savedData = localStorage.getItem(APP_STORAGE_KEY);
        formData = savedData ? JSON.parse(savedData) : {};
    }

    function updateFormData(key, value) {
        formData[key] = value;
        localStorage.setItem(APP_STORAGE_KEY, JSON.stringify(formData));
    }

    // --- UI NAVIGATION (ปรับปรุงใหม่สำหรับ Nav Bar) ---
    function showSection(sectionId) {
        if (!document.getElementById(sectionId)) return;
        sections.forEach(section => {
            section.classList.toggle('hidden', section.id !== sectionId);
        });
        navButtons.forEach(button => {
            button.classList.toggle('active', button.dataset.target === sectionId);
        });
        window.scrollTo(0, 0); // เลื่อนไปบนสุดเมื่อเปลี่ยนหน้า
    }

    function setupNavigationListeners() {
        navButtons.forEach(button => {
            button.addEventListener('click', () => {
                showSection(button.dataset.target);
            });
        });
    }

    // --- DYNAMIC UI & COMPONENTS (FROM form.js) ---
    async function fetchJsonData(componentName) {
        if (cachedJsonData[componentName]) return cachedJsonData[componentName];
        try {
            const response = await fetch(`./assets/data/${componentName}.json`);
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            const data = await response.json();
            cachedJsonData[componentName] = data;
            return data;
        } catch (error) {
            console.error(`Could not fetch ${componentName}.json:`, error);
            return [];
        }
    }

    async function setupAllComponents() {
        await Promise.all([
            setupHardSkills(),
            setupTagInputs()
        ]);
    }

    async function setupHardSkills() {
        const container = document.getElementById('hardSkillsContainer');
        if (!container) return;
        const skills = await fetchJsonData('hard_skills');
        container.innerHTML = ''; // Clear existing before adding
        skills.forEach(skill => {
            container.appendChild(createSkillLevelComponent(skill.name));
        });
    }

    function createSkillLevelComponent(skillName) {
        const uniqueId = skillName.toLowerCase().replace(/[^a-z0-9]/g, '');
        const container = document.createElement('div');
        container.className = 'skilldex-skill-level-item';
        container.innerHTML = `
            <div class="skilldex-skill-name">${skillName}</div>
            <div class="skilldex-skill-radios">
                <label class="skilldex-skill-radio-label"><input type="radio" name="skill-level-${uniqueId}" value="0" data-skill-name="${skillName}" class="skilldex-skill-radio"> พื้นฐาน</label>
                <label class="skilldex-skill-radio-label"><input type="radio" name="skill-level-${uniqueId}" value="1" data-skill-name="${skillName}" class="skilldex-skill-radio"> ใช้งานได้</label>
                <label class="skilldex-skill-radio-label"><input type="radio" name="skill-level-${uniqueId}" value="2" data-skill-name="${skillName}" class="skilldex-skill-radio"> เชี่ยวชาญ</label>
            </div>
        `;
        return container;
    }
    
    async function setupTagInputs() {
        for (const container of document.querySelectorAll('.skilldex-tag-container')) {
            const sourceName = container.dataset.source;
            const data = sourceName ? await fetchJsonData(sourceName) : [];
            const suggestions = data.map(item => item.name);
            setupTagInput(container, suggestions);
        }
    }

    function setupTagInput(container, suggestions = []) {
        const input = container.querySelector('input');
        const limit = parseInt(container.dataset.limit, 10) || Infinity;
        
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && input.value.trim() !== '') {
                e.preventDefault();
                if (container.querySelectorAll('.skilldex-tag').length < limit) {
                    addTag(input.value.trim(), container);
                    input.value = '';
                }
            }
        });
        // Autocomplete logic can be added here
    }

    function addTag(text, container) {
        const existing = Array.from(container.querySelectorAll('.skilldex-tag')).map(t => t.textContent.replace('×', '').trim().toLowerCase());
        if (existing.includes(text.toLowerCase())) return;
        const tag = document.createElement('span');
        tag.className = 'skilldex-tag';
        tag.textContent = text;
        const closeBtn = document.createElement('button');
        closeBtn.innerHTML = '&times;';
        closeBtn.type = 'button';
        closeBtn.onclick = () => { tag.remove(); updateTagData(container); };
        tag.appendChild(closeBtn);
        container.insertBefore(tag, container.querySelector('input'));
        updateTagData(container);
    }

    function updateTagData(container) {
        const key = container.querySelector('input').name;
        if (!key) return;
        const tags = Array.from(container.querySelectorAll('.skilldex-tag')).map(t => t.textContent.replace('×', '').trim());
        const limit = parseInt(container.dataset.limit, 10);
        updateFormData(key, limit === 1 ? (tags[0] || "") : tags);
    }

    // --- FORM POPULATION ---
    function populateForm() {
        Object.keys(formData).forEach(key => {
            const value = formData[key];
            if (value === null || value === undefined) return;

            if (key === 'skillLevels' && typeof value === 'object') {
                Object.keys(value).forEach(skillName => {
                    const level = value[skillName].level;
                    const radio = form.querySelector(`[data-skill-name="${skillName}"][value="${level}"]`);
                    if (radio) radio.checked = true;
                });
                return;
            }

            const tagInput = form.querySelector(`input[name="${key}"]`);
            if (tagInput && tagInput.closest('.skilldex-tag-container')) {
                const container = tagInput.closest('.skilldex-tag-container');
                const values = Array.isArray(value) ? value : [value];
                values.forEach(val => { if (val) addTag(val, container); });
                return;
            }

            const elements = form.querySelectorAll(`[name="${key}"]`);
            if (elements.length > 0) {
                const el = elements[0];
                if (el.type === 'radio') {
                    const target = form.querySelector(`[name="${key}"][value="${value}"]`);
                    if (target) target.checked = true;
                } else if (el.type === 'checkbox' && Array.isArray(value)) {
                    value.forEach(item => {
                        const checkbox = form.querySelector(`[name="${key}"][value="${item}"]`);
                        if (checkbox) checkbox.checked = true;
                    });
                } else {
                    el.value = value;
                }
            }
        });
    }

    // --- EVENT LISTENERS ---
    function setupInputListeners() {
        form.addEventListener('input', (e) => {
            const target = e.target;
            const { name, value, type, checked } = target;
            if (target.matches('[data-skill-name]')) {
                const skillName = target.dataset.skillName;
                if (!formData.skillLevels) formData.skillLevels = {};
                formData.skillLevels[skillName] = { name: skillName, level: value };
                updateFormData('skillLevels', formData.skillLevels);
            } else if (type === 'checkbox') {
                const currentValues = formData[name] || [];
                const valueSet = new Set(currentValues);
                checked ? valueSet.add(value) : valueSet.delete(value);
                updateFormData(name, Array.from(valueSet));
            } else if (name && !target.closest('.skilldex-tag-container')) {
                updateFormData(name, value);
            }
        });
    }

    // --- CONDITIONAL UI & HELPERS ---
    function setupConditionalListeners() {
        form.addEventListener('change', (e) => {
            const { name, value } = e.target;
            if (name === 'currentStatus') {
                document.getElementById('studentFields').classList.toggle('hidden', value !== 'student');
                document.getElementById('employeeFields').classList.toggle('hidden', value !== 'employee' && value !== 'freelance');
            }
            if (name === 'careerClarity') {
                document.getElementById('careerGoalFields').classList.toggle('hidden', value === 'C');
                document.getElementById('careerExploreFields').classList.toggle('hidden', value !== 'C');
            }
            if (name === 'careerGoal') {
                 document.getElementById('careerGoalOtherGroup').classList.toggle('hidden', value !== 'other');
            }
            if (name === 'hasResume') {
                 document.getElementById('resumeUploadContainer').classList.toggle('hidden', value !== 'yes');
            }
        });
    }
    
    function restoreUiState() {
        form.querySelectorAll('input[type="radio"]:checked, select').forEach(el => {
            el.dispatchEvent(new Event('change', { bubbles: true }));
        });
        form.querySelectorAll('[data-limit]').forEach(container => {
             const changeEvent = new Event('change', { bubbles: true });
             const firstCheckbox = container.querySelector('input[type="checkbox"]');
             if(firstCheckbox) firstCheckbox.dispatchEvent(changeEvent);
        });
    }

    function setupLimitListeners() {
        document.querySelectorAll('[data-limit]').forEach(container => {
            const limit = parseInt(container.dataset.limit, 10);
            const checkboxes = container.querySelectorAll('input[type="checkbox"]');
            const updateDisabledState = () => {
                const checkedCount = container.querySelectorAll('input:checked').length;
                checkboxes.forEach(cb => { cb.disabled = !cb.checked && checkedCount >= limit; });
            };
            container.addEventListener('change', e => {
                 if(e.target.type === 'checkbox') updateDisabledState();
            });
            updateDisabledState();
        });
    }
    
    function setupFileUploadListeners() {
        const fileInput = document.getElementById('resumeUpload');
        if (!fileInput) return;
        const fileDisplay = document.querySelector('.file-upload-display');
        const fileNameSpan = document.getElementById('fileName');
        const fileErrorSpan = document.getElementById('fileError');
        fileDisplay.addEventListener('click', () => fileInput.click());
        fileInput.addEventListener('change', () => {
            fileErrorSpan.textContent = '';
            if (fileInput.files.length > 0) {
                const file = fileInput.files[0];
                if (file.size > MAX_FILE_SIZE_BYTES) {
                    fileErrorSpan.textContent = `ขนาดไฟล์ต้องไม่เกิน ${MAX_FILE_SIZE_MB}MB`;
                    fileInput.value = ''; 
                    return;
                }
                fileNameSpan.textContent = file.name;
                fileNameSpan.classList.remove('placeholder');
                updateFormData('resumeFilename', file.name);
            } else {
                fileNameSpan.textContent = 'ยังไม่ได้เลือกไฟล์';
                fileNameSpan.classList.add('placeholder');
            }
        });
    }
    
    // --- FORM SUBMISSION ---
    function setupFormSubmitListener() {
        form.addEventListener('submit', (e) => {
    e.preventDefault();
    showToast('บันทึกข้อมูลทั้งหมดเรียบร้อยแล้ว!');
    // หน่วงเวลาเล็กน้อยเพื่อให้ผู้ใช้เห็น Toast ก่อนเปลี่ยนหน้า
    setTimeout(() => {
        window.location.href = 'dashboard.html';
    }, 1500); 
});
    }

    // --- Toast Notification Function ---
function showToast(message, type = 'success') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;

    container.appendChild(toast);

    // Auto-remove toast after 3 seconds
    setTimeout(() => {
        toast.style.animation = 'fadeOut 0.5s ease-out forwards';
        setTimeout(() => toast.remove(), 500);
    }, 3000);
}

    // --- START THE APP ---
    init();
});