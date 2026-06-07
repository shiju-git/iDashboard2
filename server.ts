/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

let aiClient: GoogleGenAI | null = null;

function getAIClient(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY environment variable is not defined.");
    }
    aiClient = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return aiClient;
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Body parser with 10mb limit for uploaded dataset previews
  app.use(express.json({ limit: '10mb' }));

  // API Endpoint for AI Data Analyst
  app.post("/api/gemini/analyze", async (req, res) => {
    try {
      const { datasetName, columns, rowsPreview, question } = req.body;

      if (!datasetName || !columns || !rowsPreview) {
        return res.status(400).json({ error: "Missing required parameters: datasetName, columns, or rowsPreview" });
      }

      const client = getAIClient();

      const userPrompt = `
Dataset Loaded: "${datasetName}"
Columns and Types: ${JSON.stringify(columns)}
Sample data/Stats Overview:
${JSON.stringify(rowsPreview, null, 2)}

User Question: "${question}"
`;

      const systemInstruction = `
You are a highly capable Senior Data Analyst and Business Intelligence AI.
The user has loaded a custom dataset and wants to extract key insights, explain trends, or identify outliers.
Your answers should be:
1. Highly professional, analytical, objective, and clear.
2. Formatted with clean Markdown (use headers, bullets, or light markdown tables for clarity).
3. Directly answers the user's questions while suggesting the absolute best chart visualizations (such as Area, Line, Bar, Scatter, or custom D3 bubble mappings) to represent their values.
4. Keep the summary under 300 words. Focus strictly on human-readable insights. Do not talk about database structures, server ports, or internal logs.
`;

      const response = await client.models.generateContent({
        model: "gemini-3.5-flash",
        contents: userPrompt,
        config: {
          systemInstruction,
          temperature: 0.7,
        }
      });

      const textOutput = response.text || "No response generated.";
      res.json({ answer: textOutput });

    } catch (err: any) {
      console.error("Gemini API Error in /api/gemini/analyze:", err);
      res.status(500).json({
        error: err.message || "An error occurred during AI analysis. Please ensure your GEMINI_API_KEY is configured in the secrets menu."
      });
    }
  });

  // Serve Vite app in dev, static files in production
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Failed to start full-stack server:", err);
});
