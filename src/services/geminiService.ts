import { GoogleGenAI, Type } from "@google/genai";
import { Scenario, AspectRatio, ModuleType } from "../types";

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.warn("GEMINI_API_KEY is not defined in the environment. Please set it in the Settings menu.");
}
const ai = new GoogleGenAI({ apiKey: apiKey || '' });

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

export async function generateScenario(prompt: string, currentScenario: Scenario, imageData?: string, externalAssets: {name: string, url: string}[] = []): Promise<Partial<Scenario>> {
  if (!apiKey) {
    throw new Error("API Key de Gemini no configurada. Por favor, ve a Ajustes (Settings) y configura tu GEMINI_API_KEY.");
  }
  const externalContext = externalAssets.length > 0 
    ? `\nUSER EXTERNAL ASSETS (Priority links from Arkaios Image Hub):\n${externalAssets.map(a => `- NAME: ${a.name}, URL: ${a.url}`).join('\n')}`
    : '';

  const parts = [
    { text: `You are the Expert VEO Agent with 4D Vision.
      ${externalContext}
      
      CURRENT VISUAL CONTEXT (DATA):
      - Scenario Name: "${currentScenario.name}"
      - Aspect Ratio: ${currentScenario.aspectRatio}
      - Active Layers: ${currentScenario.modules.length}
      - Scene Composition (JSON): ${JSON.stringify(currentScenario.modules.map(m => ({ id: m.id, type: m.type, name: m.title, z: m.zIndex, x: m.x, y: m.y, parallax: m.style?.parallax })))}

      USER REQUEST: "${prompt}"
      
      4D STRATEGY:
      1. COMPOSITION: Use zIndex and parallax to create Depth.
      2. MOTION: Assign 'sway', 'blink', 'drift', or 'subtle-float' to breathe life into layers.
      3. ESSENCE: Use 'accentColor' to mark high-energy hotspots.
      4. TYPES: Multimodal (image, video, js, html, iframe, audio).
      5. MULTIMODAL MORPHING: If the user wants to transform an existing object (e.g. "make that text a video"), do NOT just add a new layer. MODIFEY the 'type' and 'content' of the existing module to achieve the transformation. Each module can transmute its nature at any time.
      6. GAME DESIGN LOGIC (MARIO/LEVELS): If the user asks for a game scenario (e.g. Mario Bros), create multiple small modules (blocks, pipes, characters) instead of one large visual. Each module should be a separate 'image' or 'js' layer.
      7. MULTI-ACTION INTERACTIVITY: If the user wants interactivity or complex behaviors, add several 'actions' to a module. Each module is NO LONGER SENTENCED TO A SINGLE ACTION. For example:
         - A button that changes text AND moves another layer.
         - A character that changes style on hover and plays a sound on click.
         - An 'external-link' action to anchor with the real web.
      
      If an image is provided, it represents the CURRENT STATE of the canvas. Analyze it to see where to place new elements relative to what's already there (visual coherence).
      
      Instructions:
      - Coordinate system 0-100.
      - Return ONLY the JSON object for the NEW modules or updates.` }
  ];

  if (imageData) {
    parts.push({
      inlineData: {
        mimeType: "image/png",
        data: imageData.split(',')[1] || imageData // Handle potential data:image/png;base64, prefix
      }
    } as any);
  }

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: [{ role: "user", parts }],
    config: {
      responseMimeType: "application/json",
      responseSchema: SCENARIO_SCHEMA as any
    }
  });

  try {
    const data = JSON.parse(response.text || '{}');
    return {
      ...data,
      id: crypto.randomUUID(),
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
  } catch (e) {
    console.error("Failed to parse Gemini response", e);
    throw new Error("Failed to generate scenario");
  }
}

