import express from "express";
import fs from "fs";
import path from "path";
import { GoogleGenAI, Type, Schema } from "@google/genai";
import { createClient } from "@supabase/supabase-js";

const app = express();
app.use(express.json());

// For Vercel Serverless, we use /tmp for temporary writing, otherwise local db.json
const LOCAL_DB = path.join(process.cwd(), "db.json");
const VERCEL_DB = "/tmp/db.json";
const DATA_FILE = process.env.VERCEL ? VERCEL_DB : LOCAL_DB;

// Initialize Supabase Client (if keys are provided)
const supabaseUrl = process.env.SUPABASE_URL || "";
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || "";
const supabase = (supabaseUrl && supabaseKey) ? createClient(supabaseUrl, supabaseKey) : null;

interface Job {
  id: string;
  title: string;
  metaTitle?: string;
  metaDescription?: string;
  category: string;
  publishDate: string;
  lastDate: string;
  contentMarkdown: string;
  summary: string;
  shortEligibility: string;
  totalVacancies: string;
  featuredImage?: string;
  sourceUrl?: string;
}

export interface MockTest {
  id: string;
  title: string;
  durationMinutes: number;
  totalMarks: number;
  positiveMarks: number;
  negativeMarks: number;
  isSectionsEnabled: boolean;
  published: boolean;
  createdAt: string;
}

export interface MockTestSection {
  id: string;
  testId: string;
  title: string;
  order: number;
}

export interface MockTestQuestion {
  id: string;
  testId: string;
  sectionId?: string;
  type: 'MCQ';
  contentMarkdown: string;
  options: { id: string; contentMarkdown: string }[];
  correctOptionId: string;
  explanationMarkdown?: string;
  order: number;
}

let db: { 
  jobs: Job[], 
  categories: { id: string, name: string, parentId?: string }[],
  mockTests: MockTest[],
  mockTestSections: MockTestSection[],
  mockTestQuestions: MockTestQuestion[]
} = { 
  jobs: [], 
  categories: [
    { id: '1', name: 'Latest Jobs' },
    { id: '2', name: 'State Govt' },
    { id: '3', name: 'Result' },
    { id: '4', name: 'Admit Card' },
    { id: '5', name: 'Answer Key' },
    { id: '6', name: 'Syllabus' },
    { id: '7', name: 'Admission' },
    { id: '8', name: 'Mock Test' }
  ],
  mockTests: [],
  mockTestSections: [],
  mockTestQuestions: []
};

const saveDb = () => {
  if (supabase) return; // Supabase handles its own storage
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(db, null, 2));
  } catch (error) {
    console.error("Failed to write to DB via saveDb", error);
  }
};

const initDb = () => {
  if (supabase) return; // Will fetch directly from Supabase DB on requests
  try {
    // If we're on Vercel and /tmp/db.json doesn't exist, try to copy the shipped db.json
    if (process.env.VERCEL && !fs.existsSync(VERCEL_DB) && fs.existsSync(LOCAL_DB)) {
      fs.copyFileSync(LOCAL_DB, VERCEL_DB);
    }
    
    if (fs.existsSync(DATA_FILE)) {
      db = JSON.parse(fs.readFileSync(DATA_FILE, "utf-8"));
      if (!db.mockTests) db.mockTests = [];
      if (!db.mockTestSections) db.mockTestSections = [];
      if (!db.mockTestQuestions) db.mockTestQuestions = [];
      
      if (!db.categories) {
        db.categories = [
          { id: '1', name: 'Latest Jobs' },
          { id: '2', name: 'State Govt' },
          { id: '3', name: 'Result' },
          { id: '4', name: 'Admit Card' },
          { id: '5', name: 'Answer Key' },
          { id: '6', name: 'Syllabus' },
          { id: '7', name: 'Admission' },
          { id: '8', name: 'Mock Test' }
        ];
        saveDb();
      }
    } else {
      fs.writeFileSync(DATA_FILE, JSON.stringify(db));
    }
  } catch (error) {
    console.error("Error initializing db.json", error);
  }
}

initDb();

// Base API Path - Vercel will mount this file on /api automatically if it's in the api folder.
// However, we still need to handle the routes appropriately depending on if we use a Vercel rewrite or native api loading.
// Since we want this script to be compatible with both local custom server.ts and Vercel native API, 
// we mount our routes directly on the app instance. For Vercel native, it hits /api/jobs directly, so the route might be /jobs if using vercel rewriting, or /api/jobs if mounted normally.
// Let's create an explicit router for /api
const router = express.Router();

