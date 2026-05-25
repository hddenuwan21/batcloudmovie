import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";

const app = express();
// 🚀 Hosting Environment එකට ගැලපෙන ලෙස PORT එක සකස් කිරීම
const PORT = process.env.PORT || 3000;

// 🔒 CORS සදහා ආරක්ෂිත ලියාපදිංචිය - ඕනෑම තැනක (CORS Fix) වැඩ කිරීමට
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  if (req.method === "OPTIONS") {
    return res.sendStatus(204);
  }
  next();
});

app.use(express.json());

// Persistent database helpers
const DATA_FILE = path.join(process.cwd(), "site_data.json");

function loadSiteData() {
  const defaults = {
    visits: 128,
    settings: {
      siteTitle: "CineHub - Premium Media | Watch Free Movies & TV Series Online",
      siteDescription: "Stream the latest movies, trending TV series, and exclusive cinematic content on CineHub. Premium free media platform with high quality, smooth streaming, and Sinhala subtitles.",
      bannerText: "CineHub High Speed Server පෝට්ෆෝලියෝ සේවාදායකයන් ස්වයංක්‍රීයව ක්‍රියා කරයි. අනෙක් සියලුම සේවා තත්කාලීන පූරණයට සූදානම් කර ඇත. Playback Errors ඇත්නම් Server tabs මාරු කරන්න.",
      activeBot: "gemini-2.0-flash",
      logoGlow: true,
      strictMode: false
    }
  };

  try {
    if (fs.existsSync(DATA_FILE)) {
      const content = fs.readFileSync(DATA_FILE, "utf-8");
      return JSON.parse(content);
    } else {
      fs.writeFileSync(DATA_FILE, JSON.stringify(defaults, null, 2), "utf-8");
    }
  } catch (err) {
    console.error("Failed to load site_data.json, using defaults", err);
  }
  return defaults;
}

function saveSiteData(data: any) {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), "utf-8");
  } catch (err) {
    console.error("Failed to save site_data.json", err);
  }
}

const activeSessions = new Map<string, number>();

setInterval(() => {
  const now = Date.now();
  for (const [id, lastPing] of activeSessions.entries()) {
    if (now - lastPing > 30000) {
      activeSessions.delete(id);
    }
  }
}, 15000);

// Admin Control Panel routes
app.get("/admin", (req, res) => {
  res.sendFile(path.join(process.cwd(), "admin.html"));
});
app.get("/admin.html", (req, res) => {
  res.sendFile(path.join(process.cwd(), "admin.html"));
});

app.get("/api/admin/stats", (req, res) => {
  const now = Date.now();
  for (const [id, lastPing] of activeSessions.entries()) {
    if (now - lastPing > 30000) {
      activeSessions.delete(id);
    }
  }
  const data = loadSiteData();
  res.json({
    visits: data.visits,
    activeSessions: Math.max(1, activeSessions.size)
  });
});

app.get("/api/admin/settings", (req, res) => {
  const data = loadSiteData();
  res.json(data.settings);
});

app.post("/api/admin/settings", (req, res) => {
  const data = loadSiteData();
  data.settings = { ...data.settings, ...req.body };
  saveSiteData(data);
  res.json({ success: true, settings: data.settings });
});

app.post("/api/admin/visit", (req, res) => {
  const data = loadSiteData();
  data.visits = (data.visits || 0) + 1;
  saveSiteData(data);
  res.json({ success: true, visits: data.visits });
});

app.post("/api/admin/heartbeat", (req, res) => {
  const { sessionId } = req.body;
  if (sessionId) {
    activeSessions.set(sessionId, Date.now());
  }
  res.json({ success: true, activeSessions: Math.max(1, activeSessions.size) });
});

