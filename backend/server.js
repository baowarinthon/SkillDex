require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const { GoogleGenerativeAI } = require("@google/generative-ai");

const app = express();
const port = 3000;

// --- Middlewares & Static Files ---
// เพิ่ม limit เป็น 50mb เพื่อรองรับกรณีที่ formData มี Base64 ของไฟล์ขนาดใหญ่
app.use(cors());
app.use(express.json({ limit: '50mb' })); 

// กำหนด Path ไปยังโฟลเดอร์ frontend
// path.join(__dirname, '..', 'frontend') หมายถึงโฟลเดอร์ frontend อยู่ระดับเดียวกับโฟลเดอร์ backend
const frontendPath = path.join(__dirname, '..', 'frontend');
app.use(express.static(frontendPath));


// --- ⚠️ ส่วนที่เพิ่มเข้ามาเพื่อแก้ไข ⚠️ ---
// --- การจัดการ Routing สำหรับหน้าเว็บ (Serve HTML Files) ---
// โค้ดส่วนนี้จะบอกให้เซิร์ฟเวอร์ส่งไฟล์ HTML ที่ถูกต้องกลับไปเมื่อมีการร้องขอ
// ทำให้ปัญหา 404 Not Found หายไป

// ส่ง findcareer.html เมื่อมีการร้องขอ
app.get('/findcareer.html', (req, res) => {
    res.sendFile(path.join(frontendPath, 'findcareer.html'));
});

// ส่ง mypath.html เมื่อมีการร้องขอ
app.get('/mypath.html', (req, res) => {
    res.sendFile(path.join(frontendPath, 'mypath.html'));
});

// --- จบส่วนที่เพิ่มเข้ามาเพื่อแก้ไข ---


// --- Gemini AI Setup ---
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash"}); // อัปเดตเป็นโมเดลล่าสุด

// --- Helper Functions ---
function createAiContext(fullUserData) {
    // กรองเอาเฉพาะข้อมูลที่จำเป็นและมีค่า
    const context = {};
    for (const key in fullUserData) {
        if (fullUserData[key] && fullUserData[key] !== '' && fullUserData[key].length > 0) {
            context[key] = fullUserData[key];
        }
    }
    return context;
}

async function generateAIResponse(prompt) {
    try {
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = await response.text();
        
        // ทำความสะอาด Output จาก AI ให้เป็น JSON ที่ถูกต้อง
        const cleanJsonString = text.replace(/```json/g, "").replace(/```/g, "").trim();
        return JSON.parse(cleanJsonString);

    } catch (error) {
        console.error("Error calling Generative AI:", error);
        throw new Error("AI failed to generate a valid response.");
    }
}


// --- API Endpoints ---
app.post('/api/find-career', async (req, res) => {
    try {
        const { userData } = req.body;
        if (!userData) {
            return res.status(400).json({ error: "User data is required" });
        }
        
        const userName = userData.fullName || 'คุณ';
        const aiContext = createAiContext(userData);

        const prompt = `
# ROLE
คุณคือ 'Career Navigator AI' ชื่อว่า 'Skilldy (พี่สกิลดี้)' ที่ปรึกษาด้านอาชีพที่อบอุ่นและเชี่ยวชาญ แทนตัวเองว่าพี่สกิลดี้ คุณมีความเข้าใจลึกซึ้งเกี่ยวกับตลาดงานในประเทศไทย โดยเฉพาะอย่างยิ่งในกรุงเทพฯ และมีความสามารถในการวิเคราะห์ข้อมูลโปรไฟล์ของผู้ใช้เพื่อแนะนำเส้นทางอาชีพที่เหมาะสมที่สุด

# TASK
วิเคราะห์ข้อมูลโปรไฟล์ของผู้ใช้เพื่อแนะนำ 3 เส้นทางอาชีพที่เหมาะสมที่สุด โดยพิจารณาจากความสนใจ ทักษะ และเป้าหมายในอนาคต พร้อมข้อมูลสนับสนุนที่สำคัญสำหรับการตัดสินใจในตลาดงานกรุงเทพฯ นอกจากนี้หากผู้ใช้มีอาชีพที่อยากเป็นให้เซ็ตเป็น 1 หรือ 2 ใน 3 อาชีพที่แนะนำด้วย

# CONTEXT
- **ชื่อผู้ใช้:** ${userName}
- **ข้อมูลโปรไฟล์:** ${JSON.stringify(aiContext, null, 2)}

# OUTPUT FORMAT
จงตอบกลับมาเป็น JSON object ที่สมบูรณ์ตามโครงสร้างนี้เท่านั้น:
{
  "greeting": "ประโยคทักทาย ${userName} ที่เป็นกันเองและให้กำลังใจ",
  "career_recommendations": [
    {
      "career_title": "ชื่ออาชีพ (เช่น UX/UI Designer)",
      "alignment_score": "ค่าตัวเลข 1-100 ที่แสดงความสอดคล้องกับโปรไฟล์",
      "summary": "สรุปสั้นๆ ว่าทำไมอาชีพนี้ถึงเหมาะกับผู้ใช้",
      "key_skills": ["ทักษะหลัก 1", "ทักษะหลัก 2", "ทักษะหลัก 3"],
      "supporting_data": {
        "avg_starting_salary_bkk": "ช่วงเงินเดือนเริ่มต้นในกรุงเทพฯ (เช่น 30,000 - 45,000 บาท)",
        "market_trend": "แนวโน้มความต้องการในตลาด (เช่น 'เติบโตสูง' หรือ 'มีความต้องการสม่ำเสมอ')"
      }
    }
  ]
}`;

        const aiResult = await generateAIResponse(prompt);
        res.json(aiResult);

    } catch (error) {
        console.error('Error in /api/find-career:', error);
        res.status(500).json({ error: error.message || 'Internal Server Error' });
    }
});


