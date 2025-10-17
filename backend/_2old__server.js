require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const { GoogleGenerativeAI } = require("@google/generative-ai");

const app = express();
const port = 3000;

// --- Middlewares & Static Files ---
app.use(cors());
app.use(express.json({ limit: '50mb' })); 

const frontendPath = path.join(__dirname, '..', 'frontend');
app.use(express.static(frontendPath));

// --- Routing ---
app.get('/findcareer.html', (req, res) => {
    res.sendFile(path.join(frontendPath, 'findcareer.html'));
});

app.get('/mypath.html', (req, res) => {
    res.sendFile(path.join(frontendPath, 'mypath.html'));
});

app.get('/upskill.html', (req, res) => {
    res.sendFile(path.join(frontendPath, 'upskill.html'));
});

// --- Gemini AI Setup ---
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Configuration for generation
const generationConfig = {
    temperature: 0.7,
    topP: 0.95,
    topK: 40,
    maxOutputTokens: 8192,
};

// --- Helper Functions ---
function createAiContext(fullUserData) {
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
        const model = genAI.getGenerativeModel({ 
            model: "gemini-2.5-flash",
            generationConfig
        });

        console.log("Calling Gemini AI...");
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = await response.text();
        
        console.log("Raw AI Response (first 300 chars):", text.substring(0, 300));
        
        // Clean JSON string
        let cleanJsonString = text.trim();
        
        // Remove markdown code blocks if present
        if (cleanJsonString.startsWith('```json')) {
            cleanJsonString = cleanJsonString.replace(/```json\n?/g, '').replace(/```\n?/g, '');
        } else if (cleanJsonString.startsWith('```')) {
            cleanJsonString = cleanJsonString.replace(/```\n?/g, '');
        }
        
        cleanJsonString = cleanJsonString.trim();
        
        // Parse and return
        const parsed = JSON.parse(cleanJsonString);
        console.log("Successfully parsed AI response");
        return parsed;

    } catch (error) {
        console.error("Error in generateAIResponse:");
        console.error("Error type:", error.constructor.name);
        console.error("Error message:", error.message);
        if (error.stack) {
            console.error("Stack trace:", error.stack.split('\n').slice(0, 5).join('\n'));
        }
        throw new Error(`AI generation failed: ${error.message}`);
    }
}

// --- API Endpoints ---
app.post('/api/find-career', async (req, res) => {
    try {
        const { userData } = req.body;
        if (!userData) {
            return res.status(400).json({ error: "User data is required" });
        }
        
        const userName = userData.fullName || 'User';
        const aiContext = createAiContext(userData);

        const prompt = `You are a Career Navigator AI. Analyze user profile and recommend 3 suitable career paths.

USER DATA:
${JSON.stringify(aiContext, null, 2)}

Return ONLY a valid JSON object (no markdown, no code blocks):
{
  "greeting": "Warm greeting for ${userName} in Thai",
  "career_recommendations": [
    {
      "career_title": "Career Name",
      "alignment_score": 85,
      "summary": "Why this career suits the user",
      "key_skills": ["Skill 1", "Skill 2", "Skill 3"],
      "supporting_data": {
        "avg_starting_salary_bkk": "30,000 - 45,000 baht",
        "market_trend": "Growing demand"
      }
    }
  ]
}`;

        const aiResult = await generateAIResponse(prompt);
        res.json(aiResult);

    } catch (error) {
        console.error('Error in /api/find-career:', error.message);
        res.status(500).json({ error: error.message || 'Internal Server Error' });
    }
});

app.post('/api/my-path', async (req, res) => {
    try {
        const { userData } = req.body;
        if (!userData) {
            return res.status(400).json({ error: "User data is required" });
        }

        const userName = userData.fullName || 'User';
        const aiContext = createAiContext(userData);

        console.log("Processing /api/my-path request for:", userName);

        // Simplified and shorter prompt to avoid network issues
        const prompt = `You are a Path Advisor AI. Create 3 different career path roadmaps.

USER: ${userName}
PROFILE: ${JSON.stringify(aiContext, null, 2)}

CRITICAL: Return ONLY valid JSON (no markdown, no code blocks, no extra text):

{
  "introduction": "Welcome message in Thai for ${userName}",
  "career_paths": [
    {
      "path_title": "Path 1 Title",
      "summary": "Brief description",
      "pros": ["Pro 1", "Pro 2", "Pro 3"],
      "cons": ["Con 1", "Con 2", "Con 3"],
      "supporting_data": {
        "avg_starting_salary_bkk": "25,000 - 35,000 baht",
        "market_trend": "High growth"
      },
      "roadmap": [
        {
          "phase_title": "Phase 1: Foundation (0-6 months)",
          "milestones": [
            {
              "title": "Milestone 1",
              "description": "What to do",
              "resources": ["Resource 1", "Resource 2"]
            },
            {
              "title": "Milestone 2",
              "description": "What to do",
              "resources": ["Resource 1", "Resource 2"]
            }
          ]
        },
        {
          "phase_title": "Phase 2: Growth (6-18 months)",
          "milestones": [
            {
              "title": "Milestone",
              "description": "Description",
              "resources": ["Resource"]
            }
          ]
        },
        {
          "phase_title": "Phase 3: Advanced (18-36 months)",
          "milestones": [
            {
              "title": "Milestone",
              "description": "Description",
              "resources": ["Resource"]
            }
          ]
        }
      ]
    },
    {
      "path_title": "Path 2 Title",
      "summary": "Brief description",
      "pros": ["Pro 1", "Pro 2", "Pro 3"],
      "cons": ["Con 1", "Con 2", "Con 3"],
      "supporting_data": {
        "avg_starting_salary_bkk": "30,000 - 40,000 baht",
        "market_trend": "Steady demand"
      },
      "roadmap": [
        {
          "phase_title": "Phase 1",
          "milestones": [{"title": "Milestone", "description": "Desc", "resources": ["Resource"]}]
        },
        {
          "phase_title": "Phase 2",
          "milestones": [{"title": "Milestone", "description": "Desc", "resources": ["Resource"]}]
        },
        {
          "phase_title": "Phase 3",
          "milestones": [{"title": "Milestone", "description": "Desc", "resources": ["Resource"]}]
        }
      ]
    },
    {
      "path_title": "Path 3 Title",
      "summary": "Brief description",
      "pros": ["Pro 1", "Pro 2", "Pro 3"],
      "cons": ["Con 1", "Con 2", "Con 3"],
      "supporting_data": {
        "avg_starting_salary_bkk": "28,000 - 38,000 baht",
        "market_trend": "Moderate growth"
      },
      "roadmap": [
        {
          "phase_title": "Phase 1",
          "milestones": [{"title": "Milestone", "description": "Desc", "resources": ["Resource"]}]
        },
        {
          "phase_title": "Phase 2",
          "milestones": [{"title": "Milestone", "description": "Desc", "resources": ["Resource"]}]
        },
        {
          "phase_title": "Phase 3",
          "milestones": [{"title": "Milestone", "description": "Desc", "resources": ["Resource"]}]
        }
      ]
    }
  ]
}`;

        console.log("Sending request to Gemini AI for my-path...");
        const aiResult = await generateAIResponse(prompt);
        console.log("Successfully received response from AI");
        res.json(aiResult);

    } catch (error) {
        console.error('Error in /api/my-path:', error.message);
        res.status(500).json({ 
            error: error.message || 'Internal Server Error',
            details: 'Failed to generate career paths. Please try again.'
        });
    }
});

app.post('/api/upskill', async (req, res) => {
    try {
        const { userData, targetCareer } = req.body;
        if (!userData || !targetCareer) {
            return res.status(400).json({ error: "User data and target career are required" });
        }

        const userName = userData.fullName || 'User';
        const aiContext = createAiContext(userData);

        const prompt = `You are an Upskill Navigator AI. Analyze skill gaps for target career.

USER: ${userName}
TARGET: ${targetCareer}
PROFILE: ${JSON.stringify(aiContext, null, 2)}

Return ONLY valid JSON (no markdown):
{
  "target_career": "${targetCareer}",
  "introduction": "Encouraging message in Thai for ${userName}",
  "upskill_plan": [
    {
      "skill_to_learn": "Skill Name",
      "importance_level": "High",
      "reason_to_learn": "Why this skill is important",
      "recommended_courses": [
        {"title": "Course Name", "platform": "Coursera", "type": "Free"}
      ],
      "recommended_projects": [
        {"title": "Project Name", "description": "What to build"}
      ],
      "additional_resources": [
        {"title": "Resource Name", "type": "Book"}
      ]
    }
  ]
}`;

        const aiResult = await generateAIResponse(prompt);
        res.json(aiResult);

    } catch (error) {
        console.error('Error in /api/upskill:', error.message);
        res.status(500).json({ error: error.message || 'Internal Server Error' });
    }
});

// --- Health Check Endpoint ---
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        timestamp: new Date().toISOString(),
        geminiApiConfigured: !!process.env.GEMINI_API_KEY
    });
});

// --- Server Start ---
app.listen(port, () => {
    console.log(`✅ Server is running at http://localhost:${port}`);
    console.log(`📡 Gemini API Key configured: ${process.env.GEMINI_API_KEY ? 'Yes' : 'No'}`);
});