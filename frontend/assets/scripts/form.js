document.addEventListener('DOMContentLoaded', () => {

    // --- STATE MANAGEMENT & CORE VARIABLES ---
    const form = document.getElementById('skilldexForm');
    const sections = document.querySelectorAll('form > section');
    const progressBar = document.getElementById('progressBar');
    const pageOrder = Array.from(sections).map(s => s.id);
    const APP_STORAGE_KEY = 'skilldexFormData';
    const MAX_FILE_SIZE_MB = 5;
    const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;
    let formData = {};
    let cachedJsonData = {}; 

    // --- INITIALIZATION ---
    function init() {
        loadDataFromStorage();
        setupNavigationListeners();
        setupConditionalListeners();
        setupInputListeners();
        setupAllComponents();
        setupLimitListeners();
        setupFileUploadListeners(); 
        setupFormSubmitListener();
        
        restoreUiState();

        const lastSection = formData.lastVisitedSection || pageOrder[0];
        showSection(lastSection, true); 
    }

    // --- UI STATE RESTORATION ---
    function restoreUiState() {
        if (formData.currentStatus) {
            const status = formData.currentStatus;
            document.getElementById('studentFields').classList.toggle('hidden', status !== 'student');
            const isEmployee = status === 'employee' || status === 'freelance';
            document.getElementById('employeeFields').classList.toggle('hidden', !isEmployee);
        }

        if (formData.careerClarity) {
            const clarity = formData.careerClarity;
            document.getElementById('setA').classList.toggle('hidden', clarity !== 'A');
            document.getElementById('setB').classList.toggle('hidden', clarity !== 'B');
            document.getElementById('setC').classList.toggle('hidden', clarity !== 'C');
        }

        if (formData.careerGoal) {
            document.getElementById('careerGoalOther').classList.toggle('hidden', formData.careerGoal !== 'other');
        }

        // <-- ADDED: Restore file UI state -->
        document.querySelectorAll('input[type="file"]').forEach(fileInput => {
            updateFileInputUI(fileInput);
        });
    }

    // --- DATA HANDLING (LOCALSTORAGE) ---
    function saveDataToStorage() {
        const currentVisibleSection = pageOrder.find(id => !document.getElementById(id).classList.contains('hidden'));
        formData.lastVisitedSection = currentVisibleSection;
        try {
            localStorage.setItem(APP_STORAGE_KEY, JSON.stringify(formData));
        } catch (e) {
            console.error("Error saving to localStorage:", e);
            alert(`เกิดข้อผิดพลาดในการบันทึกข้อมูล อาจเป็นเพราะไฟล์ที่อัปโหลดมีขนาดใหญ่เกินไป (${MAX_FILE_SIZE_MB}MB)`);
        }
    }

    function loadDataFromStorage() {
        const savedData = localStorage.getItem(APP_STORAGE_KEY);
        if (savedData) {
            formData = JSON.parse(savedData);
            populateForm();
        }
    }

    function populateForm() {
        Object.keys(formData).forEach(key => {
            // Skip file data for now, will be handled by restoreUiState
            if (key.startsWith('file-')) {
                return;
            }

            if (key.startsWith('tags-')) {
                const containerId = key.replace('tags-', '');
                const formGroup = document.getElementById(containerId);
                if (formGroup) {
                    const container = formGroup.querySelector('.skilldex-tag-container');
                     if (container && Array.isArray(formData[key])) {
                        container.querySelectorAll('.skilldex-tag').forEach(tag => tag.remove());
                        formData[key].forEach(tagText => addTag(tagText, container));
                    }
                }
                return;
            }

            const element = form.elements[key];
            if (element) {
                if (element.length && element[0].type === 'radio') {
                    const valueToSelect = formData[key];
                    const radioToSelect = Array.from(element).find(radio => radio.value === valueToSelect);
                    if (radioToSelect) radioToSelect.checked = true;
                } 
                else if (element.length && element[0].type === 'checkbox') {
                    const valuesToSelect = formData[key] || [];
                    element.forEach(checkbox => {
                        checkbox.checked = valuesToSelect.includes(checkbox.value);
                    });
                }
                else {
                    element.value = formData[key];
                }
            } 
        });
        
        if (formData.skillLevels) {
            Object.entries(formData.skillLevels).forEach(([skillName, data]) => {
                const container = document.querySelector('.skilldex-tag-container[data-source="skills.json"]');
                if (container) {
                    // Check if tag doesn't exist before adding
                    const existingTags = Array.from(container.querySelectorAll('.skilldex-tag')).map(t => t.textContent.replace('×','').trim());
                    if (!existingTags.includes(skillName)) {
                       addTag(skillName, container);
                    }
                    const radio = document.querySelector(`input[name="skill-level-${skillName.toLowerCase().replace(/\s+/g, '-')}"][value="${data.level}"]`);
                    if (radio) {
                        radio.checked = true;
                    }
                }
            });
        }
    }

    function updateFormData(key, value) {
        formData[key] = value;
        saveDataToStorage();
    }
    
    // --- NEW: FILE HANDLING ---
    function setupFileUploadListeners() {
        document.querySelectorAll('input[type="file"]').forEach(input => {
            input.addEventListener('change', (e) => handleFileSelect(e));
        });
    }

    function handleFileSelect(event) {
        const fileInput = event.target;
        const file = fileInput.files[0];
        const inputName = fileInput.name;

        if (!file) {
            // Clear file data if user cancels selection
            delete formData[`file-data-${inputName}`];
            delete formData[`file-name-${inputName}`];
            saveDataToStorage();
            updateFileInputUI(fileInput);
            return;
        }

        if (file.size > MAX_FILE_SIZE_BYTES) {
            alert(`ไฟล์มีขนาดใหญ่เกิน ${MAX_FILE_SIZE_MB}MB กรุณาเลือกไฟล์อื่น`);
            fileInput.value = ''; // Reset the input
            return;
        }

        const reader = new FileReader();
        reader.onload = function(loadEvent) {
            // Store file as Base64 string
            updateFormData(`file-data-${inputName}`, loadEvent.target.result);
            updateFormData(`file-name-${inputName}`, file.name);
            updateFileInputUI(fileInput);
        };
        reader.onerror = function() {
            console.error("Error reading file");
            alert("ไม่สามารถอ่านไฟล์ได้ กรุณาลองใหม่");
        };
        reader.readAsDataURL(file); // Read file as Base64
    }

    function updateFileInputUI(fileInput) {
        const inputName = fileInput.name;
        const savedFileName = formData[`file-name-${inputName}`];
        const formGroup = fileInput.closest('.skilldex-form-group');

        let uiContainer = formGroup.querySelector('.file-upload-ui');
        if (!uiContainer) {
            uiContainer = document.createElement('div');
            uiContainer.className = 'file-upload-ui';
            fileInput.insertAdjacentElement('afterend', uiContainer);
        }

        if (savedFileName) {
            fileInput.style.display = 'none';
            uiContainer.innerHTML = `
                <div class="file-info">
                    <span class="file-name">${savedFileName}</span>
                    <button type="button" class="file-remove-btn" data-input-name="${inputName}">&times;</button>
                </div>
            `;
            uiContainer.querySelector('.file-remove-btn').addEventListener('click', () => {
                delete formData[`file-data-${inputName}`];
                delete formData[`file-name-${inputName}`];
                saveDataToStorage();
                fileInput.value = ''; // Reset the actual input
                updateFileInputUI(fileInput);
            });
        } else {
            fileInput.style.display = 'block';
            // uiContainer.innerHTML = `<p class="skilldex-input-description">จำกัดไฟล์ PDF ขนาดไม่เกิน ${MAX_FILE_SIZE_MB}MB</p>`;
        }
    }


    // --- NAVIGATION ---
    function setupNavigationListeners() {
        form.addEventListener('click', (e) => {
            const target = e.target.closest('button');
            if (!target || target.type === 'submit') return;

            const nextSectionId = target.dataset.next;
            const backSectionId = target.dataset.back;

            if (nextSectionId) {
                const currentSection = target.closest('section');
                if (validateSection(currentSection)) {
                    showSection(nextSectionId);
                }
            } else if (backSectionId) {
                showSection(backSectionId);
            }
        });
    }

    function showSection(sectionId, isInitialLoad = false) {
        sections.forEach(section => section.classList.add('hidden'));
        const sectionToShow = document.getElementById(sectionId);
        if(sectionToShow) sectionToShow.classList.remove('hidden');
        updateProgressBar(isInitialLoad);
        saveDataToStorage();
    }
    
    function updateProgressBar(isInitialLoad) {
        const currentVisibleSectionId = pageOrder.find(id => !document.getElementById(id).classList.contains('hidden'));
        let currentIndex = pageOrder.indexOf(currentVisibleSectionId);
        if (currentIndex < 0) currentIndex = 0;
        
        let progressPercent = 0;
        if (currentIndex > 0 && currentIndex < pageOrder.length - 1) {
             progressPercent = ((currentIndex) / (pageOrder.length - 2)) * 100;
        } else if (currentIndex >= pageOrder.length - 2) {
            progressPercent = 100;
        }

        progressBar.style.width = `${progressPercent}%`;
        progressBar.textContent = `${Math.round(progressPercent)}%`;
        if(!isInitialLoad) progressBar.style.transition = 'width 0.4s ease-in-out';
    }
    
    // --- GENERIC INPUT LISTENERS ---
    function setupInputListeners() {
        form.addEventListener('change', (e) => {
            const target = e.target;
             // Skip file inputs, they are handled separately
            if (target.type === 'file') return;

            if (target.name) {
                if (target.type === 'checkbox') {
                    const checkedValues = Array.from(form.elements[target.name])
                        .filter(cb => cb.checked)
                        .map(cb => cb.value);
                    updateFormData(target.name, checkedValues);
                } else {
                    updateFormData(target.name, target.value);
                }
            }
        });
        
        form.addEventListener('input', (e) => {
            const target = e.target;
            if((target.type === 'text' || target.type === 'email' || target.tagName === 'TEXTAREA') && target.name) {
                updateFormData(target.name, target.value);
            }
            if (target.classList.contains('required')) {
                target.classList.remove('input-error'); // Remove red border on input
                const formGroup = target.closest('.skilldex-form-group');
                if(formGroup) {
                    const errorMessage = formGroup.querySelector('.validation-message');
                    if (errorMessage) errorMessage.style.display = 'none';
                }
            }
        });
    }

    // --- CONDITIONAL LOGIC ---
    function setupConditionalListeners() {
        const statusSelect = document.getElementById('currentStatus');
        statusSelect.addEventListener('change', () => {
            const value = statusSelect.value;
            document.getElementById('studentFields').classList.toggle('hidden', value !== 'student');
            const isEmployee = value === 'employee' || value === 'freelance';
            document.getElementById('employeeFields').classList.toggle('hidden', !isEmployee);
        });

        document.querySelectorAll('input[name="careerClarity"]').forEach(radio => {
            radio.addEventListener('change', () => {
                const value = radio.value;
                document.getElementById('setA').classList.toggle('hidden', value !== 'A');
                document.getElementById('setB').classList.toggle('hidden', value !== 'B');
                document.getElementById('setC').classList.toggle('hidden', value !== 'C');
            });
        });
        
        document.getElementById('careerGoal').addEventListener('change', (e) => {
            document.getElementById('careerGoalOther').classList.toggle('hidden', e.target.value !== 'other');
        });
    }

    // --- CUSTOM COMPONENTS (AUTOCOMPLETE & TAGS) ---
    async function fetchJsonData(src) {
        if (cachedJsonData[src]) return cachedJsonData[src];
        try {
            const response = await fetch(`assets/data/${src}`);
            if(!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            const data = await response.json();
            cachedJsonData[src] = data;
            return data;
        } catch (error) {
            console.error('Error fetching JSON data:', error);
            return [];
        }
    }

    function setupAllComponents() {
        document.querySelectorAll('.skilldex-autocomplete-container').forEach(setupAutocomplete);
        document.querySelectorAll('.skilldex-tag-container').forEach(setupTagInput);
    }

    function setupAutocomplete(container) {
        const input = container.querySelector('input[type="text"]');
        const suggestionsBox = container.querySelector('.skilldex-autocomplete-suggestions');
        const dataSource = input.dataset.source;

        if (!input || !suggestionsBox || !dataSource) return;

        input.addEventListener('input', async () => {
            const query = input.value.toLowerCase();
            if (!query) {
                suggestionsBox.innerHTML = '';
                suggestionsBox.classList.add('hidden');
                return;
            }
            
            const data = await fetchJsonData(dataSource);
            const suggestions = data
                .filter(item => item.name.toLowerCase().includes(query))
                .slice(0, 10); 

            suggestionsBox.innerHTML = '';
            if (suggestions.length > 0) {
                suggestions.forEach(item => {
                    const div = document.createElement('div');
                    div.textContent = item.name;
                    div.addEventListener('click', () => {
                        input.value = item.name;
                        input.dispatchEvent(new Event('input', { bubbles: true }));
                        input.dispatchEvent(new Event('change', { bubbles: true }));
                        suggestionsBox.classList.add('hidden');
                    });
                    suggestionsBox.appendChild(div);
                });
                suggestionsBox.classList.remove('hidden');
            } else {
                suggestionsBox.classList.add('hidden');
            }
        });

        document.addEventListener('click', (e) => {
            if (!container.contains(e.target)) {
                suggestionsBox.classList.add('hidden');
            }
        });
    }
    
    function setupTagInput(container) {
        const input = container.querySelector('input[type="text"]');
        const dataSource = container.dataset.source;
        const formGroup = container.closest('.skilldex-form-group');

        if (!input || !formGroup) return;

        let suggestionsBox = formGroup.querySelector('.skilldex-autocomplete-suggestions');
        if (!suggestionsBox) {
            suggestionsBox = document.createElement('div');
            suggestionsBox.className = 'skilldex-autocomplete-suggestions hidden';
            formGroup.appendChild(suggestionsBox);
        }

        input.addEventListener('input', async () => {
            const query = input.value.toLowerCase();
            if (!query || !dataSource) {
                suggestionsBox.classList.add('hidden');
                return;
            }
            const existingTags = Array.from(container.querySelectorAll('.skilldex-tag')).map(t => t.textContent.replace('×','').trim());
            const data = await fetchJsonData(dataSource);
            const suggestions = data
                .map(item => item.name)
                .filter(name => name.toLowerCase().includes(query) && !existingTags.includes(name));

            suggestionsBox.innerHTML = '';
            if (suggestions.length > 0) {
                 suggestions.forEach(suggestionText => {
                    const div = document.createElement('div');
                    div.textContent = suggestionText;
                    div.addEventListener('click', () => {
                        addTag(suggestionText, container);
                        input.value = '';
                        suggestionsBox.classList.add('hidden');
                        input.focus();
                    });
                    suggestionsBox.appendChild(div);
                });
                suggestionsBox.classList.remove('hidden');
            } else {
                suggestionsBox.classList.add('hidden');
            }
        });
        
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ',') {
                e.preventDefault();
                const text = input.value.trim();
                if (text) {
                    addTag(text, container);
                    input.value = '';
                    suggestionsBox.classList.add('hidden');
                }
            }
        });
        
        document.addEventListener('click', (e) => {
            if (!formGroup.contains(e.target)) {
                 suggestionsBox.classList.add('hidden');
            }
        });
    }

    function addTag(text, container) {
        const existingTags = Array.from(container.querySelectorAll('.skilldex-tag'))
            .map(t => t.textContent.replace('×','').trim().toLowerCase());
        if (existingTags.includes(text.toLowerCase())) return;

        container.classList.remove('input-error');

        const maxTags = parseInt(container.dataset.maxTags, 10);
        const currentTags = container.querySelectorAll('.skilldex-tag').length;

        if (!isNaN(maxTags) && currentTags >= maxTags) {
            const errorMsg = container.closest('.skilldex-form-group').querySelector('.skilldex-error-message:not(.validation-message)');
            if(errorMsg) {
                errorMsg.classList.remove('hidden');
                setTimeout(() => errorMsg.classList.add('hidden'), 2000);
            }
            return;
        }

        const tag = document.createElement('span');
        tag.className = 'skilldex-tag';
        tag.textContent = text;

        const closeBtn = document.createElement('button');
        closeBtn.innerHTML = '&times;';
        closeBtn.type = 'button';
        closeBtn.addEventListener('click', () => {
            const skillName = tag.textContent.replace('×','').trim();
            tag.remove();
            
            const skillLevelsContainer = container.closest('.skilldex-form-group').querySelector('.skilldex-skill-levels');
            const skillItem = skillLevelsContainer?.querySelector(`[data-skill="${skillName}"]`);
            if (skillItem) {
                skillItem.remove();
            }

            if (formData.skillLevels && formData.skillLevels[skillName]) {
                delete formData.skillLevels[skillName];
            }
            
            updateTagData(container);
        });

        tag.appendChild(closeBtn);
        container.insertBefore(tag, container.querySelector('input'));
        
        const formGroup = container.closest('.skilldex-form-group');
        if (formGroup.querySelector('.skilldex-skill-levels')) {
            addSkillLevelItem(text, formGroup);
        }
        
        updateTagData(container);
    }
    
    function updateTagData(container) {
        const formGroupId = container.closest('.skilldex-form-group').id;
        if (!formGroupId) return;

        // เก็บข้อมูล tags ทั้งหมดจาก container
        const tags = Array.from(container.querySelectorAll('.skilldex-tag'))
            .map(t => t.textContent.replace('×', '').trim());

        // ถ้าเป็น interestedProfessions ให้เก็บโดยตรงไม่ต้องมี prefix tags-
        if (formGroupId === 'interestedProfessions') {
            updateFormData('interestedProfessions', tags);
        } else {
            const key = `tags-${formGroupId}`;
            updateFormData(key, tags);
        }
    }

    function addSkillLevelItem(skillName, formGroup) {
        const skillLevels = formGroup.querySelector('.skilldex-skill-levels');
        const skillItem = document.createElement('div');
        skillItem.className = 'skilldex-skill-level-item';
        skillItem.dataset.skill = skillName;
        
        const levels = ['พื้นฐาน', 'พอใช้ได้', 'เชี่ยวชาญ'];
        const radioName = `skill-level-${skillName.toLowerCase().replace(/\s+/g, '-')}`;
        
        skillItem.innerHTML = `
            <div class="skilldex-skill-name">${skillName}:</div>
            <div class="skilldex-skill-radios">
                ${levels.map((level, i) => `
                    <label class="skilldex-skill-radio-label">
                        <input type="radio" 
                               name="${radioName}" 
                               value="${i}"
                               class="skilldex-skill-radio required"
                               required>
                        ${level}
                    </label>
                `).join('')}
            </div>
        `;

        skillItem.querySelectorAll('input[type="radio"]').forEach(radio => {
            radio.addEventListener('change', () => {
                const skillData = {
                    name: skillName,
                    level: radio.value
                };
                updateSkillLevel(skillName, skillData);
            });
        });

        skillLevels.appendChild(skillItem);
    }

    function updateSkillLevel(skillName, skillData) {
        if (!formData.skillLevels) {
            formData.skillLevels = {};
        }
        formData.skillLevels[skillName] = skillData;
        saveDataToStorage();
    }

    // --- VALIDATION ---
    function setupLimitListeners() {
        document.querySelectorAll('[data-max-select]').forEach(group => {
            const max = parseInt(group.dataset.maxSelect, 10);
            const checkboxes = group.querySelectorAll('input[type="checkbox"]');
            const errorMsg = group.querySelector('.skilldex-error-message:not(.validation-message)');

            checkboxes.forEach(cb => {
                cb.addEventListener('change', () => {
                    const checkedCount = Array.from(checkboxes).filter(c => c.checked).length;
                    if (checkedCount > max) {
                        cb.checked = false; 
                        updateFormData(cb.name, Array.from(checkboxes).filter(c => c.checked).map(c => c.value));
                        if(errorMsg) {
                            errorMsg.classList.remove('hidden');
                            setTimeout(() => errorMsg.classList.add('hidden'), 2000);
                        }
                    }
                });
            });
        });
    }

    function validateSection(section) {
        let isSectionValid = true;
        const requiredFields = section.querySelectorAll('.required');
        const checkedGroups = new Set();
    
        requiredFields.forEach(field => {
            if (field.offsetParent === null) return;
    
            const formGroup = field.closest('.skilldex-form-group, .skilldex-card-select-group');
            const errorMessage = formGroup ? formGroup.querySelector('.validation-message') : null;
            let fieldIsValid = true;
            let elementToStyle = field; 
    
            if (field.type === 'radio' || field.type === 'checkbox') {
                const groupName = field.name;
                const container = field.closest('[data-min-select="1"], .skilldex-card-select-group, .skilldex-form-group');
                if (checkedGroups.has(groupName)) return;
                
                const checked = section.querySelector(`input[name="${groupName}"]:checked`);
                fieldIsValid = checked !== null;
                checkedGroups.add(groupName);
                elementToStyle = container;
            } else if (field.classList.contains('skilldex-tag-container')) {
                 const minTags = parseInt(field.dataset.minTags, 10) || 1;
                 fieldIsValid = field.querySelectorAll('.skilldex-tag').length >= minTags;
                 elementToStyle = field;
            } else {
                if (typeof field.value === 'string') {
                    if (!field.value.trim()) {
                        fieldIsValid = false;
                    } else if (field.pattern && !new RegExp(field.pattern).test(field.value)) {
                        fieldIsValid = false;
                    }
                }
            }
    
            if (!fieldIsValid) {
                isSectionValid = false;
                if (errorMessage) {
                    errorMessage.textContent = field.pattern ? 'รูปแบบอีเมลไม่ถูกต้อง' : 'กรุณากรอกข้อมูล';
                    errorMessage.style.display = 'block';
                }
                elementToStyle.classList.add('input-error');
            } else {
                if (errorMessage) {
                    errorMessage.style.display = 'none';
                }
                elementToStyle.classList.remove('input-error');
                if(elementToStyle.parentElement.classList.contains('input-error')) {
                    elementToStyle.parentElement.classList.remove('input-error');
                }
            }
        });
    
        // เพิ่มเงื่อนไขใน validateSection function
        if (section.id === 'sectionExplorePlan' && formData.careerClarity === 'B') {
            const profContainer = document.querySelector('#interestedProfessions .skilldex-tag-container');
            if (profContainer && profContainer.querySelectorAll('.skilldex-tag').length === 0) {
                profContainer.classList.add('input-error');
                const errorMessage = profContainer.closest('.skilldex-form-group').querySelector('.validation-message');
                if (errorMessage) {
                    errorMessage.textContent = 'กรุณาระบุอย่างน้อย 1 อาชีพ';
                    errorMessage.style.display = 'block';
                }
                return false;
            }
        }
    
        return isSectionValid;
    }

    // --- FORM SUBMISSION ---
