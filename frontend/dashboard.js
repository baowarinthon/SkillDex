// document.addEventListener('DOMContentLoaded', () => {
//     // Key สำหรับดึงข้อมูล ต้องตรงกับที่ form.js บันทึกไว้
//     const APP_STORAGE_KEY = 'skilldexFormData';

//     // --- 1. ดึงข้อมูลจาก Local Storage ---
//     const savedData = localStorage.getItem(APP_STORAGE_KEY);
//     const formData = savedData ? JSON.parse(savedData) : null;

//     // --- ถ้าไม่พบข้อมูล ให้แสดงข้อความและหยุดทำงาน ---
//     if (!formData) {
//         document.querySelector('.dashboard-main').innerHTML = `
//             <div class="no-data-container">
//                 <h2>ยังไม่มีข้อมูล</h2>
//                 <p>กรุณากลับไปกรอกข้อมูลในหน้าฟอร์มเพื่อเริ่มต้นใช้งาน SkillDex</p>
//                 <a href="form.html" class="action-button">กลับไปหน้าฟอร์ม</a>
//             </div>`;
//         // ซ่อน Header ที่ไม่จำเป็น
//         const userProfile = document.querySelector('.user-profile');
//         if (userProfile) userProfile.style.display = 'none';
//         return; 
//     }

//     // --- 2. อ้างอิงถึง Element ใน HTML ที่จะนำข้อมูลไปใส่ ---
//     const elements = {
//         userName: document.getElementById('userName'),
//         summaryAbout: document.getElementById('summaryAbout'),
//         summaryCareerCompass: document.getElementById('summaryCareerCompass'),
//         summaryHardSkills: document.getElementById('summaryHardSkills'),
//         summarySoftSkills: document.getElementById('summarySoftSkills'),
//         summaryExperience: document.getElementById('summaryExperience'),
//         summaryResume: document.getElementById('summaryResume'),
//         resetDataBtn: document.getElementById('resetDataBtn'),
//         editDataBtn: document.getElementById('editDataBtn'),
//         summaryHeaderH2: document.querySelector('.summary-header h2')
//     };

//     let isEditMode = false;

//     // --- 3. ฟังก์ชันสำหรับสร้าง HTML แสดงผล (Render Functions) ---

//     /** สร้าง HTML สำหรับแสดงรายละเอียดแต่ละรายการ */
//     function createDetailItem(label, value) {
//         if (!value) return ''; // ถ้าไม่มีข้อมูล ไม่ต้องแสดงผล
//         return `
//             <div class="detail-item">
//                 <span class="detail-label">${label}</span>
//                 <div class="detail-value">${value}</div>
//             </div>`;
//     }

//     document.querySelector('.dashboard-main').addEventListener('change', (event) => {
//     if (event.target.classList.contains('inline-edit')) {
//         handleInputChange(event);
//     }
// });

// // --- (เพิ่ม) Helper function สำหรับสร้าง Form Element ในโหมดแก้ไข ---
// /**
//  * สร้าง HTML สำหรับแสดงผลหรือฟอร์มแก้ไข
//  * @param {string} label - ชื่อหัวข้อ
//  * @param {string} key - key ใน formData
//  * @param {string} type - 'text', 'textarea', 'select', 'tags'
//  * @param {object} [options] - ตัวเลือกเพิ่มเติมสำหรับ select หรือ textarea
//  */
// function createEditableItem(label, key, type = 'text', options = {}) {
//     const value = formData[key] || '';

//     if (isEditMode) {
//         let inputHtml = '';
//         switch (type) {
//             case 'select':
//                 const selectOptions = options.mapData || {};
//                 inputHtml = `
//                     <select class="inline-edit" data-key="${key}">
//                         ${Object.entries(selectOptions).map(([val, text]) =>
//                             `<option value="${val}" ${val === value ? 'selected' : ''}>${text}</option>`
//                         ).join('')}
//                     </select>`;
//                 break;
//             case 'textarea':
//                  inputHtml = `<textarea class="inline-edit" data-key="${key}" rows="${options.rows || 3}">${value}</textarea>`;
//                 break;
//             case 'tags':
//                 const tags = Array.isArray(value) ? value.join(', ') : '';
//                 inputHtml = `<input type="text" class="inline-edit" data-key="${key}" value="${tags}" placeholder=" разделенные запятыми">`;
//                 break;
//             default: // text
//                 inputHtml = `<input type="text" class="inline-edit" data-key="${key}" value="${value}">`;
//         }
//         return `
//             <div class="detail-item">
//                 <span class="detail-label">${label}</span>
//                 <div class="detail-value">${inputHtml}</div>
//             </div>`;

