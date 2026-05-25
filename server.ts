import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";

const app = express();
// 🚀 Render එකට ගැලපෙන ලෙස නිවැරදිව PORT එක සකස් කිරීම
const PORT = process.env.PORT || 3000;

// 🔒 CORS සදහා ආරක්ෂිත ලියාපදිංචිය - file:// සහ ඕනෑම Origin එකක් සදහා ඉඩ සලසයි (CORS fix)
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
      bannerText: "CineHub High Speed Server පෝට්ෆෝලියෝ සේවාදායකයන් ස්වයංක්‍රීයව ක්‍රියා කරයි. අනෙක් සියලුම සේවා තත්කාලීන පූරණයට සූදානම් කර ඇත. Playback Errors ඇත්නම් Server tabs මාරু කරන්න.",
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

// 🔑 API Key එක ආරක්ෂිතව Render Environment එකෙන් ගන්නවා
const api_key = process.env.GEMINI_API_KEY || "AIzaSyBN1xR-TmPghY8Y4e0-AIEj_424D8HLIgg";
const ai = new GoogleGenAI({
  apiKey: api_key,
  httpOptions: {
    headers: {
      "User-Agent": "aistudio-build",
    },
  },
});

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

// 🤖 💡 නිවැරදි කිරීම: Frontend එකට ගැලපෙන්න route එක "/api/chat" ලෙස වෙනස් කළා
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
  const GEMINI_API_KEY = process.env.GEMINI_API_KEY || 'AIzaSyBN1xR-TmPghY8Y4e0-AIEj_424D8HLIgg';

  // 1. Official SDK
  try {
    console.log("Server: Attempting official Gemini API...");
    const config: any = {};
    if (responseSchema) {
      config.responseMimeType = "application/json";
      config.responseSchema = responseSchema;
    }
    
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: promptText,
      config: config
    });

    const reply = response.text;
    if (reply) return res.json({ reply });
  } catch (sdkErr) {
    console.warn("Server: Gemini SDK failed. Trying OpenRouter...", sdkErr);
  }

  // 2. OpenRouter Cascade
  for (const key of keysToTry) {
    try {
      const orBody: any = {
        model: "google/gemini-2.5-flash",
        messages: [{ role: "user", content: promptText }]
      };
      if (responseSchema) {
        orBody.response_format = { type: "json_object" };
      }

      const orRes = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${key}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "https://cinehub-3zqz.onrender.com",
          "X-Title": "CineHub Media"
        },
        body: JSON.stringify(orBody)
      });

      if (orRes.ok) {
        const orData = await orRes.json();
        const reply = orData?.choices?.[0]?.message?.content;
        if (reply) return res.json({ reply });
      }
    } catch (err) {
      console.error("OpenRouter alternative key failed:", err);
    }
  }

  // 3. Direct Fetch Fallback
  try {
    const directBody: any = {
      contents: [{ parts: [{ text: promptText }] }]
    };
    if (responseSchema) {
      directBody.generationConfig = {
        responseMimeType: "application/json",
        responseSchema: responseSchema
      };
    }

    const directRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(directBody)
    });

    if (directRes.ok) {
      const resData = await directRes.json();
      const reply = resData?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (reply) return res.json({ reply });
    }
  } catch (err) {
    console.error("Direct fallback failed:", err);
  }

  return res.status(500).json({ error: "All backend models failed" });
});

// 🚀 PRODUCTION ROUTING FIXED FOR RENDER
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
    
    // dist එකේ index.html නැතිනම් root එකේ index.html එක පෙන්වීම
    app.get("*", (req, res) => {
      const distIndex = path.join(distPath, "index.html");
      if (fs.existsSync(distIndex)) {
        res.sendFile(distIndex);
      } else {
        res.sendFile(path.join(process.cwd(), "index.html"));
      }
    });
  }

  // 💡 Render එකට වඩාත්ම ආරක්ෂිත listen ක්‍රමය
  app.listen(PORT, () => {
    console.log(`Server running safely on port ${PORT}`);
  });
}

startServer();