document.addEventListener('DOMContentLoaded', () => {
    // ตรวจสอบว่า elements ถูก reference ถูกต้อง
    console.log('Elements Check:', {
        summaryCareerCompass: document.getElementById('summaryCareerCompass'),
        formData: JSON.parse(localStorage.getItem('skilldexFormData'))
    });

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
            
            if (formData.careerClarity === 'A') {
                html += createTagsField('กิจกรรมที่ชอบทำ', 'tags-favoriteActivities');
                // เพิ่มส่วนของ workValues
                html += `<div class="detail-item">
                    <span class="detail-label">สิ่งที่ให้ความสำคัญในการทำงาน</span>
                    <div class="detail-value">
                        <div class="tag-container">
                            ${(formData.workValues || []).map(value => 
                                `<span class="skill-tag">${getWorkValueLabel(value)}</span>`
                            ).join('')}
                        </div>
                    </div>
                </div>`;
            } else if (formData.careerClarity === 'B') {
                html += createTagsField('อาชีพที่สนใจ', 'interestedProfessions');
                
                // เพิ่มส่วนแสดงจุดเปรียบเทียบ
                if (formData.comparisonPoints && formData.comparisonPoints.length > 0) {
                    html += `<div class="detail-item">
                        <span class="detail-label">ต้องการเปรียบเทียบในด้าน</span>
                        <div class="detail-value">
                            <div class="tag-container">
                                ${formData.comparisonPoints.map(point => 
                                    `<span class="skill-tag">${getComparisonLabel(point)}</span>`
                                ).join('')}
                            </div>
                        </div>
                    </div>`;
                }

                // แสดงปัจจัยในการตัดสินใจ
                if (formData.decisionFactors && formData.decisionFactors.length > 0) {
                    html += `<div class="detail-item">
                        <span class="detail-label">ปัจจัยในการตัดสินใจ</span>
                        <div class="detail-value">
                            <div class="tag-container">
                                ${formData.decisionFactors.map(factor => 
                                    `<span class="skill-tag">${getFactorLabel(factor)}</span>`
                                ).join('')}
                            </div>
                        </div>
                    </div>`;
                }
            } else if (formData.careerClarity === 'C') {
                html += createTextField('อาชีพเป้าหมาย', 'targetProfession');
                
                // เพิ่มส่วนเป้าหมายในสายงาน
                html += createSelectField('เป้าหมายในสายงาน', 'careerGoal', {
                    'specialist': 'เชี่ยวชาญเฉพาะด้าน',
                    'manager': 'เติบโตสายบริหาร',
                    'business': 'มีธุรกิจเป็นของตัวเอง',
                    'top_company': 'ทำงานกับบริษัทชั้นนำ',
                    'freelance': 'เป็นฟรีแลนซ์'
                });

                // ทักษะที่ต้องพัฒนา
                html += createTextareaField('ทักษะที่ต้องพัฒนา', 'futureSkills');

                // วิธีการพัฒนาตัวเอง
                if (formData.devMethods && formData.devMethods.length > 0) {
                    html += `<div class="detail-item">
                        <span class="detail-label">วิธีการพัฒนาตัวเอง</span>
                        <div class="detail-value">
                            <div class="tag-container">
                                ${formData.devMethods.map(method => 
                                    `<span class="skill-tag">${getDevMethodLabel(method)}</span>`
                                ).join('')}
                            </div>
                        </div>
                    </div>`;
                }
            }
        } else {
            html += createDetailItem('ความชัดเจนในอาชีพ', clarityMap[formData.careerClarity] || '-');
            
            if (formData.careerClarity === 'A') {
                // แสดงกิจกรรมที่ชอบทำ
                if (formData['tags-favoriteActivities'] && formData['tags-favoriteActivities'].length > 0) {
                    html += `<div class="detail-item">
                        <span class="detail-label">กิจกรรมที่ชอบทำ</span>
                        <div class="detail-value">
                            <div class="tag-container">
                                ${formData['tags-favoriteActivities'].map(activity => 
                                    `<span class="skill-tag">${activity}</span>`
                                ).join('')}
                            </div>
                        </div>
                    </div>`;
                }

                // แสดง Work Values
                if (formData.workValues && formData.workValues.length > 0) {
                    html += `<div class="detail-item">
                        <span class="detail-label">สิ่งที่ให้ความสำคัญในการทำงาน</span>
                        <div class="detail-value">
                            <div class="tag-container">
                                ${formData.workValues.map(value => 
                                    `<span class="skill-tag">${getWorkValueLabel(value)}</span>`
                                ).join('')}
                            </div>
                        </div>
                    </div>`;
                }

                // แสดงรูปแบบการทำงาน
                if (formData.workCollaboration) {
                    html += createDetailItem('รูปแบบการทำงานที่ชอบ', getWorkStyleLabel(formData.workCollaboration));
                }
                if (formData.workPace) {
                    html += createDetailItem('จังหวะการทำงานที่ถนัด', getWorkPaceLabel(formData.workPace));
                }
            } else if (formData.careerClarity === 'B') {
                if (formData.interestedProfessions && formData.interestedProfessions.length > 0) {
                    html += `<div class="detail-item">
                        <span class="detail-label">อาชีพที่สนใจ</span>
                        <div class="detail-value">
                            <div class="tag-container">
                                ${formData.interestedProfessions.map(prof => 
                                    `<span class="skill-tag">${prof}</span>`
                                ).join('')}
                            </div>
                        </div>
                    </div>`;
                }

                // เพิ่มส่วนแสดงจุดเปรียบเทียบ
                if (formData.comparisonPoints && formData.comparisonPoints.length > 0) {
                    html += `<div class="detail-item">
                        <span class="detail-label">ต้องการเปรียบเทียบในด้าน</span>
                        <div class="detail-value">
                            <div class="tag-container">
                                ${formData.comparisonPoints.map(point => 
                                    `<span class="skill-tag">${getComparisonLabel(point)}</span>`
                                ).join('')}
                            </div>
                        </div>
                    </div>`;
                }

                // แสดงปัจจัยในการตัดสินใจ
                if (formData.decisionFactors && formData.decisionFactors.length > 0) {
                    html += `<div class="detail-item">
                        <span class="detail-label">ปัจจัยในการตัดสินใจ</span>
                        <div class="detail-value">
                            <div class="tag-container">
                                ${formData.decisionFactors.map(factor => 
                                    `<span class="skill-tag">${getFactorLabel(factor)}</span>`
                                ).join('')}
                            </div>
                        </div>
                    </div>`;
                }
            } else if (formData.careerClarity === 'C') {
        // แสดงอาชีพเป้าหมาย
        if (formData.targetProfession) {
            html += createDetailItem('อาชีพเป้าหมาย', formData.targetProfession);
        }

        // แสดงเป้าหมายในสายงาน
        if (formData.careerGoal) {
            html += createDetailItem('เป้าหมายในสายงาน', getCareerGoalLabel(formData.careerGoal));
        }

        // แสดงทักษะที่ต้องพัฒนา
        if (formData.futureSkills) {
            html += createDetailItem('ทักษะที่ต้องพัฒนา', formData.futureSkills);
        }

        // แสดงวิธีการพัฒนาตัวเอง
        if (formData.devMethods && formData.devMethods.length > 0) {
            html += `<div class="detail-item">
                <span class="detail-label">วิธีการพัฒนาตัวเอง</span>
                <div class="detail-value">
                    <div class="tag-container">
                        ${formData.devMethods.map(method => 
                            `<span class="skill-tag">${getDevMethodLabel(method)}</span>`
                        ).join('')}
                    </div>
                </div>
            </div>`;
        }
    }
        }
        elements.summaryCareerCompass.innerHTML = html;

        console.log('Career Compass Data:', {
        careerClarity: formData.careerClarity,
        targetProfession: formData.targetProfession,
        careerGoal: formData.careerGoal,
        futureSkills: formData.futureSkills,
        devMethods: formData.devMethods
    });
    }

    function renderHardSkills() {
        // ตรวจสอบว่ามี skillLevels หรือไม่
        if (!formData.skillLevels || Object.keys(formData.skillLevels).length === 0) {
            elements.summaryHardSkills.innerHTML = isEditMode ? 
                '<p class="edit-placeholder">เพิ่มทักษะในหน้าฟอร์มหลัก</p>' : 
                '<p>ไม่มีข้อมูล</p>';
            return;
        }

        // แปลง skillLevels object เป็น array ของ skills
        const skills = Object.values(formData.skillLevels);
        
        elements.summaryHardSkills.innerHTML = skills.map(skill => {
            const skillValue = skill.level || '0';
            const progressWidth = ((parseInt(skillValue) + 1) / 3) * 100; // ปรับการคำนวณ progress

            if (isEditMode) {
                return `
                    <div class="skill-item edit-mode">
                        <span class="skill-name">${skill.name}</span>
                        <select class="inline-edit skill-level-select" data-key="skillLevels" data-skill-name="${skill.name}">
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
        } else if (key === 'skillLevels') {
            const skillName = el.dataset.skillName;
            formData.skillLevels[skillName] = {
                name: skillName,
                level: value
            };
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

    // อัพเดท resultMapping สำหรับเลือก upskill plan ตามอาชีพ
    const resultMapping = {
        'careerResults': 'skilldexCareerResults',
        'myPathResults': 'skilldexMyPathResults',
        'upSkillResult': (formData) => {
            const profession = formData.targetProfession;
            if (!profession) return null;
            const professionKey = profession.replace(/\s+/g, '-');
            return `skilldexUpskillPlan_${professionKey}`;
        }
    };

    function checkResults() {
        const saveButtons = document.querySelectorAll('.save-result-btn');
        saveButtons.forEach(button => {
            const resultKey = button.dataset.result;
            const storageKey = resultMapping[resultKey];
            
            if (Array.isArray(storageKey)) {
                const hasResult = storageKey.some(key => localStorage.getItem(key));
                button.disabled = !hasResult;
            } else {
                const hasResult = localStorage.getItem(storageKey);
                button.disabled = !hasResult;
            }
        });

        // Debug: แสดงสถานะปุ่ม
        console.log('Button States:', Array.from(saveButtons).map(btn => ({
            id: btn.dataset.result,
            disabled: btn.disabled
        })));
    }

    // Event listener สำหรับปุ่มบันทึกผล
    document.querySelectorAll('.save-result-btn').forEach(button => {
        button.addEventListener('click', async () => {
            const resultKey = button.dataset.result;
            let storageKey = resultMapping[resultKey];
            
            if (typeof storageKey === 'function') {
                storageKey = storageKey(formData);
            }
            
            if (!storageKey) {
                alert('ไม่พบข้อมูลสำหรับอาชีพเป้าหมายนี้');
                return;
            }

            const resultData = localStorage.getItem(storageKey);
            if (!resultData) return;

            try {
                // สร้าง div ชั่วคราวสำหรับแสดงเนื้อหา
                const tempDiv = document.createElement('div');
                tempDiv.id = 'temp-content-for-pdf';
                tempDiv.style.padding = '20px';
                tempDiv.style.fontFamily = 'Sarabun, sans-serif';
                tempDiv.style.position = 'absolute';
                tempDiv.style.left = '-9999px';
                tempDiv.style.background = '#fff';
                tempDiv.style.width = '800px';
                
                // แปลงและจัดรูปแบบเนื้อหา
                const content = formatResultContent(JSON.parse(resultData), resultKey);
                tempDiv.innerHTML = content.replace(/\n/g, '<br>');
                
                document.body.appendChild(tempDiv);

                // ใช้ html2canvas แปลงเป็นรูปภาพ
                const canvas = await html2canvas(tempDiv, {
                    scale: 2,
                    useCORS: true,
                    logging: false,
                    windowWidth: 800,
                    onclone: (clonedDoc) => {
                        const clonedElement = clonedDoc.getElementById('temp-content-for-pdf');
                        if (clonedElement) {
                            clonedElement.style.position = 'static';
                        }
                    }
                });

                // สร้าง PDF
                const { jsPDF } = window.jspdf;
                const pdf = new jsPDF('p', 'px', [canvas.width / 2, canvas.height / 2]);
                
                // เพิ่มรูปภาพลงใน PDF
                pdf.addImage(
                    canvas.toDataURL('image/png'), 
                    'PNG', 
                    0, 
                    0, 
                    canvas.width / 2, 
                    canvas.height / 2
                );

                // บันทึกไฟล์
                const filename = `skilldex_${resultKey}_${new Date().toISOString().split('T')[0]}.pdf`;
                pdf.save(filename);

                // ลบ div ชั่วคราว
                document.body.removeChild(tempDiv);
            } catch (error) {
                console.error('Error generating PDF:', error);
                alert('เกิดข้อผิดพลาดในการสร้างไฟล์ PDF');
            }
        });
    });

    // อัพเดทฟังก์ชัน formatResultContent สำหรับจัดรูปแบบเนื้อหา
    function formatResultContent(data, type) {
        const date = new Date().toLocaleDateString('th-TH', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });

        switch(type) {
            case 'careerResults':
                return `
                    <h2>ผลการวิเคราะห์เส้นทางอาชีพ</h2>
                    <p>วันที่: ${date}</p>
                    <div style="margin: 20px 0">
                        <h3>คำแนะนำ</h3>
                        <p>${data.introduction || ''}</p>
                    </div>
                    ${data.career_recommendations?.map(rec => `
                        <div style="margin: 20px 0; padding: 10px; border-left: 3px solid #4A90E2;">
                            <h3>${rec.career_title}</h3>
                            <p>ความเหมาะสม: ${rec.alignment_score}%</p>
                            <p>${rec.summary}</p>
                            
                            <h4>ทักษะสำคัญ:</h4>
                            <ul>
                                ${rec.key_skills?.map(skill => `<li>${skill}</li>`).join('') || '<li>ไม่มีข้อมูล</li>'}
                            </ul>
                        </div>
                    `).join('') || '<p>ไม่มีข้อมูล</p>'}
                `;
            case 'myPathResults':
                return `แผนที่เส้นทางอาชีพ
วันที่: ${date}

คำแนะนำ: ${data.introduction || ''}

${data.career_paths?.map((path, index) => `
เส้นทางที่ ${index + 1}: ${path.path_title}

ข้อดี/โอกาส:
${path.pros?.map(pro => `• ${pro}`).join('\n') || 'ไม่มีข้อมูล'}

ความท้าทาย:
${path.cons?.map(con => `• ${con}`).join('\n') || 'ไม่มีข้อมูล'}

ข้อมูลตลาด:
- เงินเดือนเริ่มต้น: ${path.supporting_data?.avg_starting_salary_bkk || 'ไม่มีข้อมูล'}
- แนวโน้มตลาด: ${path.supporting_data?.market_trend || 'ไม่มีข้อมูล'}

แผนการพัฒนา:
${path.roadmap?.map(phase => `
${phase.phase_title}:
${phase.milestones?.map(ms => `• ${ms.title}
  ${ms.description}
  แหล่งเรียนรู้: ${ms.resources?.join(', ')}`).join('\n')}
`).join('\n') || 'ไม่มีข้อมูล'}
`).join('\n')}`;

            case 'upSkillResult':
                return `แผนการพัฒนาทักษะ
วันที่: ${date}

คำแนะนำ: ${data.introduction || ''}

ทักษะที่ต้องพัฒนา:
${data.upskill_plan?.map(skill => `
• ${skill.skill_to_learn}
  ระดับความสำคัญ: ${skill.importance_level === 'High' ? 'สูง' : skill.importance_level === 'Medium' ? 'ปานกลาง' : 'พื้นฐาน'}
  เหตุผล: ${skill.reason_to_learn}

  คอร์สแนะนำ:
  ${skill.recommended_courses?.map(course => `  - ${course.title} (${course.platform})`).join('\n') || '  ไม่มีข้อมูล'}

  โปรเจกต์แนะนำ:
  ${skill.recommended_projects?.map(project => `  - ${project.title}\n    ${project.description}`).join('\n') || '  ไม่มีข้อมูล'}

  แหล่งเรียนรู้เพิ่มเติม:
  ${skill.additional_resources?.map(resource => `  - ${resource.title} (${resource.type})`).join('\n') || '  ไม่มีข้อมูล'}
`).join('\n') || 'ไม่มีข้อมูล'}`;

            default:
                return 'ไม่พบข้อมูล';
        }
    }

    // เรียกใช้ checkResults เมื่อโหลดหน้า
    checkResults();
});

// เพิ่มฟังก์ชันแปลงค่าปัจจัย
function getFactorLabel(factor) {
    const factorMap = {
        'passion': 'ความชอบและความถนัด',
        'market': 'ความต้องการตลาด',
        'skills': 'ทักษะที่มี',
        'salary': 'รายได้',
        'market_demand': 'โอกาสในการเติบโต'
    };
    return factorMap[factor] || factor;
}

// เพิ่มฟังก์ชันสำหรับแปลงค่าต่างๆ
function getWorkValueLabel(value) {
    const valueMap = {
        'income': 'รายได้',
        'growth': 'โอกาสเติบโต',
        'impact': 'การสร้างผลกระทบ',
        'balance': 'Work-life Balance',
        'stability': 'ความมั่นคง'
    };
    return valueMap[value] || value;
}

function getWorkStyleLabel(style) {
    const styleMap = {
        'solo': 'ทำงานคนเดียว',
        'team': 'ทำงานเป็นทีม',
        'mix': 'ผสมผสาน'
    };
    return styleMap[style] || style;
}

function getWorkPaceLabel(pace) {
    const paceMap = {
        'steady': 'งานที่มีระบบแน่นอน',
        'dynamic': 'งานที่มีความยืดหยุ่น',
        'mixed': 'ผสมผสาน'
    };
    return paceMap[pace] || pace;
}

// เพิ่มฟังก์ชันแปลงค่าจุดเปรียบเทียบ
function getComparisonLabel(point) {
    const comparisonMap = {
        'skills': 'ทักษะที่ต้องใช้',
        'salary': 'เงินเดือนเฉลี่ย',
        'market_demand': 'ความต้องการตลาด',
        'growth': 'โอกาสเติบโต',
        'work_life': 'Work-Life Balance'
    };
    return comparisonMap[point] || point;
}

// เพิ่มฟังก์ชันแปลงค่าวิธีการพัฒนาตัวเอง
function getDevMethodLabel(method) {
    const methodMap = {
        'online_course': 'เรียนคอร์สออนไลน์',
        'projects': 'ทำโปรเจกต์',
        'reading': 'อ่านบทความ/หนังสือ',
        'community': 'เข้าร่วมคอมมูนิตี้',
        'bootcamp': 'เรียน Bootcamp',
        'certification': 'สอบใบรับรอง'
    };
    return methodMap[method] || method;
}

// เพิ่มฟังก์ชันแปลงค่าเป้าหมายในสายงาน
function getCareerGoalLabel(goal) {
    const goalMap = {
        'specialist': 'เชี่ยวชาญเฉพาะด้าน',
        'manager': 'เติบโตสายบริหาร',
        'business': 'มีธุรกิจเป็นของตัวเอง',
        'top_company': 'ทำงานกับบริษัทชั้นนำ',
        'freelance': 'เป็นฟรีแลนซ์'
    };
    return goalMap[goal] || goal;
}