//     } else {
//         // โหมดแสดงผลปกติ
//         let displayValue = value;
//         if (type === 'select' && options.mapData) {
//             displayValue = options.mapData[value] || '-';
//         } else if (type === 'tags' && Array.isArray(value)) {
//             displayValue = value.length > 0 ? value.map(tag => `<span class="skill-tag">${tag}</span>`).join(' ') : 'ไม่มีข้อมูล';
//         } else if (type === 'textarea') {
//             displayValue = value ? value.replace(/\n/g, '<br>') : 'ไม่มีข้อมูล';
//         }
//         return createDetailItem(label, displayValue || '-');
//     }
// }

//     /** แสดงข้อมูล "เกี่ยวกับคุณ" */
//     function renderAbout() {
//     let html = '';
//     const statusMap = {
//         student: 'นักศึกษา',
//         graduate: 'บัณฑิตจบใหม่',
//         employee: 'พนักงานบริษัท',
//         freelance: 'ฟรีแลนซ์'
//     };
//     html += createEditableItem('สถานะปัจจุบัน', 'currentStatus', 'select', { mapData: statusMap });

//     if (formData.currentStatus === 'student') {
//         html += createEditableItem('มหาวิทยาลัย', 'university');
//         html += createEditableItem('คณะ', 'faculty');
//         html += createEditableItem('สาขา', 'major');
//     } else if (formData.currentStatus === 'employee' || formData.currentStatus === 'freelance') {
//         html += createEditableItem('ตำแหน่งงาน', 'jobTitle');
//         const expMap = { '<1': 'น้อยกว่า 1 ปี', '1-3': '1-3 ปี', '3-5': '3-5 ปี', '>5': 'มากกว่า 5 ปี' };
//         html += createEditableItem('ประสบการณ์', 'workExperience', 'select', { mapData: expMap });
//     }
//     elements.summaryAbout.innerHTML = html;
// }

//     /** แสดงข้อมูล "เข็มทิศเส้นทางอาชีพ" */
//     function renderCareerCompass() {
//     let html = '';
//     // ในโหมดแก้ไขจะแสดงทุก field เพื่อให้ผู้ใช้เปลี่ยนประเภทได้
//     if (isEditMode) {
//          html += '<h5><strong>เลือกประเภทเป้าหมาย:</strong></h5>';
//          const clarityMap = { A: 'ยังไม่แน่ใจเส้นทาง', B: 'พอมีสายอาชีพที่สนใจ', C: 'เป้าหมายชัดเจน'};
//          html += createEditableItem('ความชัดเจน', 'careerClarity', 'select', {mapData: clarityMap});
//          html += '<hr style="margin: 1rem 0; border-color: #eee;">';
//     }


//     if (formData.careerClarity === 'C') {
//         html += '<h5><strong>เป้าหมายชัดเจน</strong></h5>';
//         html += createEditableItem('อาชีพเป้าหมาย', 'targetProfession');
//         html += createEditableItem('ทักษะที่ต้องพัฒนา', 'futureSkills', 'textarea');
//     } else if (formData.careerClarity === 'B') {
//         html += '<h5><strong>พอมีสายอาชีพที่สนใจ</strong></h5>';
//         html += createEditableItem('อาชีพที่สนใจ', 'tags-interestedProfessions', 'tags');
//     } else { // 'A' or default
//         html += '<h5><strong>ยังไม่แน่ใจเส้นทาง</strong></h5>';
//         html += createEditableItem('กิจกรรมที่ชอบ', 'tags-favoriteActivities', 'tags');
//     }
//     elements.summaryCareerCompass.innerHTML = html;
// }
    
