import express from "express";
import path from "path";
import fs from "fs";
import { spawn } from "child_process";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3005;

app.use(express.json({ limit: '10mb' }));

// Shared Gemini Client (Lazy Initialized)
let aiInstance: GoogleGenAI | null = null;

function getAi(): GoogleGenAI {
  if (!aiInstance) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.warn("GEMINI_API_KEY is not defined in the environment during initialization.");
    }
    aiInstance = new GoogleGenAI({ 
      apiKey: apiKey || '',
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return aiInstance;
}

async function generateContentWithFallback(options: {
  contents: any[];
  config?: any;
}) {
  const models = ["gemini-2.5-flash", "gemini-1.5-flash", "gemini-3.5-flash"];
  let lastError: any = null;

  for (const model of models) {
    try {
      console.log(`[GEMINI_ROUTING] Attempting generation with model: ${model}`);
      const response = await getAi().models.generateContent({
        model,
        contents: options.contents,
        config: options.config,
      });
      return response;
    } catch (err: any) {
      console.warn(`[GEMINI_ROUTING] Model ${model} failed:`, err.message || err);
      lastError = err;
    }
  }
  throw lastError || new Error("All Gemini models failed to respond.");
}

const SCENARIO_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    name: { type: Type.STRING },
    aspectRatio: { type: Type.STRING, enum: ['4:3', '16:9', '16:10'] },
    backgroundColor: { type: Type.STRING },
    modules: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          type: { type: Type.STRING, enum: ['text', 'video', 'image', 'html', 'link', 'iframe', 'audio', 'js'] },
          title: { type: Type.STRING },
          content: { type: Type.STRING },
          x: { type: Type.NUMBER },
          y: { type: Type.NUMBER },
          width: { type: Type.NUMBER },
          height: { type: Type.NUMBER },
          zIndex: { type: Type.NUMBER },
          actions: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.STRING },
                trigger: { type: Type.STRING, enum: ['click', 'hover', 'enter', 'exit', 'timer'] },
                effect: { type: Type.STRING, enum: ['move', 'scale', 'opacity', 'style', 'content', 'scene', 'sound', 'physics', 'external-link'] },
                payload: { type: Type.OBJECT }
              },
              required: ['trigger', 'effect', 'payload']
            }
          },
          style: {
            type: Type.OBJECT,
            properties: {
              borderRadius: { type: Type.NUMBER },
              backgroundColor: { type: Type.STRING },
              opacity: { type: Type.NUMBER },
              borderWidth: { type: Type.NUMBER },
              borderColor: { type: Type.STRING },
              parallax: { type: Type.NUMBER },
              blur: { type: Type.NUMBER },
              animation: { type: Type.STRING, enum: ['subtle-float', 'pulse', 'gentle-shake', 'sway', 'blink', 'drift', 'none'] },
              accentColor: { type: Type.STRING }
            }
          }
        },
        required: ['type', 'title', 'content', 'x', 'y', 'width', 'height']
      }
    }
  },
  required: ['name', 'aspectRatio', 'modules']
};

const TIMELINE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    scenes: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          timestamp: { type: Type.NUMBER },
          duration: { type: Type.NUMBER },
          description: { type: Type.STRING },
          transition: { type: Type.STRING, enum: ['none', 'crossfade', 'flash-white', 'flash-black'] },
          modules: (SCENARIO_SCHEMA.properties.modules as any)
        },
        required: ['timestamp', 'duration', 'modules', 'transition']
      }
    }
  },
  required: ['scenes']
};

// API Endpoints
app.post("/api/generate-scenario", async (req, res) => {
  try {
    const { prompt, currentScenario, imageData, externalAssets } = req.body;
    if (!process.env.GEMINI_API_KEY) {
      return res.status(400).json({ error: "API Key de Gemini no configurada." });
    }

    const externalContext = externalAssets && externalAssets.length > 0 
      ? `\nUSER EXTERNAL ASSETS (Priority links from Arkaios Image Hub):\n${externalAssets.map((a: any) => `- NAME: ${a.name}, URL: ${a.url}`).join('\n')}`
      : '';

    const parts: any[] = [
      { text: `You are the Expert VEO Agent with 4D Vision.
        ${externalContext}
        
        CURRENT VISUAL CONTEXT (DATA):
        - Scenario Name: "${currentScenario.name}"
        - Aspect Ratio: ${currentScenario.aspectRatio}
        - Active Layers: ${currentScenario.modules.length}
        - Scene Composition (JSON): ${JSON.stringify(currentScenario.modules.map((m: any) => ({ id: m.id, type: m.type, name: m.title, z: m.zIndex, x: m.x, y: m.y, parallax: m.style?.parallax })))}

        USER REQUEST: "${prompt}"
        
        4D STRATEGY:
        1. COMPOSITION: Use zIndex and parallax to create Depth.
        2. MOTION: Assign 'sway', 'blink', 'drift', or 'subtle-float' to breathe life into layers.
        3. ESSENCE: Use 'accentColor' to mark high-energy hotspots.
        4. TYPES: Multimodal (image, video, js, html, iframe, audio).
        5. MULTIMODAL MORPHING: If the user wants to transform an existing object (e.g. "make that text a video"), do NOT just add a new layer. MODIFEY the 'type' and 'content' of the existing module to achieve the transformation. Each module can transmute its nature at any time.
        6. GAME DESIGN LOGIC (MARIO/LEVELS): If the user asks for a game scenario (e.g. Mario Bros), create multiple small modules (blocks, pipes, characters) instead of one large visual. Each module should be a separate 'image' or 'js' layer.
        7. MULTI-ACTION INTERACTIVE: If the user wants interactivity or complex behaviors, add several 'actions' to a module. Each module is NO LONGER SENTENCED TO A SINGLE ACTION.
        
        If an image is provided, it represents the CURRENT STATE of the canvas. Analyze it to see where to place new elements relative to what's already there (visual coherence).
        
        Instructions:
        - Coordinate system 0-100.
        - Return ONLY the JSON object for the NEW modules or updates.` }
    ];

    if (imageData) {
      parts.push({
        inlineData: {
          mimeType: "image/png",
          data: imageData.split(',')[1] || imageData
        }
      });
    }

    const response = await generateContentWithFallback({
      contents: [{ role: "user", parts }],
      config: {
        responseMimeType: "application/json",
        responseSchema: SCENARIO_SCHEMA as any
      }
    });

    const text = response.text || '{}';
    const data = JSON.parse(text);
    res.json(data);
  } catch (err: any) {
    console.error("Error in generate-scenario API:", err);
    res.status(500).json({ error: err.message || "Failed to generate scenario" });
  }
});