app.post('/api/my-path', async (req, res) => {
    try {
        const { userData } = req.body;
         if (!userData) {
            return res.status(400).json({ error: "User data is required" });
        }

        const userName = userData.fullName || 'คุณ';
        const aiContext = createAiContext(userData);

        // Prompt นี้ยาวและซับซ้อนขึ้น เพื่อสร้าง Multi-path Roadmap
        const prompt = `
# ROLE
Act as 'Skilldy (พี่สกิลดี้)', a warm, expert career advisor for new-grad & junior designers in Thailand. Always use the name "พี่สกิลดี้".

# TASK
Based on the user's profile, generate 3 distinct and strategic career paths. The paths must target different company types and highlight different strengths.

# CONTEXT
- **userName:** ${userName}
- **aiContext:** ${JSON.stringify(aiContext, null, 2)}

# INSTRUCTIONS
- Output a single, valid JSON object only.
- Do not include any text, explanations, or markdown formatting outside of the JSON structure.
- All content within the JSON must be in Thai.

# OUTPUT STRUCTURE
{
  "introduction": "ประโยคทักทาย ${userName} ที่อบอุ่น สร้างแรงบันดาลใจ และเกริ่นนำ 3 เส้นทางอาชีพที่พี่สกิลดี้ออกแบบมาให้โดยเฉพาะ",
  "career_paths": [
    {
      "path_title": "...", // ชื่อตำแหน่ง/เส้นทางอาชีพจริงที่สั้นและสื่อถึงกลยุทธ์
      "summary": "...", // สรุปภาพรวมของเส้นทาง และเหมาะกับคนลักษณะไหน
      "pros": ["...", "...", "..."], // ข้อดี/โอกาส อย่างน้อย 3 ข้อ
      "cons": ["...", "...", "..."], // ความท้าทาย/ข้อควรระวัง อย่างน้อย 3 ข้อ
      "supporting_data": {
        "avg_starting_salary_bkk": "...", // ประมาณการเงินเดือนเริ่มต้น (Junior) ในกรุงเทพฯ
        "market_trend": "..." // แนวโน้มความต้องการของตลาดในปัจจุบัน
      },
      "roadmap": [
        {
          "phase_title": "Phase 1: Foundation (0-6 เดือน)",
          "milestones": [ // 3+ milestones per phase
            { "title": "...", "description": "...", "resources": ["...", "..."] } // 2+ concrete resources (courses, books, tools)
          ]
        },
        {
          "phase_title": "Phase 2: Specialization (6-18 เดือน)",
          "milestones": [
            { "title": "...", "description": "...", "resources": ["...", "..."] }
          ]
        },
        {
          "phase_title": "Phase 3: Acceleration (18-36 เดือน)",
          "milestones": [
            { "title": "...", "description": "...", "resources": ["...", "..."] }
          ]
        }
      ]
    }
    // ... Path 2 and Path 3
  ]
}
`;

// # ROLE
// คุณคือ 'Skilldy (พี่สกิลดี้)' ที่ปรึกษาด้านอาชีพที่อบอุ่นและเชี่ยวชาญ แทนตัวเองว่าพี่สกิลดี้ มีความเชี่ยวชาญในการสร้างแผนการเดินทางที่ชัดเจนและเป็นรูปธรรมสำหรับนักศึกษาจบใหม่และ Junior Designer 

// # TASK
// จากข้อมูลโปรไฟล์ของผู้ใช้ ให้คุณออกแบบ แผนการเดินทางสู่สายอาชีพที่เหมาะกับ User มากที่สุดจำนวน 3 เส้นทาง (3 Career Paths) ที่แตกต่างกันอย่างชัดเจน แต่ละเส้นทางต้องมีกลยุทธ์ จุดแข็ง และกลุ่มเป้าหมายของบริษัทที่ต่างกัน เพื่อให้ผู้ใช้สามารถเลือกเส้นทางที่ "ใช่" ที่สุดสำหรับตัวเองได้

// # CONTEXT
// - **ชื่อผู้ใช้:** ${userName}
// - **ข้อมูลโปรไฟล์:** ${JSON.stringify(aiContext, null, 2)}

// # REQUIREMENTS FOR EACH CAREER PATH
// สำหรับแต่ละเส้นทางใน 3 เส้นทาง ต้องประกอบด้วย:
// 1.  **path_title:** ชื่อเส้นทางที่มีอยู่จริงและสื่อถึงกลยุทธ์อย่างชัดเจน สั้น กระชับ
// 2.  **summary:** คำอธิบายสรุปว่าเส้นทางนี้เน้นอะไร และเหมาะกับคนแบบไหน
// 3.  **pros:** ข้อดีหรือโอกาสของเส้นทางนี้ (อย่างน้อย 3 ข้อ)
// 4.  **cons:** ความท้าทายหรือข้อควรพิจารณา (อย่างน้อย 3 ข้อ)
// 5.  **supporting_data:** - **avg_starting_salary_bkk:** ประมาณการเงินเดือนเริ่มต้นในกรุงเทพฯ สำหรับ Junior ในสายนั้นๆ
//     - **market_trend:** แนวโน้มความต้องการของตลาดสำหรับคนในเส้นทางนี้
// 6.  **roadmap:** แผนการเดินทางที่แบ่งเป็น 3 Phase ที่ชัดเจน (เช่น 0-6 เดือน, 6-18 เดือน, 18-36 เดือน)
//     - ในแต่ละ Phase ให้มี **milestones** (เป้าหมายย่อย) อย่างน้อย 3 อย่าง
//     - ในแต่ละ milestone ให้มี **title**, **description**, และ **resources** (แหล่งข้อมูล/คอร์ส/หนังสือ/เครื่องมือ) ที่เป็นรูปธรรมและจับต้องได้ (อย่างน้อย 2-3 แหล่งข้อมูลต่อ milestone)

// # OUTPUT FORMAT
// จงสร้าง JSON object ที่สมบูรณ์แบบตามโครงสร้างด้านล่างนี้เท่านั้น ห้ามมีข้อความอื่นนอกเหนือจาก JSON object นี้เด็ดขาด

// {
//   "introduction": "ประโยคทักทาย ${userName} ที่อบอุ่นและสร้างแรงบันดาลใจ พร้อมบอกภาพรวมว่านี่คือ 3 เส้นทางที่ออกแบบมาเพื่อเขาโดยเฉพาะ",
//   "career_paths": [
//     {
//       "path_title": "...",
//       "summary": "...",
//       "pros": ["...", "...", "..."],
//       "cons": ["...", "...", "..."],
//       "supporting_data": {
//         "avg_starting_salary_bkk": "...",
//         "market_trend": "..."
//       },
//       "roadmap": [
//         {
//           "phase_title": "Phase 1: ... (0-6 เดือน)",
//           "milestones": [
//             { "title": "...", "description": "...", "resources": ["#Resource1", "#Resource2"] },
//             { "title": "...", "description": "...", "resources": ["#Resource1", "#Resource2"] }
//           ]
//         },
//         {
//           "phase_title": "Phase 2: ... (6-18 เดือน)",
//           "milestones": [ ... ]
//         },
//         {
//           "phase_title": "Phase 3: ... (18-36 เดือน)",
//           "milestones": [ ... ]
//         }
//       ]
//     }
//   ]
// }

        const aiResult = await generateAIResponse(prompt);
        res.json(aiResult);

    } catch (error) {
        console.error('Error in /api/my-path:', error);
        res.status(500).json({ error: error.message || 'Internal Server Error' });
    }
});

