import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import fs from "fs";
import { GoogleGenAI, Type, Schema } from "@google/genai";

const DATA_FILE = path.join(process.cwd(), "db.json");

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

let db: { jobs: Job[], categories: { id: string, name: string }[] } = { jobs: [], categories: [
  { id: '1', name: 'Latest Jobs' },
  { id: '2', name: 'State Govt' },
  { id: '3', name: 'Result' },
  { id: '4', name: 'Admit Card' },
  { id: '5', name: 'Answer Key' },
  { id: '6', name: 'Syllabus' },
  { id: '7', name: 'Admission' },
  { id: '8', name: 'Mock Test' }
] };

const saveDb = () => {
  fs.writeFileSync(DATA_FILE, JSON.stringify(db, null, 2));
};

try {
  if (fs.existsSync(DATA_FILE)) {
    db = JSON.parse(fs.readFileSync(DATA_FILE, "utf-8"));
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
  console.error("Error reading db.json", error);
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Routes
  app.get("/api/jobs", (req, res) => {
    res.json(db.jobs.sort((a, b) => new Date(b.publishDate).getTime() - new Date(a.publishDate).getTime()));
  });

  app.get("/api/jobs/:id", (req, res) => {
    const job = db.jobs.find(j => j.id === req.params.id);
    if (!job) {
      return res.status(404).json({ error: "Job not found" });
    }
    res.json(job);
  });

  app.put("/api/jobs/:id", (req, res) => {
    if (req.headers.authorization !== 'Bearer admin_token_123') {
      return res.status(401).json({ error: "Unauthorized" });
    }
    const idx = db.jobs.findIndex(j => j.id === req.params.id);
    if (idx === -1) return res.status(404).json({ error: "Job not found" });
    db.jobs[idx] = { ...db.jobs[idx], ...req.body };
    saveDb();
    res.json(db.jobs[idx]);
  });

  app.delete("/api/jobs/:id", (req, res) => {
    if (req.headers.authorization !== 'Bearer admin_token_123') {
      return res.status(401).json({ error: "Unauthorized" });
    }
    db.jobs = db.jobs.filter(j => j.id !== req.params.id);
    saveDb();
    res.json({ success: true });
  });

  app.get("/api/categories", (req, res) => {
    res.json(db.categories || []);
  });

  app.post("/api/categories", (req, res) => {
    // Basic auth check
    if (req.headers.authorization !== 'Bearer admin_token_123') {
      return res.status(401).json({ error: "Unauthorized" });
    }
    const { name, parentId } = req.body;
    if (!name) return res.status(400).json({ error: "Name is required" });
    const newCat = { id: Math.random().toString(36).substr(2, 6), name, parentId };
    db.categories.push(newCat);
    saveDb();
    res.json(newCat);
  });

  app.delete("/api/categories/:id", (req, res) => {
    if (req.headers.authorization !== 'Bearer admin_token_123') {
      return res.status(401).json({ error: "Unauthorized" });
    }
    db.categories = db.categories.filter(c => c.id !== req.params.id);
    saveDb();
    res.json({ success: true });
  });

  app.post("/api/auth/login", (req, res) => {
    const { password } = req.body;
    const adminPassword = process.env.ADMIN_PASSWORD || "admin@123";
    if (password === adminPassword) {
      res.json({ success: true, token: "admin_token_123" });
    } else {
      res.status(401).json({ error: "Invalid password" });
    }
  });

  app.post("/api/jobs/generate", async (req, res) => {
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
            // Extremely basic tag stripping
            pageText = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
                           .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
                           .replace(/<[^>]+>/g, ' ')
                           .replace(/\s+/g, ' ')
                           .substring(0, 15000); // Send up to 15K chars
          }
        } catch (e) {
          console.warn("Could not fetch URL natively, relying on model knowledge.", e);
        }
      }

      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      
      const prompt = `
        You are an Elite SEO Expert and Senior Sarkari Job Content Writer. Your task is to generate a highly engaging, human-like, and 100% SEO-optimized article that ranks #1 on Google for government job and Sarkari Result searches.
        You must ensure high keyword density naturally without stuffing, utilize LSI (Latent Semantic Indexing) keywords, and structure the content with semantic Headings (H2, H3). The tone should be informative, authoritative, and helpful for job aspirants.
        
        ${url ? `Source URL: ${url}` : "Source URL: Not provided (Content is either raw text or a mock test)."}
        Additional Context provided: ${additionalContext || "None"}
        
        Extracted Page Text (if available):
        ${pageText}
        
        Generate a comprehensive, SEO-optimized article in Markdown format. Use Markdown Tables for all structured data to maximize rich snippet opportunities and readability:
        1. Main Heading (Post Name & Brief Info) - Include main keyword phrases like "Recruitment", "Online Form", "Notification".
        2. Important Dates (Use a Table for exact dates).
        3. Application Fee (Use a Table).
        4. Age Limit (Use a Table and specify crucial cutoff dates).
        5. Vacancy Details & Eligibility (Use a Table for columns: Post Name, Total Post, Eligibility - mention education like 10th, 12th, Graduate).
        6. Selection Process
        7. How to Fill the Online Form (Step-by-step bullet points using active voice).
        8. Important Links (Use a Table with actions like "Apply Online", "Download Notification", "Official Website" mapped to the source URL).
        9. Frequently Asked Questions (FAQ): Include 3-4 highly searched questions about this specific job (e.g., "What is the last date?", "What is the age limit?") to target Google's "People Also Ask" feature.
        
        CRITICAL LINKING RULES:
        - NEVER link to third-party news websites, competitor job portals, or unauthorized sources.
        - The ONLY external links permitted are to the Official Notification URL/Government portal or Mock Test portals.
        - For internal references within the article (like "Click here for more jobs"), use "/" or "#" as the href.
        
        Also extract key metadata for the UI and SEO:
        - Job Title
        - Meta Title: An SEO-optimized title tag (max 60 characters) to drive high CTR. Include the year and keyword.
        - Meta Description: An SEO-optimized description (max 160 characters) incorporating primary keywords, eligibility, and last date.
        - Broad Category (MUST be exactly one of: "Latest Jobs", "Admit Card", "Result", "Answer Key", "Syllabus", "Admission", "Scholarship", "Mock Test", "State Govt"). Infer this based on what the notification is about. Default to "Latest Jobs" if it's a new vacancy.
        - A short summary (2-3 sentences, natural language)
        - Short eligibility (e.g., "10th/12th/Graduate")
        - Total Vacancies
        - Last date to apply
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

      const aiResponse = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: responseSchema,
        }
      });
      
      if (!aiResponse.text) {
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

      db.jobs.push(newJob);
      saveDb();

      res.json(newJob);
    } catch (error: any) {
      console.error("Error generating job:", error);
      res.status(500).json({ error: error.message || "Failed to generate job" });
    }
  });
  
  app.delete("/api/jobs/:id", (req, res) => {
    db.jobs = db.jobs.filter(j => j.id !== req.params.id);
    saveDb();
    res.json({ success: true });
  });

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

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