app.post("/api/generate-timeline", async (req, res) => {
  try {
    const { prompt, currentScenario, imageData, externalAssets } = req.body;
    if (!process.env.GEMINI_API_KEY) {
      return res.status(400).json({ error: "API Key de Gemini no configurada." });
    }

    const externalContext = externalAssets && externalAssets.length > 0 
      ? `\nUSER EXTERNAL ASSETS (Arkaios Hub):\n${externalAssets.map((a: any) => `- NAME: ${a.name}, URL: ${a.url}`).join('\n')}\nIf any asset fits the scene mood, use its URL.`
      : '';

    const parts: any[] = [
      { text: `You are the Master Creative Director & "VEO" Cinematic Video Designer.
        ${externalContext}
        
        OBJECTIVE: Create a complete Music Video Timeline/Sequence that feels professional, rhythmic, and aesthetically unified.
        USER REQUEST: "${prompt}"
        
        CURRENT CONFIGURATION (Respect these settings):
        - Active Engine: [ENGINE: ${currentScenario.modelEngine.toUpperCase()}]
        - World Physics: Gravity: ${currentScenario.worldConfig.gravity}, Physics: ${currentScenario.worldConfig.physics}, Atmosphere: ${currentScenario.worldConfig.atmosphere}
        
        DEEPMIND ENGINE INTEGRATION:
        - If [ENGINE: VEO-CINEMATIC] is detected: Prioritize cinematic lighting, rich motion paths, and high-fidelity video cuts.
        - If [ENGINE: GENIE-WORLD] is detected: Focus on stylized interactive environments and responsive video modules.
        - If [ENGINE: LYRIA-AUDIO] is detected: Align every frame transition with predicted BPM.
        
        DIRECTOR'S RULES:
        1. TIME STRUCTURE & SEQUENCING:
           - Each scene MUST have a duration of **maximum 8 seconds** (ideally between 4 and 8 seconds, e.g. 6s or 8s).
           - Timestamps MUST be strictly chronological and consecutive (e.g., Scene 0 starts at 0 with duration 6; Scene 1 starts at 6 with duration 8; Scene 2 starts at 14 with duration 6; and so on).
           - Provide enough scenes (typically 4 to 7 scenes) to represent a cohesive artistic flow or song structure matching the user's prompt or the estimated song duration.
        
        2. VIDEO-CENTRIC DESIGN (CONGRUENCIA GRÁFICA):
           - Focus 100% on generating clean visual modules of type 'video'. Do NOT clutter the interface with unrequested buttons, input fields, or text boxes.
           - Each scene MUST contain at least one main, background-filling or centralized 'video' module (e.g. width: 100, height: 100, x: 0, y: 0) representing a high-quality video clip.
           - Maintain a strong graphic, stylistic, and aesthetic continuity (e.g. same characters, color palette, lighting theme, anime/cinematic style) from scene to scene, so that they feel like consecutive cuts of the same music video or film.
           - Describe the visual content in the 'content' field as a premium cinematic prompting string or use high-quality video URLs from the Arkaios Asset Hub (if available).
        
        3. AUTO-SKILLS OPTIMIZATION:
           - Define active visual styles or filters in the description field (e.g. starting with "[AUTO-SKILL DETECTED: Glitch Effect]" or "[AUTO-SKILL DETECTED: Lens Flare]" or "[AUTO-SKILL DETECTED: Shinkai Sunset]" to signify the artistic filter applied to that scene's video).
        
        4. TRANSITIONS:
           - Use 'crossfade', 'flash-white', or 'flash-black' transitions to mark the rhythmic shifts between segments.

        Return ONLY the JSON matching the TIMELINE_SCHEMA.` }
    ];

    if (imageData) {
      parts.push({
        inlineData: {
          mimeType: "image/png",
          data: imageData.split(',')[1] || imageData
        }
      });
    }

    const response = await generateContentWithFallback({
      contents: [{ role: "user", parts }],
      config: {
        responseMimeType: "application/json",
        responseSchema: TIMELINE_SCHEMA as any
      }
    });

    const text = response.text || '{}';
    const data = JSON.parse(text);
    res.json(data);
  } catch (err: any) {
    console.error("Error in generate-timeline API:", err);
    res.status(500).json({ error: err.message || "Failed to generate timeline" });
  }
});