//     /** แสดงข้อมูล "Hard Skills" */
//     function renderHardSkills() {
//         if (!formData.skillLevels || Object.keys(formData.skillLevels).length === 0) {
//             elements.summaryHardSkills.innerHTML = '<p>ไม่มีข้อมูล</p>';
//             return;
//         }
//         let html = '';
//         const levelMap = { '0': 'พื้นฐาน', '1': 'พอใช้ได้', '2': 'เชี่ยวชาญ' };
//         for (const skillName in formData.skillLevels) {
//             const skill = formData.skillLevels[skillName];
//             html += `
//                 <div class="skill-item">
//                     <div class="skill-item-header">
//                         <span class="skill-name">${skill.name}</span>
//                         <span class="skill-level">${levelMap[skill.level]}</span>
//                     </div>
//                     <div class="skill-progress-bar">
//                          <div class="skill-progress" style="width: ${((parseInt(skill.level) + 1) / 3) * 100}%"></div>
//                     </div>
//                 </div>`;
//         }
//         elements.summaryHardSkills.innerHTML = html;
//     }

//     /** แสดงข้อมูล "Soft Skills" */
//     function renderSoftSkills() {
//     if (isEditMode) {
//         const skillsText = (formData.softSkills || []).join(', ');
//         elements.summarySoftSkills.innerHTML = `
//             <textarea class="inline-edit" data-key="softSkills" rows="4" placeholder=" разделенные запятыми">${skillsText}</textarea>
//         `;
//     } else {
//         if (!formData.softSkills || formData.softSkills.length === 0) {
//             elements.summarySoftSkills.innerHTML = '<p>ไม่มีข้อมูล</p>';
//             return;
//         }
//         elements.summarySoftSkills.innerHTML = `<div class="tag-container">
//             ${formData.softSkills.map(skill => `<span class="skill-tag">${skill}</span>`).join('')}
//         </div>`;
//     }
// }

//     // /** แสดงข้อมูล "ประสบการณ์" */
//     // function renderExperience() {
//     //     elements.summaryExperience.innerHTML = formData.experience 
//     //         ? `<p>${formData.experience.replace(/\n/g, '<br>')}</p>` 
//     //         : '<p>ไม่มีข้อมูล</p>';
//     // }

// function renderExperience() {
//     elements.summaryExperience.innerHTML = isEditMode
//         ? `<textarea class="inline-edit" data-key="experience" rows="5">${formData.experience || ''}</textarea>`
//         : (formData.experience ? `<p>${formData.experience.replace(/\n/g, '<br>')}</p>` : '<p>ไม่มีข้อมูล</p>');
// }

//     /** แสดงข้อมูล "ไฟล์แนบ" */
//     function renderResume() {
//         const fileName = formData['file-name-resumeUpload'];
//         const fileData = formData['file-data-resumeUpload'];
//         if (fileName && fileData) {
//             elements.summaryResume.innerHTML = `
//                 <a href="${fileData}" download="${fileName}" class="resume-link">
//                     <span class="material-icons-outlined">description</span>
//                     <span>${fileName}</span>
//                 </a>`;
//         } else {
//             elements.summaryResume.innerHTML = '<p>ไม่ได้แนบไฟล์</p>';
//         }
//     }
    
//     // --- 4. เรียกใช้ฟังก์ชันทั้งหมดเพื่อแสดงผล ---
//     // elements.userName.textContent = formData.fullName || 'ผู้ใช้งาน';
//     // renderAbout();
//     // renderCareerCompass();
//     // renderHardSkills();
//     // renderSoftSkills();
//     // renderExperience();
//     // renderResume();

// // --- (เพิ่ม) ฟังก์ชันจัดการการเปลี่ยนแปลงข้อมูลในฟอร์ม ---
// function handleInputChange(event) {
//     const element = event.target;
//     const key = element.dataset.key;
//     if (!key) return;

//     let value = element.value;

//     // แปลงข้อมูลสำหรับ tags และ soft skills กลับไปเป็น array
//     if (key.startsWith('tags-') || key === 'softSkills') {
//         value = value.split(',').map(item => item.trim()).filter(Boolean);
//     }
    
