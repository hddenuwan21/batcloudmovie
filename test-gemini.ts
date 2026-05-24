import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";

dotenv.config();

const apiKey = process.env.GEMINI_API_KEY || "AIzaSyBN1xR-TmPghY8Y4e0-AIEj_424D8HLIgg";
console.log("Testing Gemini API Key...");
console.log("API Key exists:", !!process.env.GEMINI_API_KEY);
console.log("API Key length:", process.env.GEMINI_API_KEY ? process.env.GEMINI_API_KEY.length : 0);
console.log("Using API Key prefix:", apiKey.substring(0, 10) + "...");

const ai = new GoogleGenAI({
  apiKey: apiKey,
  httpOptions: {
    headers: {
      "User-Agent": "aistudio-build",
    },
  },
});

async function run() {
  try {
    console.log("Calling Gemini API with gemini-2.5-flash...");
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: "Hello",
    });
    console.log("SUCCESS on gemini-2.5-flash! Response text:", response.text);
  } catch (err: any) {
    console.error("FAILED on gemini-2.5-flash:", err);
  }

  try {
    console.log("Calling Gemini API with gemini-3.5-flash...");
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: "Hello",
    });
    console.log("SUCCESS on gemini-3.5-flash! Response text:", response.text);
  } catch (err: any) {
    console.error("FAILED on gemini-3.5-flash:", err);
  }
}

run();