app.post("/api/optimize-prompt", async (req, res) => {
  try {
    const { userPrompt, category } = req.body;
    if (!process.env.GEMINI_API_KEY) {
      return res.status(400).json({ error: "API Key de Gemini no configurada." });
    }

    const promptText = `You are an ultimate Anime/Manga Art Director. 
    Your job is to translate the user's brief description or concept into a detailed, professional, and visually rich anime prompt optimized for image generation models (like Stable Diffusion, Midjourney, or DALL-E) to produce optimal anime assets.

    The user wants an asset of type: ${category}.
    User Request: "${userPrompt}"

    Requirements for the prompt:
    1. For 'background': Describe epic anime wallpaper details, focus on scenery, atmospheric lighting (sunset, cinematic rays), depth, standard empty or structured spaces, Ghibli, Makoto Shinkai or CoMix Wave style. Keep it clear of main character details if they just want a background scenery.
    2. For 'character': Must emphasize "isolated on a clean, solid white background" or "solid color translucent background for easy png extraction" or explicitly requests alpha transparency keywords. Mention dynamic poses, beautiful anime lineart, clean colors.
    3. For 'item': Describe objects, assets, or props on solid white backgrounds. Beautiful materials, detailed textures, clean vector-like outline.
    4. Format the output to be a cohesive comma-separated string of descriptive visual tags and styles in English, which is the native language of image models.

    Return ONLY the optimized english prompt text itself as a direct string response. No markdown formatting, no JSON, no quotes around the response, just the final prompt string.`;

    const response = await generateContentWithFallback({
      contents: [{ role: "user", parts: [{ text: promptText }] }]
    });

    res.json({ result: response.text?.trim() || userPrompt });
  } catch (err: any) {
    console.error("Error in optimize-prompt API:", err);
    res.status(500).json({ error: err.message || "Failed to optimize prompt" });
  }
});

// ==========================================================
//  VIDEOCLIP STUDIO COMPILER API (FFMPEG + KEN BURNS + SUBS)
// ==========================================================
const rendersDir = path.join(process.cwd(), "public", "renders");
if (!fs.existsSync(rendersDir)) {
  fs.mkdirSync(rendersDir, { recursive: true });
}
app.use("/renders", express.static(rendersDir));

app.post("/api/videoclip/render", async (req, res) => {
  try {
    const { audioPath, aspectRatio = "16:9", scenes = [], subtitlesText = "", mode = "full_motion", disableSubtitles = true } = req.body;
    const jobId = `vc_${Date.now()}`;
    const jobDir = path.join(rendersDir, jobId);
    fs.mkdirSync(jobDir, { recursive: true });

    const config = {
      jobId,
      outputDir: jobDir,
      audioPath,
      aspectRatio,
      scenes,
      subtitlesText,
      mode,
      disableSubtitles
    };

    const configPath = path.join(jobDir, "config.json");
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2), "utf-8");

    fs.writeFileSync(path.join(jobDir, "progress.json"), JSON.stringify({
      progress: 0,
      status: "QUEUED",
      details: "En cola de renderizado en servidor ARKAIOS..."
    }), "utf-8");

    const pythonExe = process.env.PYTHON_PATH || (process.platform === "win32" ? "C:\\Python314\\python.exe" : "python3");
    const scriptPath = path.join(process.cwd(), "services", "videoclipCompiler.py");
    const child = spawn(pythonExe, [scriptPath, configPath], {
      detached: true,
      stdio: "ignore"
    });
    child.unref();

    res.json({
      ok: true,
      jobId,
      statusUrl: `/api/videoclip/status/${jobId}`,
      videoUrl: `/renders/${jobId}/final_videoclip.mp4`
    });
  } catch (err: any) {
    console.error("Error starting videoclip render:", err);
    res.status(500).json({ error: err.message || "Failed to start render" });
  }
});

app.get("/api/videoclip/status/:jobId", (req, res) => {
  try {
    const { jobId } = req.params;
    const progressFile = path.join(rendersDir, jobId, "progress.json");
    if (!fs.existsSync(progressFile)) {
      return res.status(404).json({ error: "Trabajo de render no encontrado" });
    }
    const data = JSON.parse(fs.readFileSync(progressFile, "utf-8"));
    res.json({
      ok: true,
      jobId,
      ...data,
      videoUrl: `/renders/${jobId}/final_videoclip.mp4`
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

async function start() {
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

start();