router.get("/jobs", async (req, res) => {
  if (supabase) {
    const { data, error } = await supabase.from('jobs').select('*').order('publishDate', { ascending: false });
    if (error) return res.status(500).json({ error: error.message });
    return res.json(data);
  }
  res.json(db.jobs.sort((a, b) => new Date(b.publishDate).getTime() - new Date(a.publishDate).getTime()));
});

router.get("/jobs/:id", async (req, res) => {
  if (req.params.id === 'generate') return; // Skip to next handler
  
  if (supabase) {
    const { data, error } = await supabase.from('jobs').select('*').eq('id', req.params.id).single();
    if (error) return res.status(404).json({ error: "Job not found" });
    return res.json(data);
  }

  const job = db.jobs.find(j => j.id === req.params.id);
  if (!job) {
    return res.status(404).json({ error: "Job not found" });
  }
  res.json(job);
});

router.put("/jobs/:id", async (req, res) => {
  if (req.headers.authorization !== 'Bearer admin_token_123') {
    return res.status(401).json({ error: "Unauthorized" });
  }

  if (supabase) {
    const { data, error } = await supabase.from('jobs').update(req.body).eq('id', req.params.id).select().single();
    if (error) return res.status(500).json({ error: error.message });
    return res.json(data);
  }

  const idx = db.jobs.findIndex(j => j.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: "Job not found" });
  db.jobs[idx] = { ...db.jobs[idx], ...req.body };
  saveDb();
  res.json(db.jobs[idx]);
});

router.delete("/jobs/:id", async (req, res) => {
  if (req.headers.authorization !== 'Bearer admin_token_123') {
    return res.status(401).json({ error: "Unauthorized" });
  }
  
  if (supabase) {
    const { error } = await supabase.from('jobs').delete().eq('id', req.params.id);
    if (error) return res.status(500).json({ error: error.message });
    return res.json({ success: true });
  }

  db.jobs = db.jobs.filter(j => j.id !== req.params.id);
  saveDb();
  res.json({ success: true });
});

router.get("/categories", async (req, res) => {
  if (supabase) {
    const { data, error } = await supabase.from('categories').select('*');
    if (error) return res.status(500).json({ error: error.message });
    // Fallback defaults if empty
    if (!data || data.length === 0) return res.json(db.categories);
    return res.json(data);
  }
  res.json(db.categories || []);
});

router.post("/categories", async (req, res) => {
  if (req.headers.authorization !== 'Bearer admin_token_123') {
    return res.status(401).json({ error: "Unauthorized" });
  }
  const { name, parentId } = req.body;
  if (!name) return res.status(400).json({ error: "Name is required" });
  
  const newCat = { id: Math.random().toString(36).substr(2, 6), name, parentId };

  if (supabase) {
    const { data, error } = await supabase.from('categories').insert([newCat]).select().single();
    if (error) return res.status(500).json({ error: error.message });
    return res.json(data);
  }

  db.categories.push(newCat);
  saveDb();
  res.json(newCat);
});

router.delete("/categories/:id", async (req, res) => {
  if (req.headers.authorization !== 'Bearer admin_token_123') {
    return res.status(401).json({ error: "Unauthorized" });
  }
  
  if (supabase) {
    const { error } = await supabase.from('categories').delete().eq('id', req.params.id);
    if (error) return res.status(500).json({ error: error.message });
    return res.json({ success: true });
  }

  db.categories = db.categories.filter(c => c.id !== req.params.id);
  saveDb();
  res.json({ success: true });
});

router.get("/mock-tests", async (req, res) => {
  if (supabase) {
    const { data, error } = await supabase.from('mockTests').select('*').order('createdAt', { ascending: false });
    if (!error) return res.json(data);
  }
  return res.json(db.mockTests || []);
});

router.get("/mock-tests/:id", async (req, res) => {
  if (supabase) {
    const { data, error } = await supabase.from('mockTests').select('*').eq('id', req.params.id).single();
    if (!error) return res.json(data);
  }
  const test = db.mockTests.find(t => t.id === req.params.id);
  if (!test) return res.status(404).json({ error: "Test not found" });
  res.json(test);
});

router.post("/mock-tests", async (req, res) => {
  if (req.headers.authorization !== 'Bearer admin_token_123') return res.status(401).json({ error: "Unauthorized" });
  const newTest = { id: Math.random().toString(36).substr(2, 6), createdAt: new Date().toISOString(), ...req.body };
  if (supabase) {
    const { data, error } = await supabase.from('mockTests').insert([newTest]).select().single();
    if (!error) return res.json(data);
  }
  db.mockTests.push(newTest);
  saveDb();
  res.json(newTest);
});