//     function setupFormSubmitListener() {
//         form.addEventListener('submit', async (e) => {
//             e.preventDefault();
            
//             const lastSection = document.getElementById('sectionSkillInventory');
//             if (!validateSection(lastSection)) {
//                 alert('กรุณากรอกข้อมูลที่จำเป็นให้ครบถ้วน');
//                 return;
//             }

//             const submitButton = e.target.querySelector('button[type="submit"]');
//             submitButton.disabled = true;
//             submitButton.textContent = 'กำลังเตรียมข้อมูล...';

//             try {
//                 // --- Step 1: Upload file if it exists ---
//                 const resumeInput = document.getElementById('resumeUpload');
//                 let uploadedFilename = null;

//                 if (resumeInput && resumeInput.files && resumeInput.files.length > 0) {
//                     const file = resumeInput.files[0];
//                     const fileFormData = new FormData();
//                     fileFormData.append('resumeUpload', file); // 'resumeUpload' ต้องตรงกับที่ server.js กำหนด

//                     const uploadResponse = await fetch('http://localhost:3000/api/upload', {
//                         method: 'POST',
//                         body: fileFormData,
//                     });

//                     const uploadResult = await uploadResponse.json();

//                     if (!uploadResponse.ok) {
//                         throw new Error(uploadResult.error || 'ไม่สามารถอัปโหลดไฟล์ได้');
//                     }
//                     uploadedFilename = uploadResult.filename; // เก็บชื่อไฟล์ที่อัปโหลดสำเร็จ
//                 }