// 🤖 Unifed AI Chat Route (Handles both Bot & Smart Analysis)
app.post("/api/chat", async (req, res) => {
  const { message, prompt, responseSchema } = req.body;
  const promptText = message || prompt;

  if (!promptText) {
    return res.status(400).json({ error: "Message or prompt is required" });
  }

  const keysToTry = [
    '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',
    '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'
  ];
  
  const GEMINI_API_KEY = (process.env.GEMINI_API_KEY || 'AIzaSyBN1xR-TmPghY8Y4e0-AIEj_424D8HLIgg').trim();

  // 🚀 @google/genai SDK එක නිවැරදිව Initialize කිරීම
  const aiClient = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

  // Models to process in sequence
  const modelsToTry = [
    "gemini-2.0-flash",
    "gemini-2.5-flash",
    "gemini-flash-latest"
  ];

  // 1️⃣ METHOD 1: Official SDK (Fixed generateContent Syntax)
  for (const modelName of modelsToTry) {
    try {
      console.log(`Server: Trying Official SDK with model: ${modelName}...`);
      
      const options: any = {
        model: modelName,
        contents: promptText,
      };

      // Schema එකක් ආවොත් පමණක් JSON Structured Output සක්‍රීය කරයි
      if (responseSchema) {
        options.config = {
          responseMimeType: "application/json",
          responseSchema: responseSchema
        };
      } else {
        options.config = {
          systemInstruction: "You are a friendly cinema AI assistant on CineHub streaming platform. Reply concisely in friendly colloquial Sinhala or English depending on user message. Recommend movies to watch, ratings, and cast details."
        };
      }
      
      const response = await aiClient.models.generateContent(options);
      const reply = response.text;
      
      if (reply) {
        console.log(`Server: Success with official SDK model: ${modelName}`);
        return res.json({ reply });
      }
    } catch (sdkErr: any) {
      console.warn(`Server: SDK model ${modelName} failed:`, sdkErr?.message || sdkErr);
    }
  }

  // 2️⃣ METHOD 2: OpenRouter Fallback Cascade
  for (const key of keysToTry) {
    try {
      console.log("Server: Falling back to OpenRouter Api...");
      const orBody: any = {
        model: "google/gemini-2.0-flash",
        messages: [
          { role: "system", content: "You are a friendly cinema AI assistant on CineHub streaming platform. Reply concisely in friendly colloquial Sinhala or English depending on user message." },
          { role: "user", content: promptText }
        ]
      };
      
      if (responseSchema) {
        orBody.response_format = { type: "json_object" };
      }

      const orRes = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${key}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "https://cinehub.live",
          "X-Title": "CineHub Media"
        },
        body: JSON.stringify(orBody)
      });

      if (orRes.ok) {
        const orData = await orRes.json();
        const reply = orData?.choices?.[0]?.message?.content;
        if (reply) {
          console.log("Server: Success via OpenRouter.");
          return res.json({ reply });
        }
      }
    } catch (err) {
      console.error("OpenRouter key invocation failed:", err);
    }
  }

  // 3️⃣ METHOD 3: Direct API Fetch Fallback (No SDK dependency)
  for (const fallbackModel of ["gemini-2.0-flash", "gemini-2.5-flash"]) {
    try {
      console.log(`Server: Trying direct HTTP API fetch for ${fallbackModel}...`);
      const directBody: any = {
        contents: [{ parts: [{ text: promptText }] }]
      };
      
      if (responseSchema) {
        directBody.generationConfig = {
          responseMimeType: "application/json",
          responseSchema: responseSchema
        };
      } else {
        directBody.systemInstruction = {
          parts: [{ text: "You are a friendly cinema AI assistant on CineHub streaming platform. Reply concisely in friendly colloquial Sinhala." }]
        };
      }

      const directRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${fallbackModel}:generateContent?key=${GEMINI_API_KEY}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(directBody)
      });

      if (directRes.ok) {
        const resData = await directRes.json();
        const reply = resData?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (reply) {
          console.log(`Server: Direct fetch succeeded using ${fallbackModel}`);
          return res.json({ reply });
        }
      }
    } catch (err) {
      console.error(`Direct fallback for ${fallbackModel} failed:`, err);
    }
  }

  // 4️⃣ METHOD 4: Ultimate Resilient Human Fallback
  console.warn("All backend models failed completely.");
  if (responseSchema) {
    return res.json({
      reply: JSON.stringify({
        sinhala_details: "<b>⚠️ AI සේවාව තාවකාලිකව අක්‍රීයයි:</b> කරුණාකර Hosting Dashboard එකෙහි `GEMINI_API_KEY` නිවැරදිදැයි බලන්න. වීඩියෝව නැරඹීමට පල්ලෙහා තියෙන Server ලින්ක් එකක් ක්ලික් කරන්න.",
        english_details: "<b>⚠️ AI Service offline:</b> Please configure a valid `GEMINI_API_KEY` in your environment variables. Click the streaming links below to watch the content."
      })
    });
  }

  return res.json({
    reply: `👋 **ආයුබෝවන්! මම CineHub AI සහායකයා.** \n\nමේ මොහොතේ අපට සජීවී AI මාදිලි සම්බන්ධ කර ගැනීමට නොහැකි වී ඇත. කරුණාකර ඔබේ Environment Variables වල **\`GEMINI_API_KEY\`** නිවැරදිව සකසා ඇත්දැයි බලන්න!`
  });
});

// 🚀 PRODUCTION ROUTING FIXED FOR ALL HOSTS
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    
    // Static assets සර්ව් කිරීම
    app.use(express.static(distPath));
    
    // ඕනෑම URL එකකට 'dist/index.html' හෝ 'root/index.html' නිවැරදිව පෙන්වීම
    app.get("*", (req, res) => {
      const distIndex = path.join(distPath, "index.html");
      if (fs.existsSync(distIndex)) {
        res.sendFile(distIndex);
      } else {
        res.sendFile(path.join(process.cwd(), "index.html"));
      }
    });
  }

  app.listen(PORT, () => {
    console.log(`🚀 CineHub Server running flawlessly on port ${PORT}`);
  });
}

startServer();