//     formData[key] = value;
//     localStorage.setItem(APP_STORAGE_KEY, JSON.stringify(formData));
//     console.log(`Updated ${key}:`, value);

//     // ถ้ามีการเปลี่ยนสถานะ หรือความชัดเจนของอาชีพ ต้อง render ใหม่
//     if (key === 'currentStatus' || key === 'careerClarity') {
//         renderAll();
//     }
// }


//     // (เพิ่ม) สร้างฟังก์ชันรวมการ Render เพื่อให้เรียกซ้ำได้ง่าย
// function renderAll() {
//     elements.userName.textContent = formData.fullName || 'ผู้ใช้งาน';

//     // เมื่ออยู่ในโหมดแก้ไข เปลี่ยนชื่อผู้ใช้เป็น input
//     if (isEditMode) {
//         elements.userName.innerHTML = `<input type="text" class="inline-edit user-name-edit" data-key="fullName" value="${formData.fullName || ''}">`;
//         elements.userName.querySelector('input').addEventListener('blur', handleAutoSave);
//     }

//     renderAbout();
//     renderCareerCompass();
//     renderHardSkills();
//     renderSoftSkills();
//     renderExperience();
//     renderResume();
// }

// // เรียกใช้ครั้งแรก
// renderAll();

// /** (เพิ่ม) ฟังก์ชันสำหรับสลับโหมดแก้ไข */
// function toggleEditMode() {
//     isEditMode = !isEditMode; // สลับค่า true/false

//     const editBtnIcon = elements.editDataBtn.querySelector('span');
//     const editBtnText = elements.editDataBtn.childNodes[2]; // เข้าถึง Text Node

//     if (isEditMode) {
//         editBtnIcon.textContent = 'done'; // เปลี่ยนไอคอนเป็น "เสร็จสิ้น"
//         editBtnText.textContent = ' เสร็จสิ้นการแก้ไข';
//         elements.summaryHeaderH2.textContent = 'แก้ไขข้อมูลของคุณ';
//     } else {
//         editBtnIcon.textContent = 'edit'; // เปลี่ยนไอคอนกลับเป็น "แก้ไข"
//         editBtnText.textContent = ' แก้ไขข้อมูล';
//         elements.summaryHeaderH2.textContent = 'สรุปข้อมูลของคุณ';
//     }

//     // เรียก Render ใหม่ทั้งหมดเพื่ออัปเดต UI ตามโหมด
//     renderAll();
// }

// // (เพิ่ม) Event listener สำหรับปุ่มแก้ไขใหม่
// elements.editDataBtn.addEventListener('click', toggleEditMode);

//     // --- 5. ตั้งค่าปุ่ม "ล้างข้อมูล" ---
//     elements.resetDataBtn.addEventListener('click', () => {
//         if (confirm('คุณต้องการลบข้อมูลทั้งหมดที่กรอกและข้อมูลที่ AI สร้างขึ้นใช่หรือไม่?')) {
//             // ลบข้อมูลฟอร์มที่ผู้ใช้กรอก
//             localStorage.removeItem(APP_STORAGE_KEY);
            
//             // ลบข้อมูลที่ AI สร้างขึ้นทั้งหมด
//             localStorage.removeItem('skilldexCareerResults');
//             localStorage.removeItem('skilldexMyPathResults');
//             localStorage.removeItem('skilldexUpSkillResult');

//             alert('ลบข้อมูลทั้งหมดเรียบร้อยแล้ว');
//             window.location.href = 'form.html'; // กลับไปยังหน้าฟอร์ม
//         }
//     });

    
// });


