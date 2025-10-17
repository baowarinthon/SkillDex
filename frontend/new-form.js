document.addEventListener('DOMContentLoaded', () => {
    // --- CONFIG & STATE ---
    const form = document.getElementById('skilldex-form');
    const navLinks = document.querySelectorAll('.sidebar-nav .nav-link');
    const sections = document.querySelectorAll('.form-section');
    const APP_STORAGE_KEY = 'skilldexFormData';
    let formData = {};
    let cachedJsonData = {};

    // --- INITIALIZATION ---
    async function init() {
        loadDataFromStorage();
        await setupAllComponents();
        populateForm();
        setupAllListeners();
        restoreUiState();
        setupScrollSpy();
    }

    // --- DATA HANDLING ---
    const loadDataFromStorage = () => {
        const savedData = localStorage.getItem(APP_STORAGE_KEY);
        formData = savedData ? JSON.parse(savedData) : {};
    };
    const updateFormData = (key, value) => {
        formData[key] = value;
        localStorage.setItem(APP_STORAGE_KEY, JSON.stringify(formData));
    };

    // --- DYNAMIC COMPONENT SETUP ---
    const fetchJsonData = async (componentName) => {
        if (cachedJsonData[componentName]) return cachedJsonData[componentName];
        try {
            const response = await fetch(`./components/${componentName}.json`);
            const data = await response.json();
            // Adapt to { "name": "..." } structure
            const adaptedData = data.map(item => ({ label: item.name, value: item.name }));
            cachedJsonData[componentName] = adaptedData;
            return adaptedData;
        } catch (error) {
            console.error(`Could not fetch ${componentName}:`, error);
            return [];
        }
    };

    const setupAllComponents = async () => {
        await Promise.all([
            setupHardSkills(),
            setupSoftSkills(),
            setupTagInputs()
        ]);
    };

    const setupHardSkills = async () => {
        const container = document.getElementById('hardSkillsContainer');
        if (!container) return;
        const skills = await fetchJsonData('hard_skills');
        skills.forEach(skill => {
            const skillEl = document.createElement('div');
            skillEl.className = 'skill-item form-group';
            skillEl.innerHTML = `
                <label for="skill-${skill.value}">${skill.label}</label>
                <select id="skill-${skill.value}" data-skill-name="${skill.value}">
                    <option value="" disabled selected>-- เลือกระดับ --</option>
                    <option value="0">พื้นฐาน</option>
                    <option value="1">ใช้งานได้</option>
                    <option value="2">เชี่ยวชาญ</option>
                </select>
            `;
            container.appendChild(skillEl);
        });
    };

    const setupSoftSkills = async () => {
        const container = document.getElementById('softSkillsContainer');
        if (!container) return;
        const skills = await fetchJsonData('soft_skills'); // Assuming you have soft_skills.json
        skills.forEach(skill => {
            const skillEl = document.createElement('label');
            skillEl.innerHTML = `<input type="checkbox" name="softSkills" value="${skill.value}"><span>${skill.label}</span>`;
            container.appendChild(skillEl);
        });
    };
    
    const setupTagInputs = () => {
        document.querySelectorAll('.tag-container').forEach(container => {
            const input = container.querySelector('input');
            const limit = parseInt(container.dataset.limit, 10) || Infinity;
            input.addEventListener('keydown', e => {
                if (e.key === 'Enter' && input.value.trim()) {
                    e.preventDefault();
                    if (container.querySelectorAll('.tag').length < limit) {
                        addTag(input.value.trim(), container);
                        input.value = '';
                        updateTagData(container);
                    }
                }
            });
        });
    };
    
    const addTag = (text, container) => {
        const existing = Array.from(container.querySelectorAll('.tag')).map(t => t.textContent.replace('×', '').trim());
        if (existing.includes(text)) return;
        const tag = document.createElement('span');
        tag.className = 'tag';
        tag.textContent = text;
        const closeBtn = document.createElement('button');
        closeBtn.innerHTML = '&times;';
        closeBtn.type = 'button';
        closeBtn.onclick = () => { tag.remove(); updateTagData(container); };
        tag.appendChild(closeBtn);
        container.insertBefore(tag, container.querySelector('input'));
    };

    // --- FORM POPULATION ---
    const populateForm = () => {
        Object.keys(formData).forEach(key => {
            const value = formData[key];
            if (value === null || value === undefined) return;
            
            if (key === 'skillLevels') {
                Object.keys(value).forEach(skillName => {
                    const select = form.querySelector(`[data-skill-name="${skillName}"]`);
                    if (select) select.value = value[skillName].level;
                });
            } else if (key === 'targetProfession') {
                 const container = form.querySelector(`input[name="targetProfession"]`)?.closest('.tag-container');
                 if (container && value) addTag(value, container);
            } else {
                const elements = form.querySelectorAll(`[name="${key}"]`);
                if (elements.length === 0) return;
                
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
    };

    // --- EVENT LISTENERS ---
    const setupAllListeners = () => {
        // Auto-save on input
        form.addEventListener('input', e => {
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
            } else if (name && !target.closest('.tag-container')) {
                updateFormData(name, value);
            }
        });

        // Sidebar navigation click
        navLinks.forEach(link => {
            link.addEventListener('click', e => {
                e.preventDefault();
                document.querySelector(link.getAttribute('href')).scrollIntoView({ behavior: 'smooth' });
            });
        });

        // Form submission
        form.addEventListener('submit', e => {
            e.preventDefault();
            // In a real app, you would send formData to a server here.
            alert('ข้อมูลถูกบันทึกเรียบร้อย!');
            window.location.href = 'dashboard.html'; // Or another page
        });
        
        setupConditionalListeners();
        setupLimitListeners();
    };

    const updateTagData = (container) => {
        const key = container.querySelector('input').name;
        const tags = Array.from(container.querySelectorAll('.tag')).map(t => t.textContent.replace('×', '').trim());
        const limit = parseInt(container.dataset.limit, 10);
        updateFormData(key, limit === 1 ? (tags[0] || "") : tags);
    };

    // --- CONDITIONAL UI & SCROLLSPY ---
    const setupConditionalListeners = () => {
        form.addEventListener('change', e => {
            if (e.target.name === 'currentStatus') {
                document.getElementById('studentFields').classList.toggle('hidden', e.target.value !== 'student');
            }
            if (e.target.name === 'careerClarity') {
                document.getElementById('careerGoalFields').classList.toggle('hidden', e.target.value === 'C');
            }
        });
    };

    const restoreUiState = () => {
        form.querySelectorAll('input[type="radio"]:checked').forEach(radio => {
            radio.dispatchEvent(new Event('change', { bubbles: true }));
        });
    };
    
    const setupLimitListeners = () => {
        document.querySelectorAll('[data-limit]').forEach(container => {
            container.addEventListener('change', e => {
                 if(e.target.type !== 'checkbox') return;
                 const limit = parseInt(container.dataset.limit, 10);
                 const checked = container.querySelectorAll('input:checked').length;
                 const checkboxes = container.querySelectorAll('input[type="checkbox"]');
                 if (checked >= limit) {
                     checkboxes.forEach(cb => { if(!cb.checked) cb.disabled = true; });
                 } else {
                     checkboxes.forEach(cb => { cb.disabled = false; });
                 }
            });
        });
    };

    const setupScrollSpy = () => {
        const observer = new IntersectionObserver(entries => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    navLinks.forEach(link => {
                        link.classList.toggle('active', link.getAttribute('href') === `#${entry.target.id}`);
                    });
                }
            });
        }, { rootMargin: '-50% 0px -50% 0px' });
        sections.forEach(section => observer.observe(section));
    };

    // --- LET'S GO ---
    init();
});