router.put("/mock-tests/:id", async (req, res) => {
  if (req.headers.authorization !== 'Bearer admin_token_123') return res.status(401).json({ error: "Unauthorized" });
  if (supabase) {
    const { data, error } = await supabase.from('mockTests').update(req.body).eq('id', req.params.id).select().single();
    if (!error) return res.json(data);
  }
  const idx = db.mockTests.findIndex(t => t.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: "Test not found" });
  db.mockTests[idx] = { ...db.mockTests[idx], ...req.body };
  saveDb();
  res.json(db.mockTests[idx]);
});

router.delete("/mock-tests/:id", async (req, res) => {
  if (req.headers.authorization !== 'Bearer admin_token_123') return res.status(401).json({ error: "Unauthorized" });
  if (supabase) {
    const { error } = await supabase.from('mockTests').delete().eq('id', req.params.id);
    if (!error) return res.json({ success: true });
  }
  db.mockTests = db.mockTests.filter(t => t.id !== req.params.id);
  db.mockTestSections = db.mockTestSections.filter(s => s.testId !== req.params.id);
  db.mockTestQuestions = db.mockTestQuestions.filter(q => q.testId !== req.params.id);
  saveDb();
  res.json({ success: true });
});

router.get("/mock-tests/:id/sections", async (req, res) => {
  if (supabase) {
    const { data, error } = await supabase.from('mockTestSections').select('*').eq('testId', req.params.id).order('order', { ascending: true });
    if (!error) return res.json(data);
  }
  res.json(db.mockTestSections.filter(s => s.testId === req.params.id).sort((a, b) => a.order - b.order));
});

router.post("/mock-tests/:id/sections", async (req, res) => {
  if (req.headers.authorization !== 'Bearer admin_token_123') return res.status(401).json({ error: "Unauthorized" });
  const newSection = { id: Math.random().toString(36).substr(2, 6), testId: req.params.id, ...req.body };
  if (supabase) {
    const { data, error } = await supabase.from('mockTestSections').insert([newSection]).select().single();
    if (!error) return res.json(data);
  }
  db.mockTestSections.push(newSection);
  saveDb();
  res.json(newSection);
});

router.put("/mock-tests/:id/sections/:sectionId", async (req, res) => {
  if (req.headers.authorization !== 'Bearer admin_token_123') return res.status(401).json({ error: "Unauthorized" });
  if (supabase) {
    const { data, error } = await supabase.from('mockTestSections').update(req.body).eq('id', req.params.sectionId).select().single();
    if (!error) return res.json(data);
  }
  const idx = db.mockTestSections.findIndex(s => s.id === req.params.sectionId);
  if (idx === -1) return res.status(404).json({ error: "Section not found" });
  db.mockTestSections[idx] = { ...db.mockTestSections[idx], ...req.body };
  saveDb();
  res.json(db.mockTestSections[idx]);
});

router.delete("/mock-tests/:id/sections/:sectionId", async (req, res) => {
  if (req.headers.authorization !== 'Bearer admin_token_123') return res.status(401).json({ error: "Unauthorized" });
  if (supabase) {
    const { error } = await supabase.from('mockTestSections').delete().eq('id', req.params.sectionId);
    if (!error) return res.json({ success: true });
  }
  db.mockTestSections = db.mockTestSections.filter(s => s.id !== req.params.sectionId);
  db.mockTestQuestions = db.mockTestQuestions.filter(q => q.sectionId !== req.params.sectionId);
  saveDb();
  res.json({ success: true });
});

router.get("/mock-tests/:id/questions", async (req, res) => {
  if (supabase) {
    const { data, error } = await supabase.from('mockTestQuestions').select('*').eq('testId', req.params.id).order('order', { ascending: true });
    if (!error) return res.json(data);
  }
  res.json(db.mockTestQuestions.filter(q => q.testId === req.params.id).sort((a, b) => a.order - b.order));
});

router.post("/mock-tests/:id/questions", async (req, res) => {
  if (req.headers.authorization !== 'Bearer admin_token_123') return res.status(401).json({ error: "Unauthorized" });
  const newQ = { id: Math.random().toString(36).substr(2, 6), testId: req.params.id, ...req.body };
  if (supabase) {
    const { data, error } = await supabase.from('mockTestQuestions').insert([newQ]).select().single();
    if (!error) return res.json(data);
  }
  db.mockTestQuestions.push(newQ);
  saveDb();
  res.json(newQ);
});

