document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('skilldexEditForm');
    const navItems = document.querySelectorAll('.skilldex-nav-item');
    const APP_STORAGE_KEY = 'skilldexFormData';
    let formData = {};
    let cachedJsonData = {};

    // --- INITIALIZATION ---
    async function init() {
        loadDataFromStorage();
        await setupAllComponents(); // รอให้สร้าง UI เสร็จก่อน
        populateForm(); // ค่อยเติมข้อมูล
        setupAllListeners(); // แล้วค่อยติดตั้ง Listener ทั้งหมด
        restoreUiState(); // สุดท้ายคือเรียกคืนสถานะการแสดงผล
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

    // --- UI COMPONENT SETUP (เหมือน form.js) ---
    async function fetchJsonData(componentName) {
        if (cachedJsonData[componentName]) return cachedJsonData[componentName];
        try {
            const response = await fetch(`./components/${componentName}.json`);
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            const data = await response.json();
            cachedJsonData[componentName] = data;
            return data;
        } catch (error) {
            console.error(`Could not fetch ${componentName}:`, error);
            return [];
        }
    }

    async function setupAllComponents() {
        const hardSkillsContainer = document.getElementById('hardSkillsContainer');
        if (hardSkillsContainer) {
            const skills = await fetchJsonData('hard_skills');
            skills.forEach(skill => {
                hardSkillsContainer.appendChild(createSkillLevelComponent(skill.value));
            });
        }
        document.querySelectorAll('.skilldex-tag-container').forEach(setupTagInput);
    }

    function createSkillLevelComponent(skillName) {
        const container = document.createElement('div');
        container.className = 'skill-level-item';
        const label = document.createElement('label');
        label.textContent = skillName;
        container.appendChild(label);
        const select = document.createElement('select');
        select.dataset.skillName = skillName;
        const options = [
            { value: '0', text: 'พื้นฐาน' },
            { value: '1', text: 'ใช้งานได้' },
            { value: '2', text: 'เชี่ยวชาญ' }
        ];
        const placeholder = document.createElement('option');
        placeholder.value = "";
        placeholder.textContent = "-- เลือกระดับ --";
        placeholder.disabled = true;
        placeholder.selected = true;
        select.appendChild(placeholder);
        options.forEach(opt => {
            const option = document.createElement('option');
            option.value = opt.value;
            option.textContent = opt.text;
            select.appendChild(option);
        });
        container.appendChild(select);
        return container;
    }

    function setupTagInput(container) {
        const input = container.querySelector('input');
        const limit = parseInt(container.dataset.limit, 10) || Infinity;

        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && input.value.trim() !== '') {
                e.preventDefault();
                const currentTags = container.querySelectorAll('.skilldex-tag').length;
                if (currentTags < limit) {
                    addTag(input.value.trim(), container);
                    input.value = '';
                    updateTagData(container);
                }
            }
        });
    }

    function addTag(text, container) {
        const existingTags = Array.from(container.querySelectorAll('.skilldex-tag')).map(t => t.textContent.replace('×', '').trim());
        if (existingTags.includes(text)) return;
        
        const tag = document.createElement('span');
        tag.className = 'skilldex-tag';
        tag.textContent = text;
        const closeBtn = document.createElement('button');
        closeBtn.innerHTML = '&times;';
        closeBtn.type = 'button';
        closeBtn.onclick = () => {
            tag.remove();
            updateTagData(container);
        };
        tag.appendChild(closeBtn);
        container.insertBefore(tag, container.querySelector('input'));
    }

    function updateTagData(container) {
        const key = container.querySelector('input').name;
        const tags = Array.from(container.querySelectorAll('.skilldex-tag')).map(t => t.textContent.replace('×', '').trim());
        const limit = parseInt(container.dataset.limit, 10);
        updateFormData(key, limit === 1 ? (tags[0] || "") : tags);
    }

    // --- FORM POPULATION (ฉบับแก้ไข Error) ---
    function populateForm() {
        for (const key in formData) {
            const value = formData[key];
            if (!value) continue;

            if (key === 'skillLevels' && typeof value === 'object') {
                for (const skillName in value) {
                    const level = value[skillName].level;
                    const select = form.querySelector(`[data-skill-name="${skillName}"]`);
                    if (select) select.value = level;
                }
            } else {
                const elements = form.querySelectorAll(`[name="${key}"]`);
                if (elements.length === 0) continue; // **จุดแก้ไขสำคัญ: ถ้าไม่เจอ element ให้ข้ามไปเลย**

                const el = elements[0];
                if (el.closest('.skilldex-tag-container')) {
                     // สำหรับ Tag Input เราจะจัดการแยกต่างหาก
                    const container = el.closest('.skilldex-tag-container');
                    const values = Array.isArray(value) ? value : [value];
                    values.forEach(val => addTag(val, container));
                } else if (el.type === 'radio') {
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
        }
    }

    // --- EVENT LISTENERS ---
    function setupAllListeners() {
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

        navItems.forEach(item => {
            item.addEventListener('click', () => {
                document.getElementById(item.dataset.target).scrollIntoView({ behavior: 'smooth' });
                navItems.forEach(nav => nav.classList.remove('active'));
                item.classList.add('active');
            });
        });

        form.addEventListener('submit', (e) => {
            e.preventDefault();
            alert('บันทึกข้อมูลเรียบร้อยแล้ว!');
            window.location.href = 'dashboard.html';
        });
    }

    // --- CONDITIONAL UI LOGIC ---
    function setupConditionalListeners() {
        form.addEventListener('change', (e) => {
            if (e.target.name === 'currentStatus') {
                const status = e.target.value;
                document.getElementById('studentFields').classList.toggle('hidden', status !== 'student');
            }
            if (e.target.name === 'careerClarity') {
                const clarity = e.target.value;
                document.getElementById('careerGoalFields').classList.toggle('hidden', clarity === 'C');
                document.getElementById('careerExploreFields').classList.toggle('hidden', clarity !== 'C');
            }
        });
    }

    function restoreUiState() {
        const checkedRadios = form.querySelectorAll('input[type="radio"]:checked');
        checkedRadios.forEach(radio => {
            radio.dispatchEvent(new Event('change', { bubbles: true }));
        });
    }
    
    function setupLimitListeners() {
        document.querySelectorAll('[data-limit]').forEach(container => {
            const limit = parseInt(container.dataset.limit, 10);
            const checkboxes = container.querySelectorAll('input[type="checkbox"]');
            checkboxes.forEach(checkbox => {
                checkbox.addEventListener('change', () => {
                    const checkedCount = container.querySelectorAll('input[type="checkbox"]:checked').length;
                    if (checkedCount >= limit) {
                        checkboxes.forEach(cb => {
                            if (!cb.checked) cb.disabled = true;
                        });
                    } else {
                        checkboxes.forEach(cb => {
                            cb.disabled = false;
                        });
                    }
                });
                // Trigger initial check
                if (checkbox.checked) checkbox.dispatchEvent(new Event('change'));
            });
        });
    }

    // --- START THE APP ---
    init();
});