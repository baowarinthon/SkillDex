document.addEventListener('DOMContentLoaded', () => {
    // --- STATE MANAGEMENT ---
    let currentPage = 1;
    let totalPages = 4;
    let clarityChoice = null; // To store user's choice from Page 2
    let formData = {}; // To collect all data

    // --- DATA PLACEHOLDERS ---
    let db = {
        universities: [],
        faculties: [],
        jobRoles: [],
        industries: [],
        softSkills: ["การสื่อสาร", "การทำงานเป็นทีม", "การแก้ปัญหา", "ความเป็นผู้นำ", "การปรับตัว", "ความคิดสร้างสรรค์", "การบริหารเวลา"]
    };

    // --- DOM ELEMENTS ---
    const form = document.getElementById('onboarding-form');
    const progressBar = document.getElementById('progress-bar');
    const pages = document.querySelectorAll('.form-page');
    const welcomeHeader = document.getElementById('welcome-header');

    // --- DATA FETCHING & INITIALIZATION ---
    fetch('/frontend/assets/data/formData.json')
        .then(response => response.json())
        .then(data => {
            db.universities = data.universities;
            db.faculties = data.facultiesFlat;
            db.jobRoles = data.jobRolesFlat;
            db.industries = data.industries;
            
            populateInitialUI();
            initializeAutocomplete();
            initializeEventListeners();

            // Start at page 1
            goToPage(1);
        })
        .catch(error => console.error("Error loading form data:", error));

    // --- UI POPULATION ---
    function populateInitialUI() {
        // Populate Industry Dropdown
        const industrySelect = document.getElementById('industry');
        db.industries.forEach(industry => {
            const option = document.createElement('option');
            option.value = industry;
            option.textContent = industry;
            industrySelect.appendChild(option);
        });

        // Populate Soft Skills Checkboxes
        const softSkillsContainer = document.getElementById('soft-skills-container');
        db.softSkills.forEach(skill => {
            const div = document.createElement('div');
            div.className = 'flex items-center';
            div.innerHTML = `
                <input id="soft-skill-${skill}" name="soft_skills" type="checkbox" value="${skill}" class="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500">
                <label for="soft-skill-${skill}" class="ml-2 text-sm font-medium text-gray-900">${skill}</label>
            `;
            softSkillsContainer.appendChild(div);
        });
    }

    // --- AUTOCOMPLETE INITIALIZATION ---
    function initializeAutocomplete() {
        const createAutoComplete = (selector, data, onSelection) => {
            new autoComplete({
                selector,
                placeHolder: "ค้นหา...",
                data: { src: data },
                resultItem: { highlight: true },
                events: {
                    input: {
                        selection: (event) => {
                            const selection = event.detail.selection.value;
                            document.querySelector(selector).value = selection;
                            if (onSelection) onSelection(selection);
                        }
                    }
                }
            });
        };
        createAutoComplete("#university", db.universities);
        createAutoComplete("#faculty", db.faculties);
        createAutoComplete("#current-role", db.jobRoles);
    }

    // --- EVENT LISTENERS ---
    function initializeEventListeners() {
        form.addEventListener('click', (e) => {
            if (e.target.matches('.next-btn')) {
                if(validatePage(currentPage)) {
                    if (currentPage === 1) welcomeHeader.classList.add('hidden');
                    goToPage(currentPage + 1);
                }
            }
            if (e.target.matches('.back-btn')) {
                goToPage(currentPage - 1);
            }
        });

        document.getElementById('current-status').addEventListener('change', handleStatusChange);
        
        document.querySelectorAll('input[name="clarity"]').forEach(radio => {
            radio.addEventListener('change', e => {
                clarityChoice = e.target.value;
            });
        });
        
        // Hard Skills Tag System
        const hardSkillsInput = document.getElementById('hard-skills');
        hardSkillsInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && hardSkillsInput.value.trim() !== '') {
                e.preventDefault();
                addHardSkillTag(hardSkillsInput.value.trim());
                hardSkillsInput.value = '';
            }
        });

        form.addEventListener('submit', handleFormSubmit);
    }

    function savePageData(pageNumber) {
        const page = document.getElementById(`page-${pageNumber}`);
        if (!page) return;

        const inputs = page.querySelectorAll('input, select, textarea');
        inputs.forEach(input => {
            const name = input.name;
            if (!name) return;

            if (input.type === 'checkbox') {
                if (!formData[name]) formData[name] = [];
                if (input.checked) {
                    if (!formData[name].includes(input.value)) {
                        formData[name].push(input.value);
                    }
                } else {
                    formData[name] = formData[name].filter(v => v !== input.value);
                }
            } else if (input.type === 'radio') {
                if (input.checked) {
                    formData[name] = input.value;
                }
            } else {
                formData[name] = input.value;
            }
        });
        console.log(`Saved data for page ${pageNumber}:`, formData);
    }

    /**
     * นำข้อมูลจาก formData object กลับมาใส่ในฟอร์ม
     * @param {number} pageNumber - หมายเลขหน้าที่ต้องการเรียกคืนข้อมูล
     */
    function restorePageData(pageNumber) {
        const page = document.getElementById(`page-${pageNumber}`);
        if (!page) return;

        const inputs = page.querySelectorAll('input, select, textarea');
        inputs.forEach(input => {
            const name = input.name;
            if (!name || !formData[name]) return;

            if (input.type === 'checkbox') {
                input.checked = formData[name].includes(input.value);
            } else if (input.type === 'radio') {
                input.checked = (formData[name] === input.value);
            } else {
                input.value = formData[name];
            }
        });
         console.log(`Restored data for page ${pageNumber}`);
    }
    
    // --- PAGE NAVIGATION ---
    function goToPage(pageNumber) {
        if (pageNumber < 1 || pageNumber > totalPages) return;

        // 1. บันทึกข้อมูลของหน้าปัจจุบัน *ก่อน* ที่จะเปลี่ยนหน้า
        savePageData(currentPage);

        currentPage = pageNumber;
        pages.forEach(p => p.classList.add('hidden'));
        const newPage = document.getElementById(`page-${pageNumber}`);
        newPage.classList.remove('hidden');
        
        const progress = ((pageNumber - 1) / (totalPages - 1)) * 100;
        progressBar.style.width = `${progress}%`;

        // 2. ถ้าเป็นหน้า 3 ให้สร้างเนื้อหาใหม่
        if (pageNumber === 3) {
            renderPage3Content();
        } else {
            // 3. สำหรับหน้าอื่นๆ ให้เรียกคืนข้อมูลได้เลย
            restorePageData(pageNumber);
        }
    }
    
    // --- DYNAMIC LOGIC ---
    function handleStatusChange(e) {
        const value = e.target.value;
        document.getElementById('student-info').classList.toggle('hidden', value !== 'student');
        document.getElementById('worker-info').classList.toggle('hidden', !['employed', 'freelance'].includes(value));
    }

    function renderPage3Content() {
        const container = document.getElementById('page-3-content-container');
        let content = '';
        // ... (โค้ด switch case ของคุณเหมือนเดิม) ...
        switch(clarityChoice) {
            
            // --- CASE A: สำหรับผู้ที่ยังไม่แน่ใจ ---
            case 'A':
                content = `
                    <div class="text-center mb-6">
                        <p class="text-gray-500 mt-1">ไม่ต้องกังวลครับ ลองตอบคำถามเหล่านี้จากความรู้สึกของคุณ<br>เพื่อให้เราช่วยคุณค้นหาแนวทางที่น่าสนใจ</p>
                    </div>
                    <fieldset class="space-y-8">
                        
                        <div>
                            <label class="block mb-2 text-sm font-medium text-gray-900">เลือกกิจกรรมที่คุณชอบทำ หรือรู้สึกว่าทำได้ดี (เลือกได้สูงสุด 5 อย่าง)</label>
                            <input type="text" id="activities-input" class="form-input" placeholder="พิมพ์กิจกรรมแล้วกด Enter...">
                            <div id="activities-tags" class="mt-2 flex flex-wrap gap-2"></div>
                        </div>

                        <div>
                            <label class="block mb-2 text-sm font-medium text-gray-900">คุณชอบสภาพแวดล้อมการทำงานแบบไหน?</label>
                            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
                                <div class="space-y-2 p-4 border rounded-lg">
                                    <h4 class="font-semibold">การทำงานร่วมกับคนอื่น</h4>
                                    <label class="flex items-center"><input type="radio" name="work_collaboration" value="team" class="mr-2"> ทำงานเป็นทีม</label>
                                    <label class="flex items-center"><input type="radio" name="work_collaboration" value="solo" class="mr-2"> เน้นทำคนเดียว</label>
                                </div>
                                <div class="space-y-2 p-4 border rounded-lg">
                                    <h4 class="font-semibold">ความแน่นอนของงาน</h4>
                                    <label class="flex items-center"><input type="radio" name="work_certainty" value="structured" class="mr-2"> มีขั้นตอนชัดเจน</label>
                                    <label class="flex items-center"><input type="radio" name="work_certainty" value="dynamic" class="mr-2"> แก้ปัญหาใหม่ๆ ตลอด</label>
                                </div>
                            </div>
                        </div>

                        <div>
                            <label class="block mb-2 text-sm font-medium text-gray-900">อะไรคือ 3 สิ่งที่คุณให้ความสำคัญที่สุดในการทำงาน? (เลือก 3 ข้อ)</label>
                            <div id="work-values-container" class="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-2">
                                <label class="flex items-center p-3 border rounded-lg hover:bg-gray-50"><input type="checkbox" name="work_values" value="income" class="mr-2">รายได้สูง</label>
                                <label class="flex items-center p-3 border rounded-lg hover:bg-gray-50"><input type="checkbox" name="work_values" value="security" class="mr-2">ความมั่นคง</label>
                                <label class="flex items-center p-3 border rounded-lg hover:bg-gray-50"><input type="checkbox" name="work_values" value="growth" class="mr-2">โอกาสเติบโต</label>
                                <label class="flex items-center p-3 border rounded-lg hover:bg-gray-50"><input type="checkbox" name="work_values" value="balance" class="mr-2">Work-Life Balance</label>
                                <label class="flex items-center p-3 border rounded-lg hover:bg-gray-50"><input type="checkbox" name="work_values" value="impact" class="mr-2">สร้างผลกระทบ</label>
                                <label class="flex items-center p-3 border rounded-lg hover:bg-gray-50"><input type="checkbox" name="work_values" value="learning" class="mr-2">การเรียนรู้</label>
                            </div>
                        </div>

                    </fieldset>
                `;
                break;

            // --- CASE B: สำหรับผู้ที่สนใจหลายอย่าง ---
            case 'B':
                content = `
                    <div class="text-center mb-6">
                        <p class="text-gray-500 mt-1">การมีตัวเลือกเป็นสิ่งที่ดีครับ ให้ข้อมูลกับเราอีกนิด<br>เพื่อช่วยให้คุณตัดสินใจได้ง่ายขึ้น</p>
                    </div>
                    <fieldset class="space-y-8">
                        
                        <div>
                            <label for="interested-careers-input" class="block mb-2 text-sm font-medium text-gray-900">ระบุสายอาชีพที่คุณสนใจ (เลือกได้หลายข้อ)</label>
                            <input type="text" id="interested-careers-input" class="form-input" placeholder="พิมพ์ชื่ออาชีพ เช่น Data Scientist...">
                            <div id="interested-careers-tags" class="mt-2 flex flex-wrap gap-2"></div>
                        </div>

                        <div>
                            <label class="block mb-2 text-sm font-medium text-gray-900">ต้องการข้อมูลเปรียบเทียบในด้านใดบ้าง? (เลือกได้หลายข้อ)</label>
                            <div class="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-2">
                                <label class="flex items-center p-3 border rounded-lg hover:bg-gray-50"><input type="checkbox" name="comparison_criteria" value="skills" class="mr-2">ทักษะที่จำเป็น</label>
                                <label class="flex items-center p-3 border rounded-lg hover:bg-gray-50"><input type="checkbox" name="comparison_criteria" value="salary" class="mr-2">เงินเดือน</label>
                                <label class="flex items-center p-3 border rounded-lg hover:bg-gray-50"><input type="checkbox" name="comparison_criteria" value="path" class="mr-2">เส้นทางเติบโต</label>
                                <label class="flex items-center p-3 border rounded-lg hover:bg-gray-50"><input type="checkbox" name="comparison_criteria" value="daily_tasks" class="mr-2">ลักษณะงาน</label>
                                <label class="flex items-center p-3 border rounded-lg hover:bg-gray-50"><input type="checkbox" name="comparison_criteria" value="market_demand" class="mr-2">ความต้องการตลาด</label>
                            </div>
                        </div>

                        <div>
                            <label class="block mb-2 text-sm font-medium text-gray-900">อะไรคือปัจจัยสำคัญที่สุดในการตัดสินใจ? (เลือกสูงสุด 2 ข้อ)</label>
                             <div id="decision-factors-container" class="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
                                <label class="flex items-center p-3 border rounded-lg hover:bg-gray-50"><input type="checkbox" name="decision_factors" value="passion" class="mr-2">ความชอบ/ความถนัด</label>
                                <label class="flex items-center p-3 border rounded-lg hover:bg-gray-50"><input type="checkbox" name="decision_factors" value="market_demand" class="mr-2">ความต้องการตลาด</label>
                                <label class="flex items-center p-3 border rounded-lg hover:bg-gray-50"><input type="checkbox" name="decision_factors" value="growth_potential" class="mr-2">ศักยภาพเติบโต</label>
                                <label class="flex items-center p-3 border rounded-lg hover:bg-gray-50"><input type="checkbox" name="decision_factors" value="salary" class="mr-2">ผลตอบแทน</label>
                            </div>
                        </div>

                    </fieldset>
                `;
                break;

            // --- CASE C: สำหรับผู้ที่มีเป้าหมายชัดเจน ---
            case 'C':
                content = `
                    <div class="text-center mb-6">
                        <p class="text-gray-500 mt-1">ยอดเยี่ยมเลย! การมีเป้าหมายที่ชัดเจนคือจุดเริ่มต้นที่ดี<br>เรามาวางแผนเพื่อไปให้ถึงจุดนั้นกัน</p>
                    </div>
                    <fieldset class="space-y-8">
                        
                        <div>
                            <label for="dream-job-input" class="block mb-2 text-sm font-medium text-gray-900">อาชีพเป้าหมายของคุณคืออะไร?</label>
                            <input type="text" id="dream-job-input" name="dream_job" class="form-input autoComplete" placeholder="เช่น Product Manager...">
                        </div>

                        <div>
                            <label for="five-year-goal" class="block mb-2 text-sm font-medium text-gray-900">เป้าหมายของคุณในอีก 3-5 ปีข้างหน้า</label>
                            <select id="five-year-goal" name="five_year_goal" class="form-input">
                                <option value="specialist">เป็นผู้เชี่ยวชาญในสายงาน (Specialist)</option>
                                <option value="manager">เป็นหัวหน้าทีม/ผู้จัดการ (Manager)</option>
                                <option value="top_company">ย้ายไปทำงานในบริษัทชั้นนำ</option>
                                <option value="entrepreneur">เปิดบริษัท/เป็นฟรีแลนซ์</option>
                                <option value="other">อื่นๆ</option>
                            </select>
                        </div>

                        <div>
                            <label for="skill-gaps-input" class="block mb-2 text-sm font-medium text-gray-900">คุณคิดว่าต้องพัฒนาทักษะอะไรเพิ่มเติม?</label>
                            <input type="text" id="skill-gaps-input" class="form-input" placeholder="พิมพ์ทักษะที่ขาดไป...">
                            <div id="skill-gaps-tags" class="mt-2 flex flex-wrap gap-2"></div>
                        </div>

                        <div>
                            <label class="block mb-2 text-sm font-medium text-gray-900">สนใจพัฒนาตัวเองในรูปแบบใดมากที่สุด?</label>
                            <div class="grid grid-cols-2 gap-4 mt-2">
                                <label class="flex items-center p-3 border rounded-lg hover:bg-gray-50"><input type="checkbox" name="dev_methods" value="courses" class="mr-2">คอร์สเรียน/ใบประกาศ</label>
                                <label class="flex items-center p-3 border rounded-lg hover:bg-gray-50"><input type="checkbox" name="dev_methods" value="projects" class="mr-2">ทำโปรเจกต์จริง</label>
                                <label class="flex items-center p-3 border rounded-lg hover:bg-gray-50"><input type="checkbox" name="dev_methods" value="reading" class="mr-2">อ่านบทความ/หนังสือ</label>
                                <label class="flex items-center p-3 border rounded-lg hover:bg-gray-50"><input type="checkbox" name="dev_methods" value="community" class="mr-2">เข้าร่วม Community</label>
                            </div>
                        </div>

                    </fieldset>
                `;
                break;
            
            // --- DEFAULT CASE ---
            default:
                content = '<p class="text-center text-gray-500">กรุณาย้อนกลับไปเลือกตัวเลือกในหน้าก่อนหน้า</p>';
        }

        restorePageData(3);
        
        container.innerHTML = content;
        // หลังจากสร้าง HTML แล้ว ต้องเรียกฟังก์ชันเพื่อผูก Event Listener กับ Element ใหม่ๆ
        initializePage3Logic(); 
    }
    
    function addHardSkillTag(skill) {
        const tagsContainer = document.getElementById('hard-skills-tags');
        const ratingsContainer = document.getElementById('skill-ratings-container');
        
        const tagId = `skill-${skill.replace(/\s+/g, '-')}`;

        const tag = document.createElement('div');
        tag.className = 'flex items-center bg-blue-100 text-blue-800 text-sm font-medium px-2.5 py-1 rounded-full';
        tag.innerHTML = `
            <span>${skill}</span>
            <button type="button" class="ml-2 text-blue-500 hover:text-blue-700">&times;</button>
        `;
        tagsContainer.appendChild(tag);

        const rating = document.createElement('div');
        rating.id = `${tagId}-rating`;
        rating.className = 'p-3 border rounded-lg';
        rating.innerHTML = `
            <label class="font-medium text-sm text-gray-800">${skill}:</label>
            <div class="flex justify-around mt-2">
                <label><input type="radio" name="rating_${skill}" value="beginner" class="mr-1">พื้นฐาน</label>
                <label><input type="radio" name="rating_${skill}" value="intermediate" class="mr-1">พอใช้ได้</label>
                <label><input type="radio" name="rating_${skill}" value="advanced" class="mr-1">เชี่ยวชาญ</label>
            </div>
        `;
        ratingsContainer.appendChild(rating);

        tag.querySelector('button').addEventListener('click', () => {
            tagsContainer.removeChild(tag);
            ratingsContainer.removeChild(rating);
        });
    }

    function validatePage(pageNumber) {
        // Basic validation example
        if (pageNumber === 1) {
            if (document.getElementById('fullname').value === '' || document.getElementById('email').value === '') {
                alert('กรุณากรอกชื่อและอีเมล');
                return false;
            }
        }
        if (pageNumber === 2) {
             if (!document.querySelector('input[name="clarity"]:checked')) {
                 alert('กรุณาเลือกความชัดเจนในเส้นทางอาชีพ');
                 return false;
             }
        }
        return true;
    }

    function handleFormSubmit(e) {
        e.preventDefault();
        progressBar.style.width = '100%';
        
        const rawData = new FormData(form);
        formData = Object.fromEntries(rawData.entries());

        // Manually collect dynamic data like skills and ratings
        formData.hard_skills = [];
        document.querySelectorAll('#hard-skills-tags > div > span').forEach(tag => {
            const skillName = tag.textContent;
            const rating = document.querySelector(`input[name="rating_${skillName}"]:checked`)?.value || 'not_rated';
            formData.hard_skills.push({ skill: skillName, level: rating });
        });

        console.log('Final Form Data:', formData);
        alert('ส่งข้อมูลสำเร็จ! ตรวจสอบข้อมูลใน Console');
        // TODO: Send formData to backend API
    }
});