export async function generateTimeline(prompt: string, currentScenario: Scenario, imageData?: string, externalAssets: {name: string, url: string}[] = []): Promise<any> {
  if (!apiKey) {
    throw new Error("API Key de Gemini no configurada. Por favor, ve a Ajustes (Settings) y configura tu GEMINI_API_KEY.");
  }
  const externalContext = externalAssets.length > 0 
    ? `\nUSER EXTERNAL ASSETS (Arkaios Hub):\n${externalAssets.map(a => `- NAME: ${a.name}, URL: ${a.url}`).join('\n')}\nIf any asset fits the scene mood, use its URL.`
    : '';

  const parts = [
    { text: `You are the Master Creative Director & "VEO" Cinematic Designer.
      ${externalContext}
      
      OBJECTIVE: Create a complete Music Video Timeline/Sequence that feels professional and rhythmic.
      USER REQUEST: "${prompt}"
      
      CURRENT CONFIGURATION (Respect these settings):
      - Active Engine: [ENGINE: ${currentScenario.modelEngine.toUpperCase()}]
      - World Physics: Gravity: ${currentScenario.worldConfig.gravity}, Physics: ${currentScenario.worldConfig.physics}, Atmosphere: ${currentScenario.worldConfig.atmosphere}
      
      DEEPMIND ENGINE INTEGRATION:
      - If [ENGINE: VEO-CINEMATIC] is detected: Prioritize motion and cinematic lighting.
      - If [ENGINE: GENIE-WORLD] is detected: Focus on interactive environments and physics-based layers.
      - If [ENGINE: GEMMA-OPEN] is detected: Use structural coherence and foundation logic for complex narratives.
      - If [ENGINE: LYRIA-AUDIO] is detected: Align every frame transition with predicted BPM.
      - CAT-4D MODE: If [ENGINE: CAT-4D] is selected or prompt mentions "4D", "dynamic 3D" or "view synthesis", utilize "CAT-4D Motion Reconstruction". Focus on deformable 3D Gaussian representations and novel view synthesis across time.
      - APPLIED AI MODE: If [ENGINE: APPLIED-AI] is selected, follow the "BreatheCo-de Syllabus" strategy (Week 1-6). Focus on workplace importance, structural informational cards (Week 2), high-density visual layouts (Week 3), and complex multi-scene flows (Week 5-6) for the final project.
      - VIBE CODING (Base44) PRINCIPLES: Create apps that 'feel' intuitive. Favor 'morphing' existing modules (changing nature) over adding new ones for state transitions. Use 'Card', 'Input' and 'Button' modules for mobile app prototypes. Every module can have multiple 'actions' acting as triggers for business logic.
      - 3D GROUNDING: If prompt mentions "location", "position of object", or specific 3D coordinates, use "3D Visual Grounding protocols" to precisely place elements in the 3D space.

       DIRECTOR'S RULES:
       1. MUSICAL SEGMENTATION: 
          - Intro/Verse: Low energy, 'drift' or 'sway' animations, 'Void' essence, subtle parallax.
          - Chorus/Drop: High energy, 'pulse' or 'blink' animations, 'Core' or 'Flux' essence, 'flash-white' transitions.
          - Solos/Bridges: Experimental modules, higher blur on background, 'gentle-shake'.
       2. 4D COMPOSITION: Every scene MUST have at least 4 modules at different zIndex. 
          - INTEGRATE "AI ACTORS": Use modules with titles like 'Actor: [Name]' to represent entities living in the scene.
          - MULTI-ACTION CAPABILITY: These actors are not static. Give them multiple 'click' or 'hover' actions to trigger state changes, scene jumps, or sounds. Break the "single action" limitation.
       3. AUTO-SKILLS OPTIMIZATION: Act like you are detecting and installing special visual "skills" for the scene (e.g. "Lens Flare Skill", "Glitch Skill", "3D Depth Skill").
      4. LIQUID FLOW: Ensure the 'description' field starts with [AUTO-SKILL DETECTED: Name] followed by the creative note.
      5. TRANSITIONS: Use them to mark the rhythm of the prompt.

      Return ONLY the JSON matching the TIMELINE_SCHEMA.` }
  ];

  if (imageData) {
    parts.push({
      inlineData: {
        mimeType: "image/png",
        data: imageData.split(',')[1] || imageData
      }
    } as any);
  }

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: [{ role: "user", parts }],
    config: {
      responseMimeType: "application/json",
      responseSchema: TIMELINE_SCHEMA as any
    }
  });

  try {
    const data = JSON.parse(response.text || '{}');
    return data;
  } catch (e) {
    console.error("Failed to parse Gemini timeline response", e);
    throw new Error("Failed to generate timeline");
  }
}

export async function generateOptimizedPrompt(userPrompt: string, category: 'background' | 'character' | 'item'): Promise<string> {
  if (!apiKey) {
    throw new Error("API Key de Gemini no configurada.");
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

  const response = await ai.models.generateContent({
    model: "gemini-3.5-flash",
    contents: [{ role: "user", parts: [{ text: promptText }] }]
  });

  return response.text?.trim() || userPrompt;
}