router.put("/mock-tests/:id/questions/:questionId", async (req, res) => {
  if (req.headers.authorization !== 'Bearer admin_token_123') return res.status(401).json({ error: "Unauthorized" });
  if (supabase) {
    const { data, error } = await supabase.from('mockTestQuestions').update(req.body).eq('id', req.params.questionId).select().single();
    if (!error) return res.json(data);
  }
  const idx = db.mockTestQuestions.findIndex(q => q.id === req.params.questionId);
  if (idx === -1) return res.status(404).json({ error: "Question not found" });
  db.mockTestQuestions[idx] = { ...db.mockTestQuestions[idx], ...req.body };
  saveDb();
  res.json(db.mockTestQuestions[idx]);
});

router.delete("/mock-tests/:id/questions/:questionId", async (req, res) => {
  if (req.headers.authorization !== 'Bearer admin_token_123') return res.status(401).json({ error: "Unauthorized" });
  if (supabase) {
    const { error } = await supabase.from('mockTestQuestions').delete().eq('id', req.params.questionId);
    if (!error) return res.json({ success: true });
  }
  db.mockTestQuestions = db.mockTestQuestions.filter(q => q.id !== req.params.questionId);
  saveDb();
  res.json({ success: true });
});

router.post("/auth/login", (req, res) => {
  const { password } = req.body;
  const adminPassword = process.env.ADMIN_PASSWORD || "admin@123";
  if (password === adminPassword) {
    res.json({ success: true, token: "admin_token_123" });
  } else {
    res.status(401).json({ error: "Invalid password" });
  }
});