document.addEventListener('DOMContentLoaded', () => {
    const APP_STORAGE_KEY = 'skilldexFormData';

    // --- 1. ดึงข้อมูล & ตรวจสอบ ---
    const savedData = localStorage.getItem(APP_STORAGE_KEY);
    let formData = savedData ? JSON.parse(savedData) : null;

    if (!formData) {
        document.querySelector('.dashboard-main').innerHTML = `
            <div class="no-data-container">
                <h2>ยังไม่มีข้อมูล</h2>
                <p>กรุณากลับไปกรอกข้อมูลในหน้าฟอร์มเพื่อเริ่มต้นใช้งาน</p>
                <a href="form.html" class="action-button">กลับไปหน้าฟอร์ม</a>
            </div>`;
        const userProfile = document.querySelector('.user-profile');
        if (userProfile) userProfile.style.display = 'none';
        return;
    }

    // --- 2. อ้างอิงถึง Elements & State ---
    const elements = {
        userName: document.getElementById('userName'),
        summaryHeaderH2: document.querySelector('.summary-header h2'),
        mainContainer: document.querySelector('.dashboard-main'),
        summaryAbout: document.getElementById('summaryAbout'),
        summaryCareerCompass: document.getElementById('summaryCareerCompass'),
        summaryHardSkills: document.getElementById('summaryHardSkills'),
        summarySoftSkills: document.getElementById('summarySoftSkills'),
        summaryExperience: document.getElementById('summaryExperience'),
        summaryResume: document.getElementById('summaryResume'),
        editDataBtn: document.getElementById('editDataBtn'),
        resetDataBtn: document.getElementById('resetDataBtn')
    };

    let isEditMode = false;
    const levelMap = { '0': 'พื้นฐาน', '1': 'พอใช้ได้', '2': 'เชี่ยวชาญ' };
    const statusMap = { student: 'นักศึกษา', graduate: 'บัณฑิตจบใหม่', employee: 'พนักงานบริษัท', freelance: 'ฟรีแลนซ์' };
    const expMap = { '<1': 'น้อยกว่า 1 ปี', '1-3': '1-3 ปี', '3-5': '3-5 ปี', '>5': 'มากกว่า 5 ปี' };
    const clarityMap = { A: 'ยังไม่แน่ใจเส้นทาง', B: 'พอมีสายอาชีพที่สนใจ', C: 'เป้าหมายชัดเจน'};

    // --- Helper Functions สำหรับสร้าง HTML ---
    const createDetailItem = (label, value) => `<div class="detail-item"><span class="detail-label">${label}</span><span class="detail-value">${value}</span></div>`;
    const createTextField = (label, key, condition = true) => !condition ? '' : `<div class="detail-item"><span class="detail-label">${label}</span><div class="detail-value"><input type="text" class="inline-edit" data-key="${key}" value="${formData[key] || ''}"></div></div>`;
    const createTextareaField = (label, key, condition = true) => !condition ? '' : `<div class="detail-item"><span class="detail-label">${label}</span><div class="detail-value"><textarea class="inline-edit" data-key="${key}" rows="4">${formData[key] || ''}</textarea></div></div>`;
    const createSelectField = (label, key, optionsMap, condition = true) => {
        if (!condition) return '';
        const options = Object.entries(optionsMap).map(([val, text]) => `<option value="${val}" ${val === formData[key] ? 'selected' : ''}>${text}</option>`).join('');
        return `<div class="detail-item"><span class="detail-label">${label}</span><div class="detail-value"><select class="inline-edit" data-key="${key}">${options}</select></div></div>`;
    };
    const createTagsField = (label, key, condition = true) => !condition ? '' : `<div class="detail-item"><span class="detail-label">${label}</span><div class="detail-value"><input type="text" class="inline-edit" data-key="${key}" value="${(formData[key] || []).join(', ')}" placeholder="ใช้ , คั่นระหว่างรายการ"></div></div>`;


    // --- 3. Render Functions (ฟังก์ชันแสดงผลข้อมูล) ---

    function renderAll() {
        renderUserName();
        renderAbout();
        renderCareerCompass();
        renderHardSkills();
        renderSoftSkills();
        renderExperience();
        renderResume();
    }
    
    function renderUserName() {
        const fullName = formData.fullName || 'ผู้ใช้งาน';
        elements.userName.innerHTML = isEditMode
            ? `<input type="text" class="inline-edit user-name-edit" data-key="fullName" value="${fullName}">`
            : fullName;
    }

    function renderAbout() {
        let html = '';
        if (isEditMode) {
            html += createSelectField('สถานะปัจจุบัน', 'currentStatus', statusMap);
            html += createTextField('มหาวิทยาลัย', 'university', formData.currentStatus === 'student');
            html += createTextField('คณะ', 'faculty', formData.currentStatus === 'student');
            html += createTextField('สาขา', 'major', formData.currentStatus === 'student');
            html += createTextField('ตำแหน่งงาน', 'jobTitle', ['employee', 'freelance'].includes(formData.currentStatus));
            html += createSelectField('ประสบการณ์', 'workExperience', expMap, ['employee', 'freelance'].includes(formData.currentStatus));
        } else {
            html += createDetailItem('สถานะปัจจุบัน', statusMap[formData.currentStatus] || '-');
            if (formData.currentStatus === 'student') {
                html += createDetailItem('มหาวิทยาลัย', formData.university);
                html += createDetailItem('คณะ', formData.faculty);
                html += createDetailItem('สาขา', formData.major);
            } else if (['employee', 'freelance'].includes(formData.currentStatus)) {
                html += createDetailItem('ตำแหน่งงาน', formData.jobTitle);
                html += createDetailItem('ประสบการณ์', expMap[formData.workExperience] || '-');
            }
        }
        elements.summaryAbout.innerHTML = html;
    }

    function renderCareerCompass() {
        let html = '';
        if (isEditMode) {
            html += createSelectField('ความชัดเจนในอาชีพ', 'careerClarity', clarityMap);
            html += createTextField('อาชีพเป้าหมาย', 'targetProfession', formData.careerClarity === 'C');
            html += createTextareaField('ทักษะที่ต้องพัฒนา', 'futureSkills', formData.careerClarity === 'C');
            html += createTagsField('อาชีพที่สนใจ', 'tags-interestedProfessions', formData.careerClarity === 'B');
            html += createTagsField('กิจกรรมที่ชอบ', 'tags-favoriteActivities', formData.careerClarity === 'A');
        } else {
            html += createDetailItem('ความชัดเจนในอาชีพ', clarityMap[formData.careerClarity] || '-');
            if (formData.careerClarity === 'C') {
                html += createDetailItem('อาชีพเป้าหมาย', formData.targetProfession);
                html += createDetailItem('ทักษะที่ต้องพัฒนา', (formData.futureSkills || '').replace(/\n/g, '<br>'));
            } else if (formData.careerClarity === 'B') {
                html += createDetailItem('อาชีพที่สนใจ', (formData['tags-interestedProfessions'] || []).map(tag => `<span class="skill-tag">${tag}</span>`).join(' '));
            } else {
                html += createDetailItem('กิจกรรมที่ชอบ', (formData['tags-favoriteActivities'] || []).map(tag => `<span class="skill-tag">${tag}</span>`).join(' '));
            }
        }
        elements.summaryCareerCompass.innerHTML = html;
    }

    function renderHardSkills() {
        const skills = formData.hardSkills || [];
        if (skills.length === 0) {
            elements.summaryHardSkills.innerHTML = isEditMode ? '<p class="edit-placeholder">เพิ่มทักษะในหน้าฟอร์มหลัก</p>' : '<p>ไม่มีข้อมูล</p>';
            return;
        }
        elements.summaryHardSkills.innerHTML = skills.map(skill => {
            const skillValue = skill.level || '0';
            const progressWidth = (parseInt(skillValue) / 2) * 100;
            if (isEditMode) {
                return `
                    <div class="skill-item edit-mode">
                        <span class="skill-name">${skill.name}</span>
                        <select class="inline-edit skill-level-select" data-key="hardSkills" data-skill-name="${skill.name}">
                            <option value="0" ${skillValue === '0' ? 'selected' : ''}>พื้นฐาน</option>
                            <option value="1" ${skillValue === '1' ? 'selected' : ''}>พอใช้ได้</option>
                            <option value="2" ${skillValue === '2' ? 'selected' : ''}>เชี่ยวชาญ</option>
                        </select>
                    </div>`;
            } else {
                return `
                    <div class="skill-item">
                        <div class="skill-info">
                            <span class="skill-name">${skill.name}</span>
                            <span class="skill-level">${levelMap[skillValue]}</span>
                        </div>
                        <div class="skill-progress-bar">
                            <div class="skill-progress" style="width: ${progressWidth}%;"></div>
                        </div>
                    </div>`;
            }
        }).join('');
    }

    function renderSoftSkills() {
        if (isEditMode) {
            elements.summarySoftSkills.innerHTML = `<textarea class="inline-edit" data-key="softSkills" rows="4" placeholder="ใช้ , คั่นระหว่างทักษะ">${(formData.softSkills || []).join(', ')}</textarea>`;
        } else {
            const skills = formData.softSkills || [];
            elements.summarySoftSkills.innerHTML = skills.length > 0
                ? `<div class="tag-container">${skills.map(skill => `<span class="skill-tag">${skill}</span>`).join('')}</div>`
                : '<p>ไม่มีข้อมูล</p>';
        }
    }

    function renderExperience() {
        elements.summaryExperience.innerHTML = isEditMode
            ? `<textarea class="inline-edit" data-key="experience" rows="5">${formData.experience || ''}</textarea>`
            : (formData.experience ? `<p>${formData.experience.replace(/\n/g, '<br>')}</p>` : '<p>ไม่มีข้อมูล</p>');
    }

    function renderResume() {
        const fileName = formData['file-name-resumeUpload'];
        const fileData = formData['file-data-resumeUpload'];
        if (fileName && fileData) {
            elements.summaryResume.innerHTML = `<a href="${fileData}" download="${fileName}" class="resume-link"><span class="material-icons-outlined">description</span><span>${fileName}</span></a>`;
        } else {
            elements.summaryResume.innerHTML = isEditMode ? '<p class="edit-placeholder">อัปโหลดไฟล์ในหน้าฟอร์มหลัก</p>' : '<p>ไม่ได้แนบไฟล์</p>';
        }
    }

    // --- 4. Event Handlers & Listeners ---
    function toggleEditMode() {
        isEditMode = !isEditMode;
        const icon = elements.editDataBtn.querySelector('span');
        const text = elements.editDataBtn.childNodes[2];

        if (isEditMode) {
            icon.textContent = 'done';
            text.textContent = ' เสร็จสิ้นการแก้ไข';
            elements.summaryHeaderH2.textContent = 'แก้ไขข้อมูลของคุณ';
            elements.mainContainer.classList.add('is-editing');
        } else {
            icon.textContent = 'edit';
            text.textContent = ' แก้ไขข้อมูล';
            elements.summaryHeaderH2.textContent = 'สรุปข้อมูลของคุณ';
            elements.mainContainer.classList.remove('is-editing');
        }
        renderAll();
    }

    function handleInputChange(event) {
        const el = event.target;
        if (!el.classList.contains('inline-edit')) return;
        
        const key = el.dataset.key;
        if (!key) return;

        let value = el.value;

        if (key.startsWith('tags-') || key === 'softSkills') {
            value = value.split(',').map(item => item.trim()).filter(Boolean);
        } else if (key === 'hardSkills') {
            const skillName = el.dataset.skillName;
            const skillIndex = formData.hardSkills.findIndex(s => s.name === skillName);
            if (skillIndex > -1) {
                formData.hardSkills[skillIndex].level = value;
            }
        } else {
            formData[key] = value;
        }

        localStorage.setItem(APP_STORAGE_KEY, JSON.stringify(formData));

        if (key === 'currentStatus' || key === 'careerClarity') {
            renderAll();
        }
    }
    
    // --- 5. Initial Execution ---
    renderAll();
    elements.editDataBtn.addEventListener('click', toggleEditMode);
    elements.mainContainer.addEventListener('change', handleInputChange);

    elements.resetDataBtn.addEventListener('click', () => {
        if (confirm('คุณต้องการลบข้อมูลทั้งหมดใช่หรือไม่?')) {
            localStorage.removeItem(APP_STORAGE_KEY);
            localStorage.removeItem('skilldexCareerResults');
            localStorage.removeItem('skilldexMyPathResults');
            localStorage.removeItem('skilldexUpSkillResult');
            alert('ลบข้อมูลทั้งหมดเรียบร้อยแล้ว');
            window.location.href = 'form.html';
        }
    });
});