//                 // --- Step 2: Submit all form data ---
//                 const finalData = { ...formData };
//                 if (uploadedFilename) {
//                     finalData.resumeFilename = uploadedFilename; // เพิ่มชื่อไฟล์ลงในข้อมูลที่จะส่ง
//                 }

//                 const analyzeResponse = await fetch('http://localhost:3000/api/analyze', {
//                     method: 'POST',
//                     headers: {
//                         'Content-Type': 'application/json',
//                     },
//                     body: JSON.stringify(finalData),
//                 });
                
//                 const analyzeResult = await analyzeResponse.json();

//                 if (!analyzeResponse.ok) {
//                      throw new Error(analyzeResult.error || 'เกิดข้อผิดพลาดในการส่งข้อมูล');
//                 }
                
//                 console.log('Backend response:', analyzeResult);
//                 showSection('pageComplete');

//             } catch (error) {
//     console.error('Submission Error:', error);
//     showToast(`เกิดข้อผิดพลาด: ${error.message}`, 'error'); // เปลี่ยน type เป็น 'error'
// } finally {
//                 submitButton.disabled = false;
//                 submitButton.textContent = 'ส่งข้อมูล';
//             }
//         });
//     }

// --- FORM SUBMISSION ---
    function setupFormSubmitListener() {
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            
            const lastSection = document.getElementById('sectionSkillInventory');
            if (!validateSection(lastSection)) {
                alert('กรุณากรอกข้อมูลที่จำเป็นให้ครบถ้วน');
                return;
            }

            const submitButton = e.target.querySelector('button[type="submit"]');
            submitButton.disabled = true;
            submitButton.textContent = 'กำลังบันทึกข้อมูล...';

            try {
                // บังคับให้บันทึกข้อมูลล่าสุดทั้งหมดลง localStorage
                // ก่อนที่จะเปลี่ยนหน้า เพื่อให้แน่ใจว่าข้อมูลครบถ้วนสมบูรณ์
                saveDataToStorage(); 

                // เปลี่ยนหน้าไปยัง dashboard.html
                window.location.href = 'dashboard.html'; 

            } catch (error) {
                console.error('Error during final process:', error);
                alert('เกิดข้อผิดพลาดบางอย่าง');
                
                // เปิดใช้งานปุ่มอีกครั้งหากมีข้อผิดพลาด
                submitButton.disabled = false;
                submitButton.textContent = 'ส่งข้อมูล';
            }
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