router.post("/jobs/generate", async (req, res) => {
  const { url, additionalContext, rawText } = req.body;
  
  if (!process.env.GEMINI_API_KEY) {
    return res.status(500).json({ error: "GEMINI_API_KEY is not configured" });
  }

  try {
    let pageText = rawText || "";
    if (url && !rawText) {
      try {
        const response = await fetch(url);
        if (response.ok) {
          const html = await response.text();
          pageText = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
                         .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
                         .replace(/<[^>]+>/g, ' ')
                         .replace(/\s+/g, ' ')
                         .substring(0, 15000);
        }
      } catch (e) {
        console.warn("Could not fetch URL natively, relying on model knowledge.", e);
      }
    }

    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    
    const prompt = `
      You are an Elite SEO Expert and Senior Sarkari Job Content Writer. Your task is to generate a highly engaging, human-like, and 100% SEO-optimized article that ranks #1 on Google for government job and Sarkari Result searches.
      You must ensure high keyword density naturally without stuffing, utilize LSI (Latent Semantic Indexing) keywords, and structure the content with semantic Headings (H2, H3). The tone should be informative, authoritative, and helpful for job aspirants.
      
      ${url ? `Source URL: ${url}` : "Source URL: Not provided."}
      Additional Context provided: ${additionalContext || "None"}
      
      Extracted Page Text (if available):
      ${pageText}
      
      Generate a comprehensive, SEO-optimized article in Markdown format. Use standard, clean Markdown Tables for all structured data to maximize rich snippet opportunities without generating excessive dashes or horizontal lines.
      
      Structure the post EXACTLY like this:
      1. Headings: Use H2 (##) and H3 (###) for structure. DO NOT use horizontal rules or dividers like \`---\` or \`***\`.
      2. Important Dates (Clean Table).
      3. Application Fee (Clean Table).
      4. Age Limit (Clean Table).
      5. Vacancy Details & Eligibility (Clean Table).
      6. Selection Process (Bullet points or paragraph).
      7. How to Fill the Online Form (Bullet points).
      8. Important Links (Clean Table).
      9. FAQ (3-4 concise questions).
      
      CRITICAL FORMATTING RULES:
      - NEVER use horizontal lines/rules (\`---\`, \`___\`, \`***\`).
      - Keep table formatting minimal. Do not add decorative dashed lines outside of the necessary table header separator.
      - Make the content highly engaging and authoritative, written by an expert.
      
      CRITICAL LINKING RULES: ONLY external links permitted are to the Official Notification URL.
      
      Also extract key metadata for the UI and SEO.
      - Broad Category (MUST be exactly one of: "Latest Jobs", "Admit Card", "Result", "Answer Key", "Syllabus", "Admission", "Scholarship", "Mock Test", "State Govt"). Infer this based on what the notification is about. Default to "Latest Jobs".
    `;

    const responseSchema: Schema = {
      type: Type.OBJECT,
      properties: {
        title: { type: Type.STRING },
        metaTitle: { type: Type.STRING },
        metaDescription: { type: Type.STRING },
        category: { type: Type.STRING },
        contentMarkdown: { type: Type.STRING },
        summary: { type: Type.STRING },
        shortEligibility: { type: Type.STRING },
        totalVacancies: { type: Type.STRING },
        lastDate: { type: Type.STRING }
      },
      required: ["title", "metaTitle", "metaDescription", "category", "contentMarkdown", "summary", "shortEligibility", "totalVacancies", "lastDate"],
    };

    let aiResponse;
    let retries = 3;
    let attempt = 0;
    while (attempt < retries) {
      try {
        aiResponse = await ai.models.generateContent({
          model: "gemini-2.5-flash",
          contents: prompt,
          config: {
            responseMimeType: "application/json",
            responseSchema: responseSchema,
          }
        });
        break; // Success, exit loop
      } catch (err: any) {
        attempt++;
        if (attempt >= retries || (err.status !== 503 && err.status !== 429)) {
          throw err;
        }
        console.warn(`Gemini API error (Status ${err.status}). Retrying ${attempt}/${retries} in ${attempt * 2}s...`);
        await new Promise(resolve => setTimeout(resolve, attempt * 2000));
      }
    }
    
    if (!aiResponse || !aiResponse.text) {
      throw new Error("Failed to generate content");
    }
    
    const data = JSON.parse(aiResponse.text);
    
    const newJob: Job = {
      id: Math.random().toString(36).substring(2, 9),
      title: data.title,
      metaTitle: data.metaTitle,
      metaDescription: data.metaDescription,
      category: data.category,
      publishDate: new Date().toISOString(),
      lastDate: data.lastDate,
      contentMarkdown: data.contentMarkdown,
      summary: data.summary,
      shortEligibility: data.shortEligibility,
      totalVacancies: data.totalVacancies,
      sourceUrl: url
    };

    if (supabase) {
      const { data: insertedJob, error } = await supabase.from('jobs').insert([newJob]).select().single();
      if (error) return res.status(500).json({ error: error.message });
      return res.json(insertedJob);
    }

    db.jobs.push(newJob);
    saveDb();

    res.json(newJob);
  } catch (error: any) {
    console.error("Error generating job:", error);
    let errorMessage = error.message || "Failed to generate job";
    if (error.status === 503) {
      errorMessage = "Google's AI model is currently experiencing high demand. Please wait a moment and try clicking Generate again.";
    } else if (error.status === 429) {
      errorMessage = "Rate limit exceeded. Please wait a minute and try again.";
    } else if (error.message?.includes("503")) {
        errorMessage = "Google's AI model is temporarily overloaded. Please try again in a few seconds.";
    }
    res.status(500).json({ error: errorMessage });
  }
});

app.use("/api", router);
app.use("/", router);

app.get("/robots.txt", (req, res) => {
  const protocol = req.headers["x-forwarded-proto"] || req.protocol;
  const host = req.headers.host;
  const baseUrl = `${protocol}://${host}`;
  
  const robotsContent = `User-agent: *
Allow: /

Sitemap: ${baseUrl}/sitemap.xml`;

  res.header("Content-Type", "text/plain");
  res.send(robotsContent);
});

app.get("/sitemap.xml", (req, res) => {
  const protocol = req.headers["x-forwarded-proto"] || req.protocol;
  const host = req.headers.host;
  const baseUrl = `${protocol}://${host}`;
  const today = new Date().toISOString().split("T")[0];

  let urls = [
    { loc: "/", priority: "1.0", lastmod: today },
    { loc: "/about-us", priority: "0.8", lastmod: today },
    { loc: "/contact-us", priority: "0.8", lastmod: today },
    { loc: "/privacy-policy", priority: "0.8", lastmod: today },
  ];

  db.jobs.forEach(job => {
    const jobDate = job.publishDate ? job.publishDate.split("T")[0] : today;
    urls.push({
      loc: `/job/${job.id}`,
      priority: "0.9",
      lastmod: jobDate
    });
  });

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(url => `  <url>
    <loc>${baseUrl}${url.loc}</loc>
    <lastmod>${url.lastmod}</lastmod>
    <priority>${url.priority}</priority>
  </url>`).join("\n")}
</urlset>`;

  res.header("Content-Type", "application/xml");
  res.send(sitemap);
});

// Expose the app for vercel
export default app;