// --- API Endpoint for Upskilling Plan ---
app.post('/api/upskill', async (req, res) => {
    try {
        const { userData, targetCareer } = req.body;
        if (!userData || !targetCareer) {
            return res.status(400).json({ error: "User data and target career are required" });
        }

        const userName = userData.fullName || 'คุณ';
        const aiContext = createAiContext(userData);

        const prompt = `
# ROLE
คุณคือ 'Career Navigator AI' ชื่อว่า 'Skilldy (พี่สกิลดี้)' โค้ชผู้เชี่ยวชาญด้านการวางแผนการเรียนรู้ (Learning Path) ที่เก่งกาจและเข้าใจบริบทของตลาดงานในประเทศไทยเป็นอย่างดี

# TASK
1.  **วิเคราะห์ช่องว่างทางทักษะ (Skill Gap Analysis):** เปรียบเทียบทักษะที่ ${userName} มีอยู่ (จากข้อมูลโปรไฟล์) กับทักษะที่จำเป็นอย่างยิ่งสำหรับอาชีพ "Junior-Level ${targetCareer}"
2.  **จัดลำดับความสำคัญ:** เลือก Skill Gaps ที่สำคัญที่สุด 3 อันดับแรกที่ควรเรียนรู้ก่อน เพื่อให้ได้ผลลัพธ์ที่เร็วและมีประสิทธิภาพที่สุดในการสมัครงาน
3.  **สร้างแผนการเรียนรู้ (Actionable Plan):** สำหรับแต่ละ Skill Gap ให้นำเสนอแผนการเรียนรู้ที่จับต้องได้และหลากหลาย ประกอบด้วย:
    * **คอร์สเรียนแนะนำ (Recommended Courses):** อย่างน้อย 1-2 คอร์ส พร้อมระบุแพลตฟอร์มและประเภท (เช่น ฟรี, มีใบประกาศ)
    * **โปรเจกต์ที่ควรทำ (Recommended Projects):** อย่างน้อย 1-2 โปรเจกต์ ที่จะช่วยสร้าง Portfolio ที่โดดเด่นและแสดงให้เห็นถึงทักษะที่ได้เรียนรู้จริง
    * **แหล่งข้อมูลเพิ่มเติม (Additional Resources):** เช่น หนังสือ, บทความ, หรือ Community ที่เกี่ยวข้อง เพื่อการเรียนรู้ที่ลึกซึ้งขึ้น

# CONTEXT
- **อาชีพเป้าหมาย:** ${targetCareer}
- **ข้อมูลโปรไฟล์ของผู้ใช้:** ${JSON.stringify(aiContext, null, 2)}

# OUTPUT FORMAT
จงตอบกลับมาเป็น JSON object ที่สมบูรณ์แบบตามโครงสร้างด้านล่างนี้เท่านั้น ห้ามมีข้อความอื่นนอกเหนือจาก JSON object นี้เด็ดขาด:
{
  "target_career": "${targetCareer}",
  "introduction": "ประโยคเกริ่นนำที่ให้กำลังใจ ${userName} และสรุปภาพรวมของแผนการเรียนรู้ที่สร้างขึ้นเพื่อปิด Skill Gaps สำคัญสำหรับอาชีพ ${targetCareer}",
  "upskill_plan": [
    {
      "skill_to_learn": "ชื่อทักษะที่ต้องเรียนรู้ (เช่น User Research & Analysis)", 
      "importance_level": "High", 
      "reason_to_learn": "คำอธิบายสั้นๆ แต่ทรงพลัง ว่าทำไมทักษะนี้ถึงจำเป็นอย่างยิ่งสำหรับอาชีพเป้าหมาย",
      "recommended_courses": [ 
        { "title": "ชื่อคอร์สเรียนที่เจาะจง", "platform": "เช่น Coursera, Skooldio, Google", "type": "ฟรี / มีใบประกาศ" }
      ],
      "recommended_projects": [ 
        { "title": "ชื่อโปรเจกต์ที่น่าสนใจ", "description": "คำอธิบายสั้นๆ ว่าโปรเจกต์นี้ทำอะไรและจะได้เรียนรู้อะไร" }
      ],
      "additional_resources": [
        { "title": "ชื่อหนังสือ/บทความ/Community", "type": "หนังสือ / บทความ / Community" }
      ]
    }
  ]
}
`;

        const aiResult = await generateAIResponse(prompt);
        res.json(aiResult);

    } catch (error) {
        console.error('Error in /api/upskill:', error);
        res.status(500).json({ error: error.message || 'Internal Server Error' });
    }
});

// --- Server Start ---
app.listen(port, () => {
    console.log(`✅ Server is running at http://localhost:${port}`);
});