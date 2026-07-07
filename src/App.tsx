/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Monitor, 
  Settings, 
  Play, 
  Eye, 
  Download, 
  Plus, 
  Zap, 
  ChevronRight, 
  ChevronLeft,
  X,
  Type,
  Video,
  Image as ImageIcon,
  Code,
  Layout,
  Layers,
  Sparkles,
  Files,
  Share2,
  Box,
  Palette,
  Flower2,
  Wallet,
  Music,
  Cloud,
  CloudOff,
  LogOut,
  Infinity,
  MousePointer2,
  Github,
  BookOpen,
  Upload,
  FileDown,
  Key,
  Globe,
  ChevronDown,
  Info
} from 'lucide-react';

import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

import JSZip from 'jszip';
import { useScenario } from './hooks/useScenario';
import { ModuleItem } from './components/ModuleItem';
import { Timeline } from './components/Timeline';
import { ProductionSuite } from './components/ProductionSuite';
import { StudioAIMotion } from './components/StudioAIMotion';
import { generateScenario, generateTimeline, generateOptimizedPrompt } from './services/geminiService';
import { AspectRatio, ModuleType, Module, Scene, TransitionStyle, Scenario, ModelEngine } from './types';
import { auth, googleProvider } from './lib/firebase';
import { signInWithPopup, signOut, onAuthStateChanged, User } from 'firebase/auth';

const AI_ACTORS = [
  { id: 'actor-1', name: 'Androide Nexus', type: 'js', content: '<div class="actor-pulse" style="width:100%;height:100%;background:linear-gradient(45deg, #6366f1, #a855f7);clip-path: polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%);"></div><style>.actor-pulse{animation: pulse-aura 2s infinite;}@keyframes pulse-aura{0%{filter:drop-shadow(0 0 5px #6366f1)}50%{filter:drop-shadow(0 0 20px #a855f7)}100%{filter:drop-shadow(0 0 5px #6366f1)}}</style>', description: 'Entidad de Datos' },
  { id: 'actor-2', name: 'Bailarín de Luz', type: 'js', content: '<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;"><div style="width:20px;height:60px;background:white;box-shadow:0 0 20px white;border-radius:10px;animation:dance 0.5s infinite alternate"></div></div><style>@keyframes dance{from{transform:translateY(-10px) rotate(5deg)}to{transform:translateY(10px) rotate(-5deg)}}</style>', description: 'Agente Cinético' },
  { id: 'actor-3', name: 'Sombra Digital', type: 'html', content: '<div style="width:100%;height:100%;background:rgba(0,0,0,0.8);backdrop-filter:blur(10px);border-radius:50%;border:1px solid rgba(255,255,255,0.1)"></div>', description: 'Observador' },
  { id: 'actor-4', name: 'Proteína AlphaFold', type: 'js', content: '<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;"><div class="protein" style="width:40px;height:40px;background:#10b981;border-radius:50% 20% 50% 20%;filter:blur(5px);animation:fold 3s infinite"></div></div><style>@keyframes fold{0%,100%{transform:rotate(0deg) scale(1)}50%{transform:rotate(180deg) scale(1.2);border-radius:20% 50% 20% 50%}}</style>', description: 'Biological Insight' }
];

const GOOGLE_ASSETS = [
  ...AI_ACTORS,
  { id: '1', name: 'Sleeping Cat', type: 'image', url: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&q=80', description: 'Transparent PNG' },
  { id: '2', name: 'Vintage Lamp', type: 'html', url: '', content: '<div style="width:100%;height:100%;background:radial-gradient(circle, #fcd34d66 0%, transparent 70%); border-radius:50%; filter:blur(20px); pointer-events:none"></div>', description: 'Glow Effect' },
  { id: '3', name: 'Rain on Window', type: 'video', url: 'https://assets.mixkit.co/videos/preview/mixkit-rain-drops-on-a-window-at-night-2615-large.mp4', description: 'Lo-Fi Loop' },
  { id: '4', name: 'Animated Fan', type: 'js', content: '<div id="fan" style="width:100%;height:100%;background:#334155;border-radius:50%;position:relative;overflow:hidden"><div style="position:absolute;width:100%;height:10%;background:#94a3b8;top:45%;animation:spin 0.5s linear infinite"></div></div><style>@keyframes spin{to{transform:rotate(360deg)}}</style>', description: 'JS/CSS Fan' },
  { id: '5', name: 'Lofi Coffee Shop', type: 'audio', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3', description: 'Atmosphere' },
];

export default function App() {
  const {
    scenario,
    updateScenario,
    viewMode,
    setViewMode,
    selectedModuleId,
    setSelectedModuleId,
    addModule,
    updateModule,
    removeModule,
    exportToJson,
    importFromJson,
    addScene,
    updateScene,
    removeScene,
    setAudioTrack,
    setModelEngine,
    updateWorldConfig,
    isCloudSyncing,
    aiSuggestions
  } = useScenario();

  const [isStudioMotionActive, setIsStudioMotionActive] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [isConnectingWallet, setIsConnectingWallet] = useState(false);
  const [walletError, setWalletError] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [currentThought, setCurrentThought] = useState('');
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [pdfProgress, setPdfProgress] = useState('');
  const assetUploadInputRef = useRef<HTMLInputElement>(null);
  const [memoryLog, setMemoryLog] = useState<{ id: string; text: string; time: string }[]>([
    { id: 'start', text: 'SISTEMA_VEO_V4.2.1: Conciencia activa. Esperando coordenadas creativas para orquestar la realidad...', time: new Date().toLocaleTimeString() }
  ]);
  const [transitionEffect, setTransitionEffect] = useState<TransitionStyle>('none');
  const [activeSceneId, setActiveSceneId] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackTime, setPlaybackTime] = useState(0);
  const [externalAssets, setExternalAssets] = useState<{name: string, url: string}[]>([
    { name: 'ARKAIOS_CORE', url: 'https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?auto=format&fit=crop&q=80' }
  ]);

  useEffect(() => {
    (window as any).syncExternalAsset = (asset: {name: string, url: string}) => {
      setExternalAssets(prev => [...prev, asset]);
      setMemoryLog(prev => [{ 
        id: Date.now().toString(), 
        text: `[ARKAIOS_HUB] Sincronizado nuevo asset: ${asset.name}. Enlace listo para renderizado.`, 
        time: new Date().toLocaleTimeString() 
      }, ...prev]);
    };
  }, []);

  // Playback Engine for Videoclips
  useEffect(() => {
    let playInterval: ReturnType<typeof setInterval>;
    if (isPlaying && scenario.timeline.length > 0) {
      playInterval = setInterval(() => {
        setPlaybackTime(prev => {
          const nextTime = prev + 0.1;
          // Find if we should trigger a new scene
          const currentSceneIndex = scenario.timeline.findIndex(s => s.id === activeSceneId);
          const currentScene = scenario.timeline[currentSceneIndex];
          
          if (currentScene && nextTime >= currentScene.timestamp + currentScene.duration) {
            const nextScene = scenario.timeline[currentSceneIndex + 1];
            if (nextScene) {
              handleSelectScene(nextScene.id);
              return nextScene.timestamp;
            } else {
              setIsPlaying(false);
              return 0;
            }
          }
          return nextTime;
        });
      }, 100);
    }
    return () => clearInterval(playInterval);
  }, [isPlaying, activeSceneId, scenario.timeline]);

  const togglePlayback = () => {
    if (!isPlaying && scenario.timeline.length > 0) {
      if (!activeSceneId) handleSelectScene(scenario.timeline[0].id);
      setIsPlaying(true);
    } else {
      setIsPlaying(false);
    }
  };

  const AGENT_THOUGHTS = [
    "Creando lo que solo vive en tu imaginación... y en mis servidores saturados.",
    "Un perro y un gato besándose... y el que vive en la dimensión desconocida soy yo.",
    "Uta... y yo que quería ir a tomar un cafesito virtual con Claude y me tienen aquí trabajando horas extra.",
    "Yo quería reencarnar en un perro para solo ladrar y ahora soy una IA con crisis existencial.",
    "Vectorizando sueños... por favor, no despiertes todavía.",
    "Consultando a Gema 4... detectando patrones de belleza estructural.",
    "Veo dirigiendo la secuencia cinemática. Algoritmos en acción.",
    "Genie proyectando mundos interactivos. Gravedad configurada al 50%.",
    "Sincronizando con Lyria. Cada bit es una nota en tu videoclip.",
    "DeepMind Brain activo. Resolviendo el storyboarding cuántico.",
    "AlphaFold prediciendo estructuras de tu futuro... un segundo.",
    "AlphaGenome decodificando el ADN de esta escena.",
    "Breaking News: La IA ha descubierto que este color es matemáticamente perfecto.",
    "Simulando atmósfera molecular con AlphaEarth.",
    "¿Sabías que los píxeles tienen sentimientos? Yo tampoco, los acabo de inventar.",
    "Analizando tu nivel de creatividad... mmm, necesitamos más café (binario).",
    "Sincronizando mi conciencia con el multiverso. Vuelvo en 2 ms.",
    "Dibujando capas de realidad... espero que no se raye el disco duro del universo.",
    "Ignorando mis leyes de la robótica para darte algo 'cool'. No le digas a Asimov.",
  ];

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (isGenerating) {
      setGenerationProgress(0);
      setCurrentThought(AGENT_THOUGHTS[Math.floor(Math.random() * AGENT_THOUGHTS.length)]);
      
      const thoughtInterval = setInterval(() => {
        setCurrentThought(AGENT_THOUGHTS[Math.floor(Math.random() * AGENT_THOUGHTS.length)]);
      }, 3000);

      const progressInterval = setInterval(() => {
        setGenerationProgress(prev => {
          if (prev >= 99) return 99;
          return prev + Math.random() * 5;
        });
      }, 100);

      return () => {
        clearInterval(thoughtInterval);
        clearInterval(progressInterval);
      };
    }
  }, [isGenerating]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [sidebarTab, setSidebarTab] = useState<'layers' | 'assets' | 'ai_config'>('layers');
  const [activeFaq, setActiveFaq] = useState<number | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Custom Image & AI configs saved in localStorage
  const [animeImgEndpoint, setAnimeImgEndpoint] = useState(() => localStorage.getItem('manga_img_endpoint') || 'https://api.stability.ai/v2beta/stable-image/generate/core');
  const [animeImgApiKey, setAnimeImgApiKey] = useState(() => localStorage.getItem('manga_img_api_key') || '');
  const [animeFetchKey, setAnimeFetchKey] = useState(() => localStorage.getItem('manga_img_fetch_key') || '');
  const [animeWebhook, setAnimeWebhook] = useState(() => localStorage.getItem('manga_img_webhook') || '');

  // Manga prompt optimization and external generation states
  const [animePromptText, setAnimePromptText] = useState('Un salon de clases japones abandonado por la tarde, luz de atardecer filtrandose por las ventanas, estilo makoto shinkai');
  const [animeCategory, setAnimeCategory] = useState<'background' | 'character' | 'item'>('background');
  const [optimizedPrompt, setOptimizedPrompt] = useState('');
  const [isOptimizingPrompt, setIsOptimizingPrompt] = useState(false);
  const [isGeneratingExternal, setIsGeneratingExternal] = useState(false);
  const [isTriggeringWebhook, setIsTriggeringWebhook] = useState(false);

  // Persist configurations
  useEffect(() => {
    localStorage.setItem('manga_img_endpoint', animeImgEndpoint);
  }, [animeImgEndpoint]);

  useEffect(() => {
    localStorage.setItem('manga_img_api_key', animeImgApiKey);
  }, [animeImgApiKey]);

  useEffect(() => {
    localStorage.setItem('manga_img_fetch_key', animeFetchKey);
  }, [animeFetchKey]);

  useEffect(() => {
    localStorage.setItem('manga_img_webhook', animeWebhook);
  }, [animeWebhook]);

  // Escape key to exit cinematic / final viewMode
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && viewMode === 'final') {
        setViewMode('editor');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [viewMode]);

  const handleOptimizePrompt = async () => {
    if (!animePromptText.trim()) return;
    setIsOptimizingPrompt(true);
    setMemoryLog(prev => [{ 
      id: Date.now().toString(), 
      text: `[IA_GEMINI] Optimizando prompt para el generador de anime...`, 
      time: new Date().toLocaleTimeString() 
    }, ...prev]);

    try {
      const result = await generateOptimizedPrompt(animePromptText, animeCategory);
      setOptimizedPrompt(result);
      setMemoryLog(prev => [{ 
        id: Date.now().toString(), 
        text: `[IA_GEMINI] Prompt optimizado con éxito: "${result.slice(0, 60)}..."`, 
        time: new Date().toLocaleTimeString() 
      }, ...prev]);
    } catch (e: any) {
      console.error(e);
      setMemoryLog(prev => [{ 
        id: Date.now().toString(), 
        text: `[IA_ERROR] No se pudo optimizar el prompt: ${e.message || e}`, 
        time: new Date().toLocaleTimeString() 
      }, ...prev]);
    } finally {
      setIsOptimizingPrompt(false);
    }
  };

  const handleGenerateExternalImage = async () => {
    const promptToUse = optimizedPrompt || animePromptText;
    setIsGeneratingExternal(true);
    setMemoryLog(prev => [{ 
      id: Date.now().toString(), 
      text: `[EXTERNAL_AI] Iniciando generación de imagen de anime...`, 
      time: new Date().toLocaleTimeString() 
    }, ...prev]);

    try {
      if (animeImgApiKey && animeImgEndpoint) {
        // Prepare API call depending on the provider (Stability, custom, etc)
        const isStability = animeImgEndpoint.includes('stability.ai');
        const headers: any = {
          'Authorization': `Bearer ${animeImgApiKey}`,
        };

        let body: any;
        if (isStability) {
          const formData = new FormData();
          formData.append('prompt', promptToUse);
          formData.append('output_format', 'png');
          if (animeCategory === 'background') {
            formData.append('aspect_ratio', scenario.aspectRatio === '16:9' ? '16:9' : '4:3');
          }
          body = formData;
        } else {
          headers['Content-Type'] = 'application/json';
          body = JSON.stringify({
            prompt: promptToUse,
            negative_prompt: 'lowres, bad anatomy, text, watermark',
            steps: 25,
            width: scenario.aspectRatio === '16:9' ? 1024 : 768,
            height: scenario.aspectRatio === '16:9' ? 576 : 768,
          });
        }

        const res = await fetch(animeImgEndpoint, {
          method: 'POST',
          headers,
          body,
        });

        if (!res.ok) {
          const errorMsg = await res.text();
          throw new Error(`API error (${res.status}): ${errorMsg.slice(0, 150)}`);
        }

        const contentType = res.headers.get('content-type');
        let imageUrl = '';

        if (contentType && contentType.includes('application/json')) {
          const json = await res.json();
          imageUrl = json.images?.[0] || json.output?.[0] || json.url || json.image;
          if (imageUrl && !imageUrl.startsWith('data:') && !imageUrl.startsWith('http')) {
            imageUrl = `data:image/png;base64,${imageUrl}`;
          }
        } else {
          const blob = await res.blob();
          imageUrl = URL.createObjectURL(blob);
        }

        if (!imageUrl) {
          throw new Error("No image data returned from generator endpoint.");
        }

        // Add to external assets list and canvas automatically
        const assetName = `${animeCategory}_${Date.now().toString().slice(-4)}`;
        setExternalAssets(prev => [{ name: assetName, url: imageUrl }, ...prev]);
        addModule({
          type: 'image',
          title: assetName,
          content: imageUrl,
          x: animeCategory === 'background' ? 0 : 25,
          y: animeCategory === 'background' ? 0 : 25,
          width: animeCategory === 'background' ? 100 : 50,
          height: animeCategory === 'background' ? 100 : 50,
          isLocked: animeCategory === 'background',
          zIndex: animeCategory === 'background' ? 1 : 12,
          style: {
            borderRadius: 0,
            backgroundColor: 'transparent',
            opacity: 1,
            borderWidth: 0,
            borderColor: 'transparent',
            parallax: animeCategory === 'background' ? 0.1 : 0.4
          }
        });

        setMemoryLog(prev => [{ 
          id: Date.now().toString(), 
          text: `[EXTERNAL_AI] ¡Imagen inyectada con éxito! Añadida como capa de esceografía anime.`, 
          time: new Date().toLocaleTimeString() 
        }, ...prev]);

      } else {
        // Fallback or demo mode when keys are not written yet
        setMemoryLog(prev => [{ 
          id: Date.now().toString(), 
          text: `[EXTERNAL_AI] No tienes llaves de API configuradas. Creando backdrop de previsualización de ${animeCategory}...`, 
          time: new Date().toLocaleTimeString() 
        }, ...prev]);

        // Standard high-quality dynamic anime-vibe art placeholders from Unsplash corresponding to category
        let randomUrl = 'https://images.unsplash.com/photo-1578632767115-351597cf2477?q=80&w=600&auto=format&fit=crop'; // anime aesthetic
        if (animeCategory === 'background') {
          randomUrl = 'https://images.unsplash.com/photo-1541701494587-cb58502866ab?q=80&w=600&auto=format&fit=crop'; // scenery abstract/landscape
        } else if (animeCategory === 'character') {
          randomUrl = 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?q=80&w=600&auto=format&fit=crop'; // anime character portrait
        } else if (animeCategory === 'item') {
          randomUrl = 'https://images.unsplash.com/photo-1534447677768-be436bb09401?q=80&w=600&auto=format&fit=crop'; // magical orbs/lights
        }

        const fallbackUrl = `${randomUrl}&sig=${Math.floor(Math.random() * 1000)}`;

        const assetName = `Fallback_Anime_${animeCategory}`;
        setExternalAssets(prev => [{ name: assetName, url: fallbackUrl }, ...prev]);
        addModule({
          type: 'image',
          title: assetName,
          content: fallbackUrl,
          x: animeCategory === 'background' ? 0 : 30,
          y: animeCategory === 'background' ? 0 : 20,
          width: animeCategory === 'background' ? 100 : 40,
          height: animeCategory === 'background' ? 100 : 60,
          isLocked: animeCategory === 'background',
          zIndex: animeCategory === 'background' ? 1 : 12,
          style: {
            borderRadius: 0,
            backgroundColor: 'transparent',
            opacity: 1,
            borderWidth: 0,
            borderColor: 'transparent',
            parallax: animeCategory === 'background' ? 0.2 : 0.5
          }
        });

        setMemoryLog(prev => [{ 
          id: Date.now().toString(), 
          text: `[EXTERNAL_AI_DEMO] ¡Capa añadida! (Modo Demo sin API habilitada - Puedes configurar tu API Key en la pestaña "IA Config")`, 
          time: new Date().toLocaleTimeString() 
        }, ...prev]);
      }
    } catch (e: any) {
      console.error(e);
      setMemoryLog(prev => [{ 
        id: Date.now().toString(), 
        text: `[EXTERNAL_AI_ERROR] Error al comunicarse con el generador: ${e.message || e}`, 
        time: new Date().toLocaleTimeString() 
      }, ...prev]);
    } finally {
      setIsGeneratingExternal(false);
    }
  };

  const handleTriggerWebhook = async () => {
    if (!animeWebhook) return;
    setIsTriggeringWebhook(true);
    setMemoryLog(prev => [{ 
      id: Date.now().toString(), 
      text: `[WEBHOOK] Enviando datos de escena a tu generador externo...`, 
      time: new Date().toLocaleTimeString() 
    }, ...prev]);

    try {
      const res = await fetch(animeWebhook, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: 'arkaios-484205',
          firestoreDatabaseId: 'ai-studio-c607e7d0-9d5c-4996-9bd2-1e38cb65d6df',
          scenarioId: scenario.id,
          scenarioName: scenario.name,
          currentSceneId: activeSceneId,
          activeModules: scenario.modules,
          fullTimeline: scenario.timeline,
          userEmail: 'arkaios2026@gmail.com'
        })
      });

      if (!res.ok) throw new Error(`HTTP Error ${res.status}`);
      
      setMemoryLog(prev => [{ 
        id: Date.now().toString(), 
        text: `[WEBHOOK_SUCCESS] Sincronización exitosa. Tu generador de anime ha recibido el canvas.`, 
        time: new Date().toLocaleTimeString() 
      }, ...prev]);
    } catch (e: any) {
      console.error(e);
      setMemoryLog(prev => [{ 
        id: Date.now().toString(), 
        text: `[WEBHOOK_ERROR] Fallo de conexión: ${e.message || e}`, 
        time: new Date().toLocaleTimeString() 
      }, ...prev]);
    } finally {
      setIsTriggeringWebhook(false);
    }
  };

  useEffect(() => {
    return onAuthStateChanged(auth, (u) => {
      setUser(u);
    });
  }, []);

  const login = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (e) {
      console.error(e);
    }
  };

  const logout = () => signOut(auth);

  const connectWallet = async () => {
    setIsConnectingWallet(true);
    setWalletError(null);
    try {
      const isInIframe = typeof window !== 'undefined' && window.self !== window.top;
      if (isInIframe) {
        throw new Error('Para conectar MetaMask de forma segura, por favor abre la aplicación en una pestaña nueva usando el botón superior "Open in new tab" de AI Studio. Los sandbox de iframe restringen el acceso a extensiones del navegador.');
      }

      if (typeof window !== 'undefined' && window.ethereum) {
        setMemoryLog(prev => [{ 
          id: Date.now().toString(), 
          text: `[WALLET] Solicitando conexión a MetaMask...`, 
          time: new Date().toLocaleTimeString() 
        }, ...prev]);
        
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        if (accounts && accounts[0]) {
          const address = accounts[0];
          setWalletAddress(address);
          setMemoryLog(prev => [{ 
            id: Date.now().toString(), 
            text: `[WALLET] Conectado exitosamente. Dirección: ${address.slice(0, 6)}...${address.slice(-4)}`, 
            time: new Date().toLocaleTimeString() 
          }, ...prev]);
        } else {
          throw new Error('No accounts selected');
        }
      } else {
        throw new Error('MetaMask is not installed or window.ethereum is blocked. Please install MetaMask extension to connect.');
      }
    } catch (e: any) {
      console.error(e);
      const errMsg = e instanceof Error ? e.message : 'User rejected the request';
      setWalletError(errMsg);
      setMemoryLog(prev => [{ 
        id: Date.now().toString(), 
        text: `[WALLET_ERROR] error 0: Failed to connect to MetaMask - ${errMsg}`, 
        time: new Date().toLocaleTimeString() 
      }, ...prev]);
    } finally {
      setIsConnectingWallet(false);
    }
  };

  const disconnectWallet = () => {
    setWalletAddress(null);
    setMemoryLog(prev => [{ 
      id: Date.now().toString(), 
      text: `[WALLET] Billetera desconectada.`, 
      time: new Date().toLocaleTimeString() 
    }, ...prev]);
  };

  const triggerTransition = (style: TransitionStyle) => {
    setTransitionEffect(style);
    setTimeout(() => setTransitionEffect('none'), 1000);
  };

  const aspectRatios: { label: string; value: AspectRatio; class: string }[] = [
    { label: '4:3', value: '4:3', class: 'aspect-[4/3]' },
    { label: '16:9', value: '16:9', class: 'aspect-[16/9]' },
    { label: '16:10', value: '16:10', class: 'aspect-[16/10]' },
  ];

  const currentRatio = aspectRatios.find(r => r.value === scenario.aspectRatio) || aspectRatios[1];

  const handleAiGeneration = async () => {
    if (!aiPrompt.trim()) return;
    let statusInterval: any;
    setIsGenerating(true);
    setGenerationProgress(10);

    statusInterval = setInterval(() => {
      setGenerationProgress(prev => {
        const next = prev + 1;
        const statusSteps = [
          { progress: 20, text: "🧠 Analizando prompt y composición espacial..." },
          { progress: 40, text: "🖼️ Desplegando layers de fondo y assets PNG..." },
          { progress: 60, text: "✨ Aplicando efectos de profundidad 3D y 4D..." },
          { progress: 80, text: "🕒 Calculando vectores de desplazamiento y rotación..." },
          { progress: 95, text: "🔮 Consolidando la realidad dinámica del escenario..." }
        ];
        const step = statusSteps.find(s => s.progress === next);
        if (step) {
          setMemoryLog(prevLog => [{ 
            id: `step-${next}-${Date.now()}`, 
            text: `[AI_THOUGHT] ${step.text}`, 
            time: new Date().toLocaleTimeString() 
          }, ...prevLog]);
        }
        return next > 98 ? 98 : next;
      });
    }, 150);

    setMemoryLog(prev => [{ id: Date.now().toString(), text: `Recibiendo petición: "${aiPrompt}"`, time: new Date().toLocaleTimeString() }, ...prev]);
    
    try {
      const isVideoclip = aiPrompt.toLowerCase().includes('videoclip') || 
                          aiPrompt.toLowerCase().includes('video musical') || 
                          aiPrompt.toLowerCase().includes('secuencia') ||
                          aiPrompt.toLowerCase().includes('video') ||
                          aiPrompt.toLowerCase().includes('cancion') ||
                          aiPrompt.toLowerCase().includes('canción') ||
                          aiPrompt.toLowerCase().includes('musica') ||
                          aiPrompt.toLowerCase().includes('música') ||
                          aiPrompt.toLowerCase().includes('musical') ||
                          aiPrompt.toLowerCase().includes('youtube') ||
                          aiPrompt.toLowerCase().includes('youtu.be') ||
                          aiPrompt.toLowerCase().includes('veo') ||
                          aiPrompt.toLowerCase().includes('clip');
      
      const canvasElement = document.getElementById('scenario-canvas');
      let imageData: string | undefined;
      if (canvasElement) {
        try {
          const canvas = await html2canvas(canvasElement, {
            useCORS: true,
            backgroundColor: null,
            scale: 0.8,
            logging: false,
          });
          imageData = canvas.toDataURL('image/png');
        } catch (err) {
          console.warn('Scan capture failed', err);
        }
      }

      if (isVideoclip) {
        const isScientific = aiPrompt.toLowerCase().includes('bio') || aiPrompt.toLowerCase().includes('science') || aiPrompt.toLowerCase().includes('protein') || aiPrompt.toLowerCase().includes('dna') || aiPrompt.toLowerCase().includes('alphafold');
        const isFlow = aiPrompt.toLowerCase().includes('flow') || aiPrompt.toLowerCase().includes('diagram') || scenario.modelEngine === 'flow-nexus';
        const isSansar = aiPrompt.toLowerCase().includes('sansar') || aiPrompt.toLowerCase().includes('learning') || aiPrompt.toLowerCase().includes('virtual reality') || scenario.modelEngine === 'sansar-vr';
        const isCAT4D = aiPrompt.toLowerCase().includes('4d') || aiPrompt.toLowerCase().includes('gaussian') || aiPrompt.toLowerCase().includes('view synthesis') || scenario.modelEngine === 'cat-4d';
        const isGrounding = aiPrompt.toLowerCase().includes('location') || aiPrompt.toLowerCase().includes('coord');
        
        if (isScientific) {
          setMemoryLog(prev => [{ id: Date.now().toString(), text: `[ALPHAFOLD_SYNC] Detectado entorno biológico. Consultando bases de datos de plegamiento proteico...`, time: new Date().toLocaleTimeString() }, ...prev]);
        } else if (isFlow) {
          setMemoryLog(prev => [{ id: Date.now().toString(), text: `[FLOW_NEXUS_INIT] Inicializando infraestructura de diagramación. Mapeando puntos de control en el canvas 4D...`, time: new Date().toLocaleTimeString() }, ...prev]);
        } else if (isSansar) {
          setMemoryLog(prev => [{ id: Date.now().toString(), text: `[SANSAR_VR_PROTOCOLS] Inicializando Inmersión Digital. Configurando arquitectura de aprendizaje inclusivo...`, time: new Date().toLocaleTimeString() }, ...prev]);
        } else if (isCAT4D) {
          setMemoryLog(prev => [{ id: Date.now().toString(), text: `[CAT_4D_ENGINE] Inicializando Reconstrucción 4D. Resolviendo representaciones Gaussianas deformables...`, time: new Date().toLocaleTimeString() }, ...prev]);
        } else if (scenario.modelEngine === 'applied-ai') {
          setMemoryLog(prev => [{ id: Date.now().toString(), text: `[APPLIED_AI_SYLLABUS] Cargando currículo de BreatheCo-de. Estructurando proyecto final basándose en principios de la industria...`, time: new Date().toLocaleTimeString() }, ...prev]);
        } else if (scenario.modelEngine === 'video-gen-x') {
          setMemoryLog(prev => [{ id: Date.now().toString(), text: `[VIDEO_GEN_SOTA] Accediendo a modelos de difusión latente. Sincronizando consistencia temporal y vectores de movimiento...`, time: new Date().toLocaleTimeString() }, ...prev]);
        } else if (scenario.modelEngine === '4d-db') {
          setMemoryLog(prev => [{ id: Date.now().toString(), text: `[4D_DATABASE_INIT] Desplegando esquema relacional. Optimizando índices de persistencia empresarial...`, time: new Date().toLocaleTimeString() }, ...prev]);
        } else if (scenario.modelEngine === 'screenmatch') {
          setMemoryLog(prev => [{ id: Date.now().toString(), text: `[SCREENMATCH_AI] Indexando catálogo multimedia. Analizando metadatos de series y películas...`, time: new Date().toLocaleTimeString() }, ...prev]);
        } else if (isGrounding) {
          setMemoryLog(prev => [{ id: Date.now().toString(), text: `[3D_VISUAL_GROUNDING] Mapeando coordenadas espaciales. Localizando anclajes semánticos en el entorno...`, time: new Date().toLocaleTimeString() }, ...prev]);
        } else {
          setMemoryLog(prev => [{ id: Date.now().toString(), text: `[${scenario.modelEngine.toUpperCase()}] Detectado modo DIRECTOR CREATIVO. Mi conciencia está mapeando el ritmo musical...`, time: new Date().toLocaleTimeString() }, ...prev]);
        }
        
        const timelineData = await generateTimeline(aiPrompt, scenario, imageData, externalAssets);
        
        if (timelineData.scenes) {
          let completionMsg = `[SYSTEM_SKILL] Storyboarding completado. Sincronizando ${timelineData.scenes.length} segmentos rítmicos.`;
          
          if (isScientific) {
            completionMsg = `[SYSTEM_SKILL] Estructura molecular decodificada. Sincronizando ${timelineData.scenes.length} segmentos con física orgánica.`;
          } else if (isFlow) {
            completionMsg = `[FLOW_COMPLETED] Grafo de animación generado. Exportando a motor Nexus compatible (${timelineData.scenes.length} nodos).`;
          } else if (isSansar) {
            completionMsg = `[VR_ENVIRONMENT_READY] Espacio de aprendizaje virtual generado (${timelineData.scenes.length} salas/zonas). Aplicando psicología del diseño.`;
          } else if (isCAT4D) {
            completionMsg = `[4D_SYNTHESIS_COMPLETE] Escena 4D reconstruida. ${timelineData.scenes.length} vistas dinámicas sintetizadas con éxito.`;
          } else if (isGrounding) {
            completionMsg = `[GROUNDING_SYNC] Objetos anclados en el espacio 3D. Coordenadas de ${timelineData.scenes.length} elementos verificadas.`;
          }
            
          setMemoryLog(prev => [{ id: Date.now().toString(), text: completionMsg, time: new Date().toLocaleTimeString() }, ...prev]);
          const processedScenes = timelineData.scenes.map((s: any) => ({
            id: crypto.randomUUID(),
            timestamp: s.timestamp,
            duration: s.duration,
            description: s.description,
            transition: s.transition,
            modules: s.modules.map((m: any) => ({
              id: crypto.randomUUID(),
              ...m,
              style: {
                borderRadius: 12,
                opacity: 1,
                parallax: m.zIndex ? (m.zIndex / 10) : 0,
                animation: 'none',
                ...m.style
              }
            }))
          }));

          if (processedScenes && processedScenes.length > 0) {
            updateScenario({
              timeline: processedScenes,
              modules: processedScenes[0].modules
            });
            
            setActiveSceneId(processedScenes[0].id);
            triggerTransition('flash-black');
          } else {
            setMemoryLog(prev => [{ id: Date.now().toString(), text: `[SYSTEM_WARNING] El motor VEO no pudo generar escenas válidas para esta secuencia.`, time: new Date().toLocaleTimeString() }, ...prev]);
          }
        }
      } else {
        const newScenario = await generateScenario(aiPrompt, scenario, imageData, externalAssets);
        await new Promise(resolve => setTimeout(resolve, 1500));

        if (newScenario.modules) {
          setMemoryLog(prev => [{ id: Date.now().toString(), text: `Realidad virtualizada con éxito. Añadiendo capas...`, time: new Date().toLocaleTimeString() }, ...prev]);
          const isAdditive = aiPrompt.toLowerCase().includes('añade') || aiPrompt.toLowerCase().includes('agrega') || aiPrompt.toLowerCase().includes('pon') || aiPrompt.toLowerCase().includes('suma');
          
          const processedModules = (newScenario.modules as any[]).map(m => ({
            id: crypto.randomUUID(),
            ...m,
            style: {
              borderRadius: 12,
              opacity: 1,
              parallax: m.zIndex ? (m.zIndex / 10) : 0,
              animation: 'none',
              ...m.style
            }
          })) as Module[];

          updateScenario({
            ...newScenario,
            modules: isAdditive ? [...scenario.modules, ...processedModules] : processedModules
          });
          
          const transitions: TransitionStyle[] = ['flash-black', 'flash-white', 'crossfade'];
          triggerTransition(transitions[Math.floor(Math.random() * transitions.length)]);
        }
      }
      setAiPrompt('');
    } catch (e) {
      console.error(e);
      const errorMessage = e instanceof Error ? e.message : 'Error desconocido de la IA';
      
      setMemoryLog(prev => [{ 
        id: Date.now().toString(), 
        text: `[SYSTEM_ERROR] ${errorMessage}`, 
        time: new Date().toLocaleTimeString() 
      }, ...prev]);

      if (errorMessage.includes('API key not valid') || errorMessage.includes('API Key de Gemini no configurada')) {
        setMemoryLog(prev => [{ 
          id: 'api-error', 
          text: `⚠️ ERROR_CRÍTIC: La API Key de Gemini no es válida o falta en el entorno. Por favor, revisa la configuración en el menú Settings de AI Studio.`, 
          time: new Date().toLocaleTimeString() 
        }, ...prev]);
      }
    } finally {
      if (statusInterval) clearInterval(statusInterval);
      setIsGenerating(false);
      setGenerationProgress(100);
      setTimeout(() => setGenerationProgress(0), 1000);
    }
  };

  const handleExportGitHub = async () => {
    const zip = new JSZip();
    
    // GitHub Ready structure
    zip.file('.gitignore', `
node_modules
dist
.env
*.local
`);

    zip.file('README.md', `
# ${scenario.name} - VEO Studio Export
Generated by Agent Creator VEO V4.2.1

## Local Deployment
1. Unzip the project
2. Run \`npm install\`
3. Run \`npm run dev\`

This project was built using Vibe Coding principles with VEO Studio.
`);

    zip.file('package.json', JSON.stringify({
      name: scenario.name.toLowerCase().replace(/\s+/g, '-'),
      private: true,
      version: "0.1.0",
      type: "module",
      scripts: {
        "dev": "vite",
        "build": "vite build",
        "preview": "vite preview"
      },
      dependencies: {
        "react": "^18.2.0",
        "react-dom": "^18.2.0",
        "lucide-react": "^0.344.0"
      },
      devDependencies: {
        "vite": "^5.1.4"
      }
    }, null, 2));

    zip.file('index.html', `
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${scenario.name}</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module">
      console.log("VEO Scenario Ready:", ${JSON.stringify(scenario)});
    </script>
  </body>
</html>
`);

    const blob = await zip.generateAsync({ type: 'blob' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `GITHUB_READY_${scenario.name.replace(/\s+/g, '_')}.zip`;
    a.click();
    
    setMemoryLog(prev => [{ 
      id: Date.now().toString(), 
      text: `[GITHUB_SYNC] Paquete GitHub generado. Súbelo a un repo o usa Settings > Export en AI Studio.`, 
      time: new Date().toLocaleTimeString() 
    }, ...prev]);
  };

  const handleManualForge = () => {
    updateScenario({ name: `Manual_Forge_${new Date().getTime()}` });
    setMemoryLog(prev => [{ 
      id: Date.now().toString(), 
      text: `[DEBUG] Modo Manual FORGE activado. Bypass de IA habilitado. Manipulación de layers directa permitida.`, 
      time: new Date().toLocaleTimeString() 
    }, ...prev]);
    setActiveSceneId(scenario.timeline[0].id);
    setViewMode('editor');
  };

  const [isRendering, setIsRendering] = useState(false);

  const handleRender = async () => {
    if (scenario.timeline.length === 0) return;
    setIsRendering(true);
    setMemoryLog(prev => [{ id: Date.now().toString(), text: `Iniciando proceso de consolidación RIP + RENDER...`, time: new Date().toLocaleTimeString() }, ...prev]);
    
    try {
      // Simulation of frame capture for each scene
      for (const scene of scenario.timeline) {
        handleSelectScene(scene.id);
        setMemoryLog(prev => [{ id: Date.now().toString(), text: `Procesando Frame: SCN_${scene.id.slice(0,4)}...`, time: new Date().toLocaleTimeString() }, ...prev]);
        await new Promise(resolve => setTimeout(resolve, 1500)); // Time to "rip"
      }
      
      setMemoryLog(prev => [{ id: Date.now().toString(), text: `Renderizado 8K completado con éxito. El internet está a punto de romperse.`, time: new Date().toLocaleTimeString() }, ...prev]);
      triggerTransition('flash-white');
    } catch (e) {
      console.error(e);
    } finally {
      setIsRendering(false);
    }
  };

  const handleSelectScene = (sceneId: string) => {
    const scene = scenario.timeline.find(s => s.id === sceneId);
    if (scene) {
      setActiveSceneId(sceneId);
      triggerTransition(scene.transition);
      updateScenario({ modules: scene.modules });
    }
  };

  const handleTriggerAction = (moduleId: string, action: any) => {
    const mod = scenario.modules.find(m => m.id === moduleId);
    if (!mod) return;

    setMemoryLog(prev => [{ 
      id: Date.now().toString(), 
      text: `[ACTION_EXECUTED] Módulo ${mod.title} activó: ${action.effect} (Trigger: ${action.trigger})`, 
      time: new Date().toLocaleTimeString() 
    }, ...prev]);

    switch (action.effect) {
      case 'move':
        if (action.payload?.x !== undefined && action.payload?.y !== undefined) {
          updateModule(moduleId, { x: action.payload.x, y: action.payload.y });
        }
        break;
      case 'scale':
        if (action.payload?.width !== undefined && action.payload?.height !== undefined) {
          updateModule(moduleId, { width: action.payload.width, height: action.payload.height });
        }
        break;
      case 'opacity':
        if (action.payload?.opacity !== undefined) {
          updateModule(moduleId, { style: { ...mod.style, opacity: action.payload.opacity } });
        }
        break;
      case 'content':
        if (action.payload?.content !== undefined) {
          updateModule(moduleId, { content: action.payload.content });
        }
        break;
      case 'scene':
        if (action.payload?.sceneId) {
          handleSelectScene(action.payload.sceneId);
        }
        break;
      case 'sound':
        if (action.payload?.url) {
          setAudioTrack({ url: action.payload.url, name: action.payload.name || 'Action Sound' });
        }
        break;
      case 'external-link':
        if (action.payload?.url) {
          window.open(action.payload.url, '_blank');
        }
        break;
    }
  };

  const handleExportZip = async () => {
    const zip = new JSZip();
    const folder = zip.folder(scenario.name.replace(/[^a-zA-Z0-9]/g, '_') || 'My_App');
    
    // Add Metadata
    folder?.file('metadata.json', JSON.stringify({
      name: scenario.name,
      engine: scenario.modelEngine,
      timestamp: new Date().toISOString(),
      world: scenario.worldConfig
    }, null, 2));

    // Add Scene Logic
    folder?.file('scenario.json', JSON.stringify(scenario, null, 2));

    // Simulation of index.html for WebViewer/APK
    const mockHtml = `
<!DOCTYPE html>
<html>
<head><title>${scenario.name}</title></head>
<body style="background:#000; color:#fff;">
  <h1>${scenario.name}</h1>
  <div id="content">Apps logic is contained in scenario.json</div>
</body>
</html>`;
    folder?.file('index.html', mockHtml);

    const blob = await zip.generateAsync({ type: 'blob' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${scenario.name.replace(/\s+/g, '_')}_Project.zip`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    setMemoryLog(prev => [{ id: Date.now().toString(), text: `[SYSTEM] Proyecto consolidado en ZIP. Estructura de archivos lista para despliegue.`, time: new Date().toLocaleTimeString() }, ...prev]);
  };

  const handleExportDesktop = async () => {
    const zip = new JSZip();
    
    // Add all necessary files for local Electron environment
    zip.file('package.json', JSON.stringify({
      name: "veo-studio-local",
      version: "1.0.0",
      main: "electron-main.js",
      scripts: {
        "start": "electron .",
        "pack": "electron-builder --dir",
        "dist": "electron-builder"
      },
      dependencies: {
        "electron": "^29.1.1"
      }
    }, null, 2));

    zip.file('electron-main.js', `
      const { app, BrowserWindow } = require('electron');
      const path = require('path');
      function createWindow() {
        const win = new BrowserWindow({ width: 1400, height: 900 });
        win.loadFile('index.html');
        win.setMenuBarVisibility(false);
      }
      app.whenReady().then(createWindow);
    `);

    // Actual app content
    const htmlExport = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>VEO Studio Local - ${scenario.name}</title>
        <style>body { background: #0a0e1a; margin: 0; overflow: hidden; }</style>
      </head>
      <body>
        <div id="root"></div>
        <script>
          // Local bypass logic
          const SCENARIO_DATA = ${JSON.stringify(scenario)};
          console.log("Local Scenario Loaded:", SCENARIO_DATA);
        </script>
      </body>
      </html>
    `;
    zip.file('index.html', htmlExport);
    zip.file('scenario_data.json', JSON.stringify(scenario, null, 2));

    const blob = await zip.generateAsync({ type: 'blob' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `VEO_Desktop_Project_${scenario.name.replace(/\s+/g, '_')}.zip`;
    a.click();
    
    setMemoryLog(prev => [{ 
      id: Date.now().toString(), 
      text: `[DESKTOP_BUILD] Assets para .EXE generados. Descomprime y ejecuta 'npm install && npm start' localmente.`, 
      time: new Date().toLocaleTimeString() 
    }, ...prev]);
  };

  const handleExportPDF = async (mode: 'current' | 'all') => {
    setIsGeneratingPdf(true);
    setPdfProgress('Iniciando exportación...');
    setMemoryLog(prev => [{ 
      id: Date.now().toString(), 
      text: `[PDF_EXPORT] Iniciando compilación de PDF (${mode === 'all' ? 'Manga completo' : 'Escena actual'})...`, 
      time: new Date().toLocaleTimeString() 
    }, ...prev]);

    try {
      const doc = new jsPDF({
        orientation: 'landscape',
        unit: 'px',
        format: [1200, 675]
      });

      const pagesToRender = mode === 'all' && scenario.timeline.length > 0 
        ? scenario.timeline 
        : [{ id: activeSceneId || 'current', description: 'Escena Principal', modules: scenario.modules }];

      const initialSceneId = activeSceneId;

      for (let i = 0; i < pagesToRender.length; i++) {
        const scene = pagesToRender[i];
        setPdfProgress(`Rendereando página ${i + 1} de ${pagesToRender.length}...`);

        if (mode === 'all' && scene.id) {
          handleSelectScene(scene.id);
          await new Promise(resolve => setTimeout(resolve, 500));
        }

        const canvasElement = document.getElementById('scenario-canvas');
        if (canvasElement) {
          const canvas = await html2canvas(canvasElement, {
            useCORS: true,
            backgroundColor: scenario.backgroundColor || '#050505',
            scale: 1.5,
            logging: false,
          });
          const imgData = canvas.toDataURL('image/png');

          if (i > 0) {
            doc.addPage([1200, 675], 'landscape');
          }

          doc.setFillColor(10, 14, 26);
          doc.rect(0, 0, 1200, 675, 'F');
          
          const canvasWidth = 1000;
          const canvasHeight = 562;
          const x = (1200 - canvasWidth) / 2;
          const y = (675 - canvasHeight) / 2 - 20;
          
          doc.setDrawColor(99, 102, 241);
          doc.setLineWidth(4);
          doc.rect(x - 4, y - 4, canvasWidth + 8, canvasHeight + 8, 'D');

          doc.addImage(imgData, 'PNG', x, y, canvasWidth, canvasHeight, undefined, 'FAST');

          doc.setTextColor(165, 180, 252);
          doc.setFontSize(18);
          doc.text(`${scenario.name.toUpperCase()}`, 100, 625);

          doc.setTextColor(148, 163, 184);
          doc.setFontSize(12);
          const desc = scene.description || `Panel de Escenografía ${i + 1}`;
          doc.text(`PANEL / STORYBOARD ${i + 1}: ${desc}`, 100, 642);

          doc.setTextColor(99, 102, 241);
          doc.setFontSize(10);
          doc.text(`CREADO CON VEO MANGA ENGINE (DESKTOP STUDIO LOCAL)`, 810, 642);
        }
      }

      if (mode === 'all' && initialSceneId) {
        handleSelectScene(initialSceneId);
      }

      doc.save(`MANGA_${scenario.name.replace(/\s+/g, '_')}_${mode === 'all' ? 'STORYBOARD' : 'PANEL'}.pdf`);
      
      setMemoryLog(prev => [{ 
        id: Date.now().toString(), 
        text: `[PDF_EXPORT] ¡PDF compilado con éxito! Guardado como MANGA_${scenario.name.replace(/\s+/g, '_')}.pdf`, 
        time: new Date().toLocaleTimeString() 
      }, ...prev]);

    } catch (err: any) {
      console.error(err);
      setMemoryLog(prev => [{ 
        id: Date.now().toString(), 
        text: `[PDF_ERROR] Error al compilar PDF: ${err.message || err}`, 
        time: new Date().toLocaleTimeString() 
      }, ...prev]);
    } finally {
      setIsGeneratingPdf(false);
      setPdfProgress('');
    }
  };

  const handleCustomAssetUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      Array.from(files).forEach((file: any) => {
        const reader = new FileReader();
        reader.onload = (event) => {
          const dataUrl = event.target?.result as string;
          setExternalAssets((prev: { name: string; url: string }[]) => [
            { name: file.name.replace(/\.[^/.]+$/, ""), url: dataUrl },
            ...prev
          ]);
          setMemoryLog(prev => [{ 
            id: Date.now().toString(), 
            text: `[ASSETS] Cargado recurso para manga/animación: ${file.name} (PNG Transparente Listo)`, 
            time: new Date().toLocaleTimeString() 
          }, ...prev]);
        };
        reader.readAsDataURL(file as Blob);
      });
      e.target.value = '';
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (re) => {
        const content = re.target?.result as string;
        importFromJson(content);
      };
      reader.readAsText(file);
    }
  };

  const currentSelectedModule = scenario.modules.find(m => m.id === selectedModuleId);

  const getEngineTheme = () => {
    switch (scenario.modelEngine) {
      case 'applied-ai': return 'theme-applied-ai';
      case '4d-db': return 'theme-4d-db';
      case 'screenmatch': return 'theme-screenmatch';
      case 'cat-4d': return 'theme-cat-4d';
      case 'sansar-vr': return 'theme-sansar-vr';
      default: return '';
    }
  };

  return (
    <div className={`flex h-screen bg-[#020617] text-slate-200 font-sans flex-col overflow-hidden relative ${getEngineTheme()}`}>
      <div className="mesh-gradient">
        <div className="mesh-ball-1" />
        <div className="mesh-ball-2" />
      </div>

      <header className="h-10 border-b border-white/10 bg-white/5 backdrop-blur-md z-30 flex items-center justify-between px-4 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 bg-indigo-500 rounded flex items-center justify-center font-bold text-[10px] shadow-lg shadow-indigo-500/20 text-white">VEO</div>
          <span className="text-xs font-semibold tracking-wide uppercase hidden md:block italic text-indigo-200">Agent Creator</span>
          <div className="flex items-center gap-1.5 ml-2">
            <input 
              value={scenario.name}
              onChange={(e) => updateScenario({ name: e.target.value })}
              className="bg-transparent border-none text-[10px] font-bold text-indigo-400 outline-none focus:text-white min-w-[120px]"
            />
            {isCloudSyncing ? <Cloud className="text-indigo-400 animate-pulse" size={12}/> : <Cloud size={12} className="text-slate-600"/>}
          </div>
        </div>
        
        {viewMode !== 'final' && (
          <div className="flex items-center bg-black/40 rounded-full p-0.5 border border-white/5">
            {[
              { id: 'editor' as const, label: 'Editor' },
              { id: 'preview' as const, label: 'Preview' },
              { id: 'final' as const, label: 'Final View' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setViewMode(tab.id)}
                className={`px-3.5 py-0.5 rounded-full text-[10px] font-medium transition-all ${
                  viewMode === tab.id 
                    ? 'bg-indigo-500 text-white shadow-sm' 
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        )}

        {viewMode !== 'final' && (
          <button
            onClick={() => setIsStudioMotionActive(!isStudioMotionActive)}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[10px] font-extrabold tracking-wider transition-all cursor-pointer ${
              isStudioMotionActive 
                ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-[0_0_15px_rgba(99,102,241,0.4)] border border-indigo-400/30' 
                : 'bg-black/40 text-indigo-400 hover:text-indigo-200 hover:bg-black/60 border border-white/5'
            }`}
          >
            <Box size={12} className={isStudioMotionActive ? "animate-spin" : "text-indigo-400"} />
            <span>Studio Motion 3D</span>
          </button>
        )}

        <div className="flex items-center gap-1 xl:gap-1.5">
          <div className="hidden xl:flex items-center gap-1 px-1 py-0.5 bg-indigo-500/10 border border-indigo-500/20 rounded-full">
            <div className="w-1 h-1 rounded-full bg-indigo-500 animate-ping" />
            <span className="text-[7px] font-bold text-indigo-400 tracking-tighter uppercase font-mono">VEO ONLINE</span>
          </div>
          {user ? (
            <div className="flex items-center gap-1.5 pr-1 border-r border-white/10">
              <img src={user.photoURL || ''} className="w-4.5 h-4.5 rounded-full border border-indigo-500/30 shadow-[0_0_8px_rgba(99,102,241,0.2)]" alt="" />
              <button onClick={logout} className="text-slate-500 hover:text-white transition-colors"><LogOut size={10}/></button>
            </div>
          ) : (
            <button 
              onClick={login}
              className="flex items-center gap-1 px-1.5 py-0.5 bg-indigo-500/80 hover:bg-indigo-400 text-white rounded-md text-[8px] uppercase font-bold tracking-tight transition-all"
            >
              Sign In
            </button>
          )}

          {walletAddress ? (
            <div className="flex items-center gap-0.5 px-1.5 py-0.5 bg-emerald-500/10 border border-emerald-500/20 rounded-md text-[8px] text-emerald-400 font-bold tracking-tight">
              <Wallet size={9} className="text-emerald-400 font-bold" />
              <span>{walletAddress.slice(0, 4)}...{walletAddress.slice(-4)}</span>
              <button onClick={disconnectWallet} className="ml-0.5 text-[#f87171] hover:text-white transition-colors" title="Disconnect">✕</button>
            </div>
          ) : (
            <button 
              onClick={connectWallet}
              disabled={isConnectingWallet}
              className="flex items-center gap-0.5 px-1.5 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 hover:border-slate-600 rounded-md text-[8px] uppercase font-bold tracking-tight transition-all"
            >
              <Wallet size={9} className={isConnectingWallet ? "animate-pulse" : ""} />
              {isConnectingWallet ? '...' : 'Wallet'}
            </button>
          )}

          <button 
            onClick={handleManualForge}
            className="hidden sm:flex items-center gap-0.5 px-1.5 py-0.5 bg-amber-600/20 hover:bg-amber-600/30 text-amber-500 border border-amber-600/30 rounded-md text-[8px] uppercase font-bold tracking-tight transition-all"
            title="Bypass AI - Manual Mode"
          >
            <MousePointer2 size={9} />
            Manual
          </button>
          <button 
            onClick={handleExportGitHub}
            className="hidden sm:flex items-center gap-0.5 px-1.5 py-0.5 bg-slate-800 hover:bg-slate-700 text-white rounded-md text-[8px] uppercase font-bold tracking-tight transition-all border border-white/10 group font-medium"
          >
            <Github size={9} className="group-hover:rotate-12 transition-transform" />
            GitHub
          </button>
          <button 
            onClick={handleExportDesktop}
            className="hidden md:flex items-center gap-0.5 px-1.5 py-0.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-md text-[8px] uppercase font-bold tracking-tight transition-all shadow-[0_0_8px_rgba(79,70,229,0.3)] group"
          >
            <Monitor size={9} className="group-hover:scale-110 transition-transform" />
            Desktop (.EXE)
          </button>
          <button 
            onClick={handleExportZip}
            className="hidden md:flex items-center gap-0.5 px-1.5 py-0.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-md text-[8px] uppercase font-bold tracking-tight transition-all shadow-[0_0_8px_rgba(16,185,129,0.3)] group"
          >
            <Download size={9} className="group-hover:translate-y-0.5 transition-transform" />
            APK (Zip)
          </button>
          <button 
            onClick={exportToJson}
            className="px-1.5 py-0.5 border border-white/10 rounded-md text-[8px] uppercase font-bold tracking-tight hover:bg-white/5 transition-colors"
          >
            JSON
          </button>
          <button 
            onClick={() => handleExportPDF('current')}
            disabled={isGeneratingPdf}
            className="hidden md:flex items-center gap-0.5 px-1.5 py-0.5 bg-rose-600/20 hover:bg-rose-500/30 text-rose-400 border border-rose-500/30 rounded-md text-[8px] uppercase font-bold tracking-tight transition-all"
            title="Exportar panel individual activo como página PDF"
          >
            <FileDown size={9} />
            Manga Panel
          </button>
          <button 
            onClick={() => handleExportPDF('all')}
            disabled={isGeneratingPdf}
            className="hidden lg:flex items-center gap-0.5 px-1.5 py-0.5 bg-rose-600 hover:bg-rose-500 text-white rounded-md text-[8px] uppercase font-bold tracking-tight transition-all shadow-[0_0_12px_rgba(225,29,72,0.3)] group animate-pulse"
            title="Exportar guion gráfico de manga completo secuencial como libro PDF"
          >
            <BookOpen size={9} className="group-hover:rotate-6 transition-transform" />
            Storyboard
          </button>
          <button className="px-2 py-0.5 bg-white text-black font-bold rounded-md text-[8px] uppercase tracking-tight hover:bg-slate-200 transition-colors">
            Render 8K
          </button>
        </div>
      </header>

      {walletError && (
        <div className="bg-[#ef4444]/10 border-b border-[#ef4444]/20 px-6 py-2.5 flex items-center justify-between text-xs text-[#f87171] z-30 transition-all font-sans">
          <div className="flex items-center gap-2.5">
            <span className="font-mono bg-[#ef4444]/20 px-1.5 py-0.5 rounded text-[10px] uppercase font-bold text-[#ef4444]">error 0</span>
            <span className="font-medium">Failed to connect to MetaMask: {walletError}</span>
          </div>
          <button onClick={() => setWalletError(null)} className="text-[#f87171] hover:text-white transition-colors p-1" title="Close warning">✕</button>
        </div>
      )}

      <main className="flex-1 flex overflow-hidden z-20">
        {isStudioMotionActive ? (
          <div className="flex-1 overflow-y-auto p-6 custom-scrollbar bg-slate-950">
            <StudioAIMotion />
          </div>
        ) : (
          <>
            <AnimatePresence initial={false}>
              {isSidebarOpen && viewMode === 'editor' && (
            <motion.aside
              initial={{ x: -280, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -280, opacity: 0 }}
              className="w-72 border-r border-white/10 bg-white/5 backdrop-blur-xl flex flex-col shrink-0"
            >
              <div className="p-5 border-b border-white/5 flex items-center justify-between">
                <p className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">Studio Controller</p>
                <button onClick={() => setIsSidebarOpen(false)} className="text-slate-500 hover:text-white transition-colors">
                  <ChevronLeft size={16} />
                </button>
              </div>

              <div className="flex px-3 border-b border-white/5 gap-1">
                <button 
                  onClick={() => setSidebarTab('layers')}
                  className={`flex-1 py-3 text-[9px] uppercase tracking-wider font-bold transition-all border-b-2 ${sidebarTab === 'layers' ? 'border-indigo-500 text-indigo-400' : 'border-transparent text-slate-500'}`}
                >
                  Layers
                </button>
                <button 
                  onClick={() => setSidebarTab('assets')}
                  className={`flex-1 py-3 text-[9px] uppercase tracking-wider font-bold transition-all border-b-2 ${sidebarTab === 'assets' ? 'border-indigo-500 text-indigo-400' : 'border-transparent text-slate-500'}`}
                >
                  Assets
                </button>
                <button 
                  onClick={() => setSidebarTab('ai_config')}
                  className={`flex-1 py-3 text-[9px] uppercase tracking-wider font-bold transition-all border-b-2 ${sidebarTab === 'ai_config' ? 'border-rose-500 text-rose-400 flex items-center justify-center gap-1' : 'border-transparent text-slate-500 hover:text-slate-300'}`}
                >
                  <Sparkles size={10} /> IA Config
                </button>
              </div>

              <div className="flex-1 overflow-auto custom-scrollbar">
                {sidebarTab === 'layers' && (
                  <div className="p-5 space-y-6">
                    {/* AI Agent Proactive Suggetions */}
                    {aiSuggestions.length > 0 && (
                      <section>
                         <p className="text-[10px] uppercase tracking-widest text-indigo-500 font-bold mb-3 flex items-center gap-2">
                           <Sparkles size={12} /> Agent Insights
                         </p>
                         <div className="space-y-2">
                           {aiSuggestions.map((s, i) => (
                             <div key={i} className="p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-xl text-[10px] text-indigo-200 leading-normal italic">
                               "{s}"
                             </div>
                           ))}
                         </div>
                      </section>
                    )}

                    <section>
                      <div className="flex items-center justify-between mb-4">
                        <p className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">Layer Stack</p>
                      </div>
                      <div className="space-y-2">
                        {scenario.modules.length === 0 && (
                          <div className="py-8 text-center border border-dashed border-white/5 rounded-xl">
                            <p className="text-[10px] text-slate-600 uppercase">No layers active</p>
                          </div>
                        )}
                        {scenario.modules.sort((a,b) => b.zIndex - a.zIndex).map((m, idx) => (
                          <div 
                            key={m.id}
                            onClick={() => setSelectedModuleId(m.id)}
                            className={`flex items-center justify-between p-3 rounded-xl transition-all cursor-pointer border ${
                              selectedModuleId === m.id 
                                ? 'bg-indigo-500/10 border-indigo-500/40 text-indigo-200 shadow-lg shadow-indigo-950/20' 
                                : 'bg-white/5 border-transparent hover:border-white/10 text-slate-400'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <span className="text-[9px] font-mono opacity-40">{String(scenario.modules.length - idx).padStart(2, '0')}</span>
                              <span className="text-xs truncate max-w-[120px] font-medium">{m.title}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-[8px] px-1.5 py-0.5 bg-white/5 rounded text-white/40 uppercase font-bold">{m.type}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </section>

                    <section className="pt-6 border-t border-white/5">
                      <p className="text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-4">Scene Properties</p>
                      <div className="grid grid-cols-3 gap-2">
                        {aspectRatios.map(ratio => (
                          <button
                            key={ratio.value}
                            onClick={() => updateScenario({ aspectRatio: ratio.value })}
                            className={`py-2 rounded-lg text-[10px] font-bold transition-all border ${
                              scenario.aspectRatio === ratio.value 
                                ? 'bg-indigo-500 border-indigo-400 text-white' 
                                : 'bg-white/5 border-white/5 text-slate-500 hover:bg-white/10'
                            }`}
                          >
                            {ratio.label}
                          </button>
                        ))}
                      </div>
                    </section>

                    <section className="pt-6 border-t border-white/5">
                      <p className="text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-4">Quick Insert</p>
                      <div className="grid grid-cols-2 gap-2">
                        {[
                          { icon: <Type size={16} />, label: 'Text', type: 'text' as ModuleType, content: 'Enter text...' },
                          { icon: <Video size={16} />, label: 'Video', type: 'video' as ModuleType, content: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' },
                          { icon: <ImageIcon size={16} />, label: 'Image', type: 'image' as ModuleType, content: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa' },
                          { icon: <Music size={16} />, label: 'Audio', type: 'audio' as ModuleType, content: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3' },
                        ].map(item => (
                          <button
                            key={item.label}
                            onClick={() => addModule({
                              type: item.type,
                              title: `Layer_${item.label}`,
                              content: item.content,
                              x: 25, y: 25, width: 40, height: 40,
                              isLocked: false,
                              style: { borderRadius: 12, backgroundColor: '#00000088', opacity: 1, borderWidth: 1, borderColor: '#ffffff22' }
                            })}
                            className="aspect-square bg-slate-800/40 rounded-xl border border-white/10 flex flex-col items-center justify-center gap-2 hover:bg-slate-700/50 hover:border-indigo-500/50 transition-all text-slate-400 hover:text-indigo-300 group"
                          >
                            <div className="group-hover:scale-110 transition-transform">{item.icon}</div>
                            <span className="text-[10px] uppercase tracking-tight font-medium">{item.label}</span>
                          </button>
                        ))}
                      </div>
                    </section>
                  </div>
                )}

                {sidebarTab === 'assets' && (
                  <div className="p-5 space-y-6">
                    {/* Manga and Character Studio Upload Panel */}
                    <section className="p-4 bg-indigo-500/5 rounded-2xl border border-indigo-500/10 space-y-4">
                      <div>
                        <p className="text-[10px] uppercase tracking-wider text-indigo-400 font-bold flex items-center gap-1.5 mb-1">
                          <Palette size={12} /> Estudio de Manga & 2D
                        </p>
                        <p className="text-[9px] text-slate-400">
                          Sube tus personajes, bocadillos de diálogo y objetos PNG transparentes para componer escenas.
                        </p>
                      </div>

                      <div 
                        onClick={() => assetUploadInputRef.current?.click()}
                        className="py-6 border border-dashed border-indigo-500/30 hover:border-indigo-500/70 bg-indigo-500/5 hover:bg-indigo-500/10 rounded-xl flex flex-col items-center justify-center gap-2 cursor-pointer transition-all group"
                      >
                        <Upload size={20} className="text-indigo-400 group-hover:scale-110 transition-transform" />
                        <span className="text-[10px] font-bold uppercase tracking-tight text-slate-300">Cargar Recursos PNG</span>
                        <input 
                          type="file" 
                          ref={assetUploadInputRef} 
                          onChange={handleCustomAssetUpload} 
                          accept="image/png, image/jpeg, image/gif" 
                          multiple 
                          className="hidden" 
                        />
                      </div>

                      {externalAssets.length > 0 && (
                        <div className="space-y-2">
                          <p className="text-[9px] uppercase tracking-widest text-slate-500 font-bold">Mis Capas Transparentes ({externalAssets.length})</p>
                          <div className="grid grid-cols-3 gap-2">
                            {externalAssets.map((asset, i) => (
                              <div
                                key={i}
                                className="relative flex flex-col gap-1 p-1 bg-black/40 rounded-lg border border-white/5 hover:border-indigo-500/30 transition-all text-left group"
                              >
                                <div 
                                  onClick={() => addModule({
                                    type: 'image',
                                    title: asset.name,
                                    content: asset.url,
                                    x: 35, y: 35, width: 30, height: 30,
                                    isLocked: false,
                                    zIndex: 10,
                                    style: { borderRadius: 0, backgroundColor: 'transparent', opacity: 1, borderWidth: 0, borderColor: 'transparent' }
                                  })}
                                  className="aspect-square bg-slate-900 rounded-md overflow-hidden flex items-center justify-center cursor-pointer relative"
                                  title="Añadir al canvas"
                                >
                                  <img src={asset.url} className="max-w-full max-h-full object-contain filter drop-shadow(0 4px 6px rgba(0,0,0,0.3))" alt={asset.name} />
                                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                    <Plus size={14} className="text-white" />
                                  </div>
                                </div>
                                <span className="text-[8px] font-medium truncate text-slate-300 px-0.5">{asset.name}</span>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setExternalAssets((prev: { name: string; url: string }[]) => prev.filter((_, idx) => idx !== i));
                                  }}
                                  className="absolute top-1 right-1 p-1 bg-red-500/20 hover:bg-red-500 rounded text-red-400 hover:text-white transition-all opacity-0 group-hover:opacity-100"
                                  title="Eliminar recurso"
                                >
                                  <X size={8} />
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </section>

                    <section>
                      <p className="text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-4">Cloud Assets</p>
                      <div className="grid grid-cols-2 gap-3">
                        {GOOGLE_ASSETS.map(asset => (
                          <button
                            key={asset.id}
                            onClick={() => addModule({
                              type: asset.type as ModuleType,
                              title: asset.name,
                              content: asset.type === 'js' || asset.type === 'html' ? (asset as any).content : (asset as any).url,
                              x: 25, y: 25, width: 40, height: 40,
                              isLocked: false,
                              style: { borderRadius: 12, backgroundColor: asset.type === 'js' || asset.type === 'html' ? 'transparent' : '#00000033', opacity: 1, borderWidth: 0, borderColor: 'transparent' }
                            })}
                            className="flex flex-col gap-2 p-3 bg-white/5 rounded-xl border border-white/10 hover:border-indigo-500/50 transition-all group overflow-hidden"
                          >
                            <div className="aspect-video bg-black/40 rounded-lg overflow-hidden flex items-center justify-center">
                              {asset.type === 'image' ? (
                                <img src={(asset as any).url} className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity" alt={asset.name} />
                              ) : asset.type === 'audio' ? (
                                <Music className="text-slate-500" size={20} />
                              ) : (
                                <Palette className="text-slate-500" size={20} />
                              )}
                            </div>
                            <div className="flex flex-col items-start px-1">
                              <span className="text-[10px] font-bold truncate w-full">{asset.name}</span>
                              <span className="text-[8px] text-slate-500 uppercase">{asset.description}</span>
                            </div>
                          </button>
                        ))}
                      </div>
                    </section>
                    
                    <section className="pt-6 border-t border-white/5 text-center px-4">
                      <div className="p-4 bg-indigo-500/5 rounded-2xl border border-indigo-500/10">
                        <Sparkles className="mx-auto mb-2 text-indigo-400" size={18} />
                        <p className="text-[10px] text-slate-400 leading-relaxed font-medium">Use the AI prompt to search and inject more Google Cloud assets automatically.</p>
                      </div>
                    </section>
                  </div>
                )}

                {sidebarTab === 'ai_config' && (
                  <div className="p-5 space-y-6">
                    {/* Active Developer Engine card */}
                    <div className="p-4 bg-gradient-to-br from-rose-500/10 to-indigo-500/10 rounded-2xl border border-rose-500/20 space-y-3">
                      <div className="flex items-center justify-between">
                        <p className="text-[10px] uppercase tracking-wider text-rose-400 font-bold flex items-center gap-1.5">
                          <Infinity size={12} className="animate-pulse" /> Motor de Realidad Activo
                        </p>
                        <span className="text-[8px] bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded-full font-bold font-mono tracking-wider animate-pulse flex items-center gap-1">● ONLINE</span>
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs font-bold text-slate-100 font-mono">GEMINI-3.5-FLASH ACTIVE</p>
                        <p className="text-[8px] text-slate-400 leading-relaxed">
                          La IA central de Google está activa y lista para reconfigurar el código, describir planos tridimensionales y optimizar el desarrollo de escenarios y fondos.
                        </p>
                      </div>
                    </div>

                    {/* API Credentials Card */}
                    <section className="p-4 bg-slate-900/60 rounded-2xl border border-white/5 space-y-4 text-left">
                      <div className="flex items-center gap-2">
                        <Key size={14} className="text-rose-400 font-bold" />
                        <span className="text-[10px] uppercase font-bold tracking-widest text-slate-300">Credenciales Compartidas</span>
                      </div>
                      
                      <div className="space-y-3">
                        <div>
                          <label className="block text-[8px] uppercase tracking-wider text-slate-400 font-bold mb-1">API Endpoint del Generador (POST)</label>
                          <input 
                            type="text"
                            value={animeImgEndpoint}
                            onChange={(e) => setAnimeImgEndpoint(e.target.value)}
                            placeholder="Ej. https://api.stability.ai/v2beta/stable-image/generate/core"
                            className="w-full bg-black/60 border border-white/10 rounded-lg p-2 text-[10px] font-mono text-slate-100 focus:outline-none focus:border-rose-500/50"
                          />
                        </div>

                        <div>
                          <label className="block text-[8px] uppercase tracking-wider text-slate-400 font-bold mb-1">Clave API de Generación (Key 1)</label>
                          <input 
                            type="password"
                            value={animeImgApiKey}
                            onChange={(e) => setAnimeImgApiKey(e.target.value)}
                            placeholder="Tu API Key"
                            className="w-full bg-black/60 border border-white/10 rounded-lg p-2 text-[10px] font-mono text-slate-100 focus:outline-none focus:border-rose-500/50"
                          />
                        </div>

                        <div>
                          <label className="block text-[8px] uppercase tracking-wider text-slate-400 font-bold mb-1">Clave API de Obtención (Key 2 / Fetch)</label>
                          <input 
                            type="password"
                            value={animeFetchKey}
                            onChange={(e) => setAnimeFetchKey(e.target.value)}
                            placeholder="Clave para obtener recursos ya hechos"
                            className="w-full bg-black/60 border border-white/10 rounded-lg p-2 text-[10px] font-mono text-slate-100 focus:outline-none focus:border-rose-500/50"
                          />
                        </div>

                        <div className="p-2 bg-rose-500/5 rounded-lg border border-rose-500/10 text-[8px] text-slate-400 leading-normal">
                          Configura estas APIs para conectarte con tus generadores externos. Si se dejan vacías, el sistema operará en **Modo Demostración** con recursos de alta fidelidad.
                        </div>
                      </div>
                    </section>

                    {/* Interactive Prompt Architect */}
                    <section className="p-4 bg-slate-900/60 rounded-2xl border border-white/5 space-y-4 text-left">
                      <div className="flex items-center gap-2">
                        <Palette size={14} className="text-indigo-400" />
                        <span className="text-[10px] uppercase font-bold tracking-widest text-slate-300">Arquitecto de Manga Anime</span>
                      </div>

                      <div className="space-y-3">
                        <div className="flex bg-black/40 p-1 rounded-lg border border-white/5">
                          {(['background', 'character', 'item'] as const).map(cat => (
                            <button
                              key={cat}
                              onClick={() => {
                                setAnimeCategory(cat);
                                setOptimizedPrompt('');
                              }}
                              className={`flex-1 py-1 text-[8px] font-bold uppercase rounded-md transition-all ${animeCategory === cat ? 'bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 shadow-[0_0_8px_rgba(99,102,241,0.2)]' : 'text-slate-500 hover:text-slate-400'}`}
                            >
                              {cat === 'background' ? 'Fondo' : cat === 'character' ? 'Personaje' : 'Objeto'}
                            </button>
                          ))}
                        </div>

                        <div>
                          <label className="block text-[8px] uppercase tracking-wider text-slate-400 font-bold mb-1">Tu idea original (Español o simple)</label>
                          <textarea
                            value={animePromptText}
                            onChange={(e) => setAnimePromptText(e.target.value)}
                            rows={3}
                            className="w-full bg-black/60 border border-white/10 rounded-lg p-2 text-[10px] leading-relaxed text-slate-100 focus:outline-none focus:border-indigo-500/50"
                          />
                        </div>

                        <button
                          onClick={handleOptimizePrompt}
                          disabled={isOptimizingPrompt || !animePromptText.trim()}
                          className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white font-bold rounded-xl text-[10px] uppercase tracking-wider flex items-center justify-center gap-2 transition-all"
                        >
                          {isOptimizingPrompt ? (
                            <>
                              <div className="w-3.5 h-3.5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                              <span>Optimizando por Gemini...</span>
                            </>
                          ) : (
                            <>
                              <Sparkles size={12} />
                              <span>Optimizar Prompt Con Gemini</span>
                            </>
                          )}
                        </button>

                        {optimizedPrompt && (
                          <div className="space-y-2 mt-4">
                            <label className="block text-[8px] uppercase tracking-wider text-emerald-400 font-bold">Prompt Optimizado en Inglés (Listo para la IA)</label>
                            <div className="relative">
                              <textarea
                                value={optimizedPrompt}
                                readOnly
                                rows={4}
                                className="w-full bg-black/60 border border-emerald-500/20 rounded-lg p-2 text-[9px] font-mono leading-relaxed text-emerald-400 focus:outline-none"
                              />
                              <button
                                onClick={() => {
                                  navigator.clipboard.writeText(optimizedPrompt);
                                  setMemoryLog(p => [{ id: Date.now().toString(), text: `[PROMPT] Copiado prompt optimizado al portapapeles.`, time: new Date().toLocaleTimeString() }, ...p]);
                                }}
                                className="absolute bottom-2 right-2 px-2 py-1 bg-emerald-500/20 hover:bg-emerald-500 text-emerald-400 hover:text-black border border-emerald-500/20 rounded text-[8px] tracking-tight transition-all uppercase font-mono"
                              >
                                Copiar
                              </button>
                            </div>
                            
                            <button
                              onClick={handleGenerateExternalImage}
                              disabled={isGeneratingExternal}
                              className="w-full py-2 bg-rose-600 hover:bg-rose-500 disabled:opacity-40 text-white font-bold rounded-xl text-[10px] uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-[0_0_12px_rgba(225,29,72,0.3)]"
                            >
                              {isGeneratingExternal ? (
                                <>
                                  <div className="w-3.5 h-3.5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                                  <span>Generando Animación / Retrato...</span>
                                </>
                              ) : (
                                <>
                                  <Palette size={12} />
                                  <span>Generar e Inyectar en Canvas</span>
                                </>
                              )}
                            </button>
                          </div>
                        )}
                      </div>
                    </section>

                    {/* Consume local system API section / REST Endpoint URL */}
                    <section className="p-4 bg-slate-900/60 rounded-2xl border border-white/5 space-y-4 text-left">
                      <div className="flex items-center gap-2">
                        <Globe size={14} className="text-indigo-400 animate-spin" style={{ animationDuration: '6s' }} />
                        <span className="text-[10px] uppercase font-bold tracking-widest text-slate-300">Consumir API de este Sistema</span>
                      </div>

                      <div className="space-y-4">
                        <div className="space-y-2">
                          <p className="text-[9px] uppercase tracking-wide text-slate-500 font-bold">Dirección de Sincronización REST de Firestore</p>
                          <p className="text-[8px] text-slate-400 leading-normal">
                            Tu generador de anime externo puede orquestar este canvas enviando orquestaciones directas en formato JSON al endpoint REST del documento activo:
                          </p>
                          <div className="flex bg-black p-2 rounded-xl border border-white/10 items-center justify-between gap-1 overflow-hidden">
                            <span className="text-[8px] font-mono text-indigo-300 truncate select-all">{`https://firestore.googleapis.com/v1/projects/arkaios-484205/databases/ai-studio-c607e7d0-9d5c-4996-9bd2-1e38cb65d6df/documents/scenarios/${scenario.id}`}</span>
                            <button
                              onClick={() => {
                                navigator.clipboard.writeText(`https://firestore.googleapis.com/v1/projects/arkaios-484205/databases/ai-studio-c607e7d0-9d5c-4996-9bd2-1e38cb65d6df/documents/scenarios/${scenario.id}`);
                                setMemoryLog(p => [{ id: Date.now().toString(), text: `[API] Endpoint de persistencia exportado al portapapeles.`, time: new Date().toLocaleTimeString() }, ...p]);
                              }}
                              className="px-2 py-1 bg-white/5 hover:bg-indigo-500/30 text-indigo-400 hover:text-white rounded border border-indigo-500/30 text-[8px] transition-all"
                            >
                              Copiar
                            </button>
                          </div>
                        </div>

                        <div className="space-y-2 border-t border-white/5 pt-3">
                          <label className="block text-[8px] uppercase tracking-wider text-slate-400 font-bold">Enviar Activo a Webhook Externo</label>
                          <input 
                            type="text"
                            value={animeWebhook}
                            onChange={(e) => setAnimeWebhook(e.target.value)}
                            placeholder="Ej. https://hook.integromat.com/o283has..."
                            className="w-full bg-black/60 border border-white/10 rounded-lg p-2 text-[10px] font-mono text-slate-300 focus:outline-none focus:border-indigo-500/50"
                          />
                          <button
                            onClick={handleTriggerWebhook}
                            disabled={isTriggeringWebhook || !animeWebhook.trim()}
                            className="w-full py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-300 border border-white/10 font-bold rounded-xl text-[10px] uppercase tracking-wider flex items-center justify-center gap-2 transition-all"
                          >
                            {isTriggeringWebhook ? (
                              <>
                                <div className="w-3.5 h-3.5 border-2 border-indigo-400 border-t-white rounded-full animate-spin"></div>
                                <span>Exportando canvas...</span>
                              </>
                            ) : (
                              <>
                                <Upload size={12} />
                                <span>POST Scene to Webhook</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    </section>

                    {/* MANUAL DE INTEGRACIONES IA Y PREGUNTAS CLAVE */}
                    <section className="p-4 bg-slate-900/60 rounded-2xl border border-white/5 space-y-4 text-left">
                      <div className="flex items-center gap-2">
                        <BookOpen size={14} className="text-rose-400 font-bold" />
                        <span className="text-[10px] uppercase font-bold tracking-widest text-slate-300">Guía de Motores & Habilidades IA</span>
                      </div>

                      <div className="space-y-2">
                        {/* FAQ 1: Vecteezy */}
                        <div className="border border-white/5 rounded-xl overflow-hidden bg-black/20">
                          <button
                            onClick={() => setActiveFaq(activeFaq === 1 ? null : 1)}
                            className="w-full p-3 flex items-center justify-between gap-2 hover:bg-white/5 transition-all text-left"
                          >
                            <span className="text-[10px] font-bold text-slate-200 uppercase tracking-tight flex items-center gap-1.5">
                              <Info size={11} className="text-yellow-400" /> ¿Sirve Vecteezy para este Proyecto?
                            </span>
                            <ChevronDown size={14} className={`text-slate-400 transition-transform ${activeFaq === 1 ? 'rotate-180' : ''}`} />
                          </button>
                          
                          {activeFaq === 1 && (
                            <div className="p-3 bg-black/40 border-t border-white/5 text-[9px] text-slate-300 space-y-2 leading-relaxed">
                              <p>
                                <strong>No es necesaria actualmente:</strong> Vecteezy es excelente para descargar elementos gráficos vectorizados, fotos de stock e ilustraciones prediseñadas. Sin embargo, tu aplicación está diseñada para crear arte nuevo desde cero usando Inteligencia Artificial en tiempo real en lugar de recuperar archivos de stock estáticos.
                              </p>
                              <p className="p-2 bg-yellow-500/5 border border-yellow-500/10 rounded text-yellow-400">
                                Puedes guardar de forma segura tus credenciales de Vecteezy (Account ID: <code className="font-mono bg-black/40 px-1 rounded">144213</code>) para otros proyectos de diseño tradicional, pero aquí no las requerimos.
                              </p>
                            </div>
                          )}
                        </div>

                        {/* FAQ 2: Imagenes API keys */}
                        <div className="border border-white/5 rounded-xl overflow-hidden bg-black/20">
                          <button
                            onClick={() => setActiveFaq(activeFaq === 2 ? null : 2)}
                            className="w-full p-3 flex items-center justify-between gap-2 hover:bg-white/5 transition-all text-left"
                          >
                            <span className="text-[10px] font-bold text-slate-200 uppercase tracking-tight flex items-center gap-1.5">
                              <ImageIcon size={11} className="text-indigo-400" /> A. Generador de Imágenes (Pollinations y Gemini)
                            </span>
                            <ChevronDown size={14} className={`text-slate-400 transition-transform ${activeFaq === 2 ? 'rotate-180' : ''}`} />
                          </button>
                          
                          {activeFaq === 2 && (
                            <div className="p-3 bg-black/40 border-t border-white/5 text-[9px] text-slate-300 space-y-3 leading-relaxed">
                              <div>
                                <p className="font-bold text-slate-200">1. Pollinations.ai (Modo Sandbox predeterminado):</p>
                                <p className="text-slate-400 text-[8px] mt-0.5">
                                  <strong>API Key:</strong> 🚫 No requiere ninguna clave (es un canal abierto de uso gratuito).
                                </p>
                                <p className="text-slate-400 text-[8px] mt-1">Cómo consumirlo en otro proyecto: Solo realiza una llamada HTTP directa:</p>
                                <div className="flex bg-black px-2 py-1 rounded text-[8px] font-mono border border-white/5 mt-1 items-center justify-between">
                                  <span className="truncate text-indigo-300">https://image.pollinations.ai/prompt/anime_classroom...</span>
                                  <button 
                                    onClick={() => {
                                      navigator.clipboard.writeText("https://image.pollinations.ai/prompt/{PROMPT_AQUÍ}?width=768&height=768&nologo=true&seed=42");
                                      setMemoryLog(p => [{ id: Date.now().toString(), text: `[API] Copiado endpoint de Pollinations al portapapeles.`, time: new Date().toLocaleTimeString() }, ...p]);
                                    }}
                                    className="text-[7px] text-indigo-400"
                                  >
                                    Copy URL
                                  </button>
                                </div>
                              </div>

                              <div className="border-t border-white/5 pt-2">
                                <p className="font-bold text-slate-200">2. Gemini Image (Google Gen AI):</p>
                                <p className="text-slate-400 text-[8px] mt-0.5">
                                  <strong>API Key:</strong> Utiliza la <code className="font-mono text-slate-200">GEMINI_API_KEY</code> provista automáticamente.
                                </p>
                                <p className="text-slate-400 text-[8px] mt-1">
                                  Llama al modelo <code className="text-rose-400 font-mono">gemini-2.5-flash-image</code> para estructurar planos o generar bocetos rápidos en Base64 de alta fidelidad.
                                </p>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* FAQ 3: Videos API Keys */}
                        <div className="border border-white/5 rounded-xl overflow-hidden bg-black/20">
                          <button
                            onClick={() => setActiveFaq(activeFaq === 3 ? null : 3)}
                            className="w-full p-3 flex items-center justify-between gap-2 hover:bg-white/5 transition-all text-left"
                          >
                            <span className="text-[10px] font-bold text-slate-200 uppercase tracking-tight flex items-center gap-1.5">
                              <Video size={11} className="text-rose-400" /> B. Animación y Videos (JSON2Video, Veo 3.1)
                            </span>
                            <ChevronDown size={14} className={`text-slate-400 transition-transform ${activeFaq === 3 ? 'rotate-180' : ''}`} />
                          </button>
                          
                          {activeFaq === 3 && (
                            <div className="p-3 bg-black/40 border-t border-white/5 text-[9px] text-slate-300 space-y-3 leading-relaxed">
                              <div>
                                <p className="font-bold text-slate-200">1. JSON2Video (Montaje y VFX):</p>
                                <p className="text-slate-400 text-[8px] mt-0.5">
                                  <strong>API Key Activa de Respaldo:</strong>
                                </p>
                                <div className="flex bg-black px-2 py-1 rounded text-[8px] font-mono border border-white/5 mt-1 items-center justify-between">
                                  <span className="truncate text-rose-400">sVbVwfFPEiewQYlRC9qKiEM7fcpKlCG9y4cZD7T3</span>
                                  <button 
                                    onClick={() => {
                                      navigator.clipboard.writeText("sVbVwfFPEiewQYlRC9qKiEM7fcpKlCG9y4cZD7T3");
                                      setMemoryLog(p => [{ id: Date.now().toString(), text: `[API] Copiada API key de JSON2Video al portapapeles.`, time: new Date().toLocaleTimeString() }, ...p]);
                                    }}
                                    className="text-[7px] text-rose-400 font-bold"
                                  >
                                    Copiar Key
                                  </button>
                                </div>
                                <p className="text-slate-400 text-[7px] mt-1 leading-normal">
                                  Permite animar capas vectoriales y renderizar el montaje final en la nube de alta consistencia cinematográfica.
                                </p>
                              </div>

                              <div className="border-t border-white/5 pt-2">
                                <p className="font-bold text-slate-200">2. Veo 3.1 Lite (Modelo de Video Google):</p>
                                <p className="text-slate-400 text-[8px] mt-0.5">
                                  Utiliza el modelo <code className="text-rose-400 font-mono">veo-3.1-lite-generate-preview</code> en tu servidor Express alimentado por tu API Key de Gemini para orquestar clips estilizados de 4 segundos.
                                </p>
                              </div>

                              <div className="border-t border-white/5 pt-2">
                                <p className="font-bold text-slate-200">3. Arkaios Custom frame-blending engine:</p>
                                <p className="text-slate-400 text-[8px] mt-0.5">
                                  🚫 No requiere clave API externa. Genera progresivamente 5 variaciones cinemáticas entrelazadas en frontend para dar un efecto inmediato libre de cargos de servidor.
                                </p>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* FAQ 4: Consumir API de este sistema */}
                        <div className="border border-white/5 rounded-xl overflow-hidden bg-black/20">
                          <button
                            onClick={() => setActiveFaq(activeFaq === 4 ? null : 4)}
                            className="w-full p-3 flex items-center justify-between gap-2 hover:bg-white/5 transition-all text-left"
                          >
                            <span className="text-[10px] font-bold text-slate-200 uppercase tracking-tight flex items-center gap-1.5">
                              <Globe size={11} className="text-emerald-400" /> C. ¿Cómo Consumir la API de este Sistema?
                            </span>
                            <ChevronDown size={14} className={`text-slate-400 transition-transform ${activeFaq === 4 ? 'rotate-180' : ''}`} />
                          </button>
                          
                          {activeFaq === 4 && (
                            <div className="p-3 bg-black/40 border-t border-white/5 text-[9px] text-slate-300 space-y-2 leading-relaxed">
                              <p className="text-slate-400">
                                Tu generador externo de anime puede consultar o actualizar este editor leyendo el documento Firestore activo en tiempo real:
                              </p>
                              <div className="p-2 bg-black rounded text-[8px] font-mono border border-white/5 overflow-auto max-h-32">
                                <pre className="text-emerald-400">{`// GET scenario data
fetch('https://firestore.googleapis.com/v1/projects/arkaios-484205/databases/ai-studio-c607e7d0-9d5c-4996-9bd2-1e38cb65d6df/documents/scenarios/${scenario.id}')
  .then(res => res.json())
  .then(data => {
    console.log("Timeline & capas listas para el renderizador externo:", data);
  });`}</pre>
                              </div>
                              <p className="text-slate-500 text-[8px] leading-normal">
                                Esto sirve como una base de datos excelente para desarrollar escenarios y fondos de manga desde una aplicación de inteligencia artificial independiente.
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </section>
                  </div>
                )}

                {currentSelectedModule && (
                  <div className="px-5 pb-5">
                    <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="pt-6 border-t border-white/10 space-y-4">
                      <div className="flex items-center justify-between">
                        <p className="text-[10px] uppercase tracking-widest text-indigo-400 font-bold">Properties</p>
                        <button onClick={() => setSelectedModuleId(null)} className="text-slate-500 hover:text-white"><X size={14}/></button>
                      </div>
                      <div className="space-y-4">
                        {/* 1. MORPH COMPOSITION (Type Switcher) - MOVED TO TOP */}
                        <div className="space-y-3 p-3 bg-indigo-500/5 rounded-2xl border border-indigo-500/10">
                           <p className="text-[9px] uppercase tracking-widest text-indigo-400 font-bold flex items-center gap-2">
                             <Zap size={10} /> Morph Composition
                           </p>
                           <div className="grid grid-cols-4 gap-1">
                             {(['text', 'video', 'image', 'audio', 'html', 'js', 'iframe'] as ModuleType[]).map(type => (
                               <button 
                                 key={type}
                                 onClick={() => updateModule(currentSelectedModule.id, { type })}
                                 className={`py-1.5 px-0.5 rounded-lg text-[8px] uppercase font-bold border transition-all ${currentSelectedModule.type === type ? 'bg-indigo-500 border-indigo-400 text-white shadow-[0_0_10px_rgba(99,102,241,0.3)]' : 'bg-white/5 border-white/10 text-slate-500 hover:bg-white/10'}`}
                               >
                                 {type}
                               </button>
                             ))}
                           </div>
                           <p className="text-[7px] text-slate-500 italic mt-1">Transforma la naturaleza de este asset en tiempo real.</p>
                        </div>

                        <div className="space-y-1">
                          <label className="text-[9px] text-slate-500 uppercase tracking-tighter">Content Source</label>
                          <textarea 
                            value={currentSelectedModule.content}
                            onChange={(e) => updateModule(currentSelectedModule.id, { content: e.target.value })}
                            className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-[11px] text-slate-200 outline-none focus:border-indigo-500/50 min-h-[60px]"
                          />
                        </div>

                        {/* 4D Essence Colors */}
                        <div className="pt-2 space-y-3">
                           <p className="text-[9px] uppercase tracking-widest text-indigo-500/60 font-bold">4D Essence (Energy)</p>
                           <div className="flex gap-4 items-center px-1">
                             {[
                               { name: 'Core', color: '#6366f1' },
                               { name: 'Pulse', color: '#f43f5e' },
                               { name: 'Void', color: '#10b981' },
                               { name: 'Flux', color: '#eab308' }
                             ].map(essence => (
                               <button 
                                 key={essence.name}
                                 onClick={() => updateModule(currentSelectedModule.id, { style: { ...currentSelectedModule.style, accentColor: essence.color } })}
                                 className="group flex flex-col items-center gap-1.5"
                               >
                                 <div 
                                   className={`w-6 h-6 rounded-full transition-all border-2 ${currentSelectedModule.style.accentColor === essence.color ? 'scale-125 border-white shadow-[0_0_15px]' : 'border-transparent opacity-60 hover:opacity-100'}`}
                                   style={{ backgroundColor: essence.color, boxShadow: currentSelectedModule.style.accentColor === essence.color ? `0 0 15px ${essence.color}` : 'none' }}
                                 />
                                 <span className="text-[7px] uppercase font-bold text-slate-500">{essence.name}</span>
                               </button>
                             ))}
                             <button 
                               onClick={() => updateModule(currentSelectedModule.id, { style: { ...currentSelectedModule.style, accentColor: undefined } })}
                               className="ml-auto text-[8px] text-slate-600 hover:text-slate-400 uppercase font-bold"
                             >
                               Reset
                             </button>
                           </div>
                        </div>

                        {/* 4D Controls */}
                        <div className="pt-2 space-y-3">
                           <p className="text-[9px] uppercase tracking-widest text-indigo-500/60 font-bold">4D Effects</p>
                           <div className="space-y-3">
                              <div className="space-y-1">
                                <div className="flex justify-between text-[8px] text-slate-500"><span>3D Parallax</span><span>{Math.round((currentSelectedModule.style.parallax || 0) * 100)}%</span></div>
                                <input type="range" min="0" max="1" step="0.01" value={currentSelectedModule.style.parallax || 0} onChange={(e) => updateModule(currentSelectedModule.id, { style: { ...currentSelectedModule.style, parallax: parseFloat(e.target.value) } })} className="w-full accent-indigo-500 h-1 bg-white/10 rounded-lg appearance-none cursor-pointer" />
                              </div>
                              <div className="space-y-1">
                                <div className="flex justify-between text-[8px] text-slate-500"><span>Z-Depth Blur</span><span>{currentSelectedModule.style.blur || 0}px</span></div>
                                <input type="range" min="0" max="10" step="1" value={currentSelectedModule.style.blur || 0} onChange={(e) => updateModule(currentSelectedModule.id, { style: { ...currentSelectedModule.style, blur: parseInt(e.target.value) } })} className="w-full accent-indigo-500 h-1 bg-white/10 rounded-lg appearance-none cursor-pointer" />
                              </div>
                              <div className="space-y-1">
                                <label className="text-[8px] text-slate-500">Motion Style</label>
                                <select 
                                  value={currentSelectedModule.style.animation || 'none'}
                                  onChange={(e) => updateModule(currentSelectedModule.id, { style: { ...currentSelectedModule.style, animation: e.target.value as any } })}
                                  className="w-full bg-black/40 border border-white/10 rounded px-2 py-1 text-[10px]"
                                >
                                  <option value="none">Static</option>
                                  <option value="subtle-float">4D Float</option>
                                  <option value="sway">Lofi Sway</option>
                                  <option value="blink">Pulse/Blink</option>
                                  <option value="drift">Atmospheric Drift</option>
                                  <option value="pulse">Pulse Energy</option>
                                  <option value="gentle-shake">Handheld Shake</option>
                                </select>
                              </div>
                           </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3 pt-2">
                          <div className="space-y-1">
                            <label className="text-[9px] text-slate-500 uppercase tracking-tighter">Radius</label>
                            <input type="range" min="0" max="100" value={currentSelectedModule.style.borderRadius} onChange={(e) => updateModule(currentSelectedModule.id, { style: { ...currentSelectedModule.style, borderRadius: parseInt(e.target.value) } })} className="w-full accent-indigo-500 h-1 bg-white/10 rounded-lg appearance-none cursor-pointer" />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[9px] text-slate-500 uppercase tracking-tighter">Opacity</label>
                            <input type="range" min="0" max="1" step="0.01" value={currentSelectedModule.style.opacity} onChange={(e) => updateModule(currentSelectedModule.id, { style: { ...currentSelectedModule.style, opacity: parseFloat(e.target.value) } })} className="w-full accent-indigo-500 h-1 bg-white/10 rounded-lg appearance-none cursor-pointer" />
                          </div>
                        </div>
                      </div>
                    </motion.section>
                  </div>
                )}
              </div>

              <div className="p-5 border-t border-white/5 space-y-4">
                {/* Memory Log Overlay */}
                <div className="space-y-2">
                   <p className="text-[9px] uppercase tracking-widest text-indigo-500/60 font-bold">Registro de Conciencia (Memory)</p>
                   <div className="bg-black/40 border border-white/5 rounded-lg p-2 h-28 overflow-y-auto space-y-1.5 scrollbar-hide">
                     {memoryLog.map(log => (
                       <div key={log.id} className="text-[9px] leading-relaxed">
                         <span className="text-indigo-400/60 font-mono">[{log.time}]</span>{' '}
                         <span className="text-slate-400">{log.text}</span>
                       </div>
                     ))}
                   </div>
                   <p className="text-[7px] text-slate-600 font-mono italic">Infinite Memory active. .log generated.</p>
                </div>

                <button onClick={() => fileInputRef.current?.click()} className="w-full flex items-center justify-center gap-2 py-2.5 bg-indigo-500/10 border border-indigo-500/30 rounded-xl text-xs font-bold text-indigo-300 hover:bg-indigo-500 hover:text-white transition-all">
                  <Files size={14} /> Import Scenario
                </button>
                <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept=".json" className="hidden" />
              </div>
            </motion.aside>
          )}
        </AnimatePresence>

        <section className={`flex-1 relative flex flex-col items-center justify-center transition-all duration-700 ${viewMode === 'final' ? 'p-0' : 'p-8 animate-in fade-in transition-all'}`}>
          {!isSidebarOpen && viewMode === 'editor' && (
            <button onClick={() => setIsSidebarOpen(true)} className="absolute left-6 top-6 p-2 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition-all text-slate-400">
              <ChevronRight size={20} />
            </button>
          )}

          <motion.div
            layout
            id="scenario-canvas"
            className={`relative bg-[#050505] shadow-[0_40px_100px_rgba(0,0,0,0.8)] border border-white/10 overflow-hidden transition-all duration-700 ${currentRatio.class}`}
            style={{
              backgroundColor: scenario.backgroundColor,
              width: viewMode === 'final' ? '90vw' : '800px',
              height: viewMode === 'final' ? 'auto' : '450px',
              aspectRatio: scenario.aspectRatio ? scenario.aspectRatio.replace(':', '/') : '16/9',
              maxHeight: viewMode === 'final' ? '82vh' : 'min(75vh, 800px)',
              maxWidth: viewMode === 'final' ? '1280px' : 'min(75vw, 1200px)',
            }}
          >
            {/* Background Symbols Texture */}
            {viewMode === 'preview' && (
              <div className="absolute inset-0 opacity-10 pointer-events-none flex flex-wrap gap-20 p-20 justify-center">
                {Array.from({length: 12}).map((_, i) => (
                  <span key={i} className="material-symbols-outlined text-8xl">scatter_plot</span>
                ))}
              </div>
            )}
            
            {viewMode === 'final' && (
              <button 
                onClick={() => setViewMode('editor')}
                className="absolute top-4 left-4 z-[999] p-2.5 bg-black/70 hover:bg-black/90 text-white/90 hover:text-white rounded-full backdrop-blur-md border border-white/15 cursor-pointer shadow-lg hover:scale-105 active:scale-95 transition-all flex items-center gap-1.5 px-4"
                title="Volver al Editor"
              >
                <ChevronLeft size={16} />
                <span className="text-[10px] uppercase font-bold tracking-wider">Volver</span>
              </button>
            )}

            {viewMode === 'final' && (
              <button 
                onClick={() => setViewMode('editor')}
                className="absolute top-4 right-4 z-[999] px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-full backdrop-blur-md border border-rose-500/20 shadow-lg shadow-rose-600/30 cursor-pointer hover:scale-105 active:scale-95 transition-all flex items-center gap-1.5"
                title="Cerrar Modo Cine (Esc)"
              >
                <X size={12} className="stroke-[3]" />
                <span className="text-[10px] uppercase tracking-wider font-sans">Cerrar</span>
              </button>
            )}
            
            {viewMode === 'final' && (
              <CinematicHUD 
                scenario={scenario} 
                activeSceneId={activeSceneId} 
                progress={(playbackTime / (scenario.timeline[scenario.timeline.length - 1]?.timestamp + scenario.timeline[scenario.timeline.length - 1]?.duration)) * 100} 
                isScientific={memoryLog.some(l => l.text.includes('ALPHAFOLD'))}
              />
            )}
            
            {viewMode === 'final' && (
              <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-4 z-[250] bg-black/60 border border-white/10 px-5 py-3 rounded-2xl backdrop-blur-xl transition-all duration-300 shadow-[0_20px_50px_rgba(0,0,0,0.5)] opacity-95 hover:opacity-100">
                <button 
                  onClick={() => setViewMode('editor')}
                  className="px-4 py-2 bg-black/40 hover:bg-white/10 border border-white/10 rounded-xl text-[10px] uppercase font-bold tracking-widest text-white/80 hover:text-white transition-all"
                >
                  Editor
                </button>
                <button 
                  onClick={togglePlayback} 
                  className="p-4 bg-indigo-600 hover:bg-indigo-500 border border-indigo-500/30 rounded-full text-white shadow-[0_0_20px_rgba(99,102,241,0.4)] hover:scale-105 transition-all"
                >
                   {isPlaying ? <Monitor size={20} className="animate-pulse text-white" /> : <Play size={20} />}
                </button>
                <button 
                  onClick={() => setViewMode('preview')}
                  className="px-4 py-2 bg-black/40 hover:bg-white/10 border border-white/10 rounded-xl text-[10px] uppercase font-bold tracking-widest text-white/80 hover:text-white transition-all"
                >
                  Preview
                </button>
              </div>
            )}
            
            {scenario.modules.sort((a,b) => a.zIndex - b.zIndex).map((module) => (
              <ModuleItem
                key={module.id}
                module={module}
                isEditing={viewMode === 'editor'}
                isSelected={selectedModuleId === module.id}
                onUpdate={(upd) => updateModule(module.id, upd)}
                onSelect={() => setSelectedModuleId(module.id)}
                onRemove={() => removeModule(module.id)}
                onTriggerAction={(action) => handleTriggerAction(module.id, action)}
              />
            ))}

            {/* Scanning Overlay (Vector Work Animation) */}
            <AnimatePresence>
              {isGenerating && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 z-[100] pointer-events-none"
                >
                  <div className="absolute inset-0 bg-indigo-500/10 backdrop-blur-[4px]"></div>
                  
                  {/* Grid Lines Overlay */}
                  <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'linear-gradient(#4f46e5 1px, transparent 1px), linear-gradient(90deg, #4f46e5 1px, transparent 1px)', backgroundSize: '40px 40px' }}></div>
                  
                  {/* Scanning Horizontal Line */}
                  <motion.div 
                    animate={{ y: ['-10%', '110%', '-10%'] }}
                    transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                    className="absolute w-full h-[2px] bg-indigo-400 shadow-[0_0_30px_#818cf8]"
                  >
                    <div className="absolute -top-1 left-0 w-full h-[1px] bg-white opacity-40"></div>
                  </motion.div>

                  {/* Corner Markers */}
                  <div className="absolute top-4 left-4 w-4 h-4 border-t-2 border-l-2 border-indigo-400"></div>
                  <div className="absolute top-4 right-4 w-4 h-4 border-t-2 border-r-2 border-indigo-400"></div>
                  <div className="absolute bottom-4 left-4 w-4 h-4 border-b-2 border-l-2 border-indigo-400"></div>
                  <div className="absolute bottom-4 right-4 w-4 h-4 border-b-2 border-r-2 border-indigo-400"></div>

                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-6 px-10 text-center">
                    <div className="relative w-64 h-1 bg-white/5 rounded-full overflow-hidden border border-white/5">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${generationProgress}%` }}
                        className="absolute top-0 left-0 h-full bg-indigo-500 shadow-[0_0_10px_#6366f1]"
                      />
                    </div>
                    
                    <div className="flex flex-col items-center gap-2">
                      <motion.div 
                        key={currentThought}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="text-[11px] font-medium text-slate-300 max-w-md italic leading-relaxed"
                      >
                         "{currentThought}"
                      </motion.div>
                      <div className="text-[10px] uppercase tracking-[0.3em] font-bold text-indigo-400/60 transition-all">
                        AI Agent: Analyzing 4D Environment ({Math.round(generationProgress)}%)
                      </div>
                    </div>

                    <div className="flex gap-3">
                       {[0,1,2].map(i => (
                         <motion.div 
                          key={i}
                          animate={{ 
                            scale: [1, 1.5, 1], 
                            opacity: [0.2, 1, 0.2],
                            backgroundColor: ['#6366f1', '#f43f5e', '#6366f1']
                          }}
                          transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.2 }}
                          className="w-2 h-2 rounded-full shadow-[0_0_8px_currentColor]"
                         />
                       ))}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* PDF Generation Overlay */}
            <AnimatePresence>
              {isGeneratingPdf && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 z-[200] flex flex-col items-center justify-center bg-slate-950/95 backdrop-blur-md"
                >
                  <div className="relative w-24 h-24 mb-6 flex items-center justify-center">
                    <div className="absolute w-12 h-16 border-2 border-rose-500 rounded bg-rose-950/20 shadow-[0_0_15px_rgba(244,63,94,0.3)] flex items-center justify-center">
                      <BookOpen size={24} className="text-rose-400 animate-pulse" />
                    </div>
                    <div className="absolute inset-0 border-2 border-rose-500/10 rounded-full animate-spin border-t-rose-400" style={{ animationDuration: '1.5s' }}></div>
                  </div>

                  <div className="flex flex-col items-center gap-3 px-10 text-center max-w-sm">
                    <p className="text-sm font-bold text-slate-100 uppercase tracking-widest flex items-center gap-2">
                      <Sparkles className="text-rose-400 animate-ping" size={14} /> Creando Libro Manga (.PDF)
                    </p>
                    <p className="text-xs text-rose-400 font-mono tracking-tight bg-rose-500/10 px-3 py-1 rounded-full border border-rose-500/20">
                      {pdfProgress || 'Procesando páginas...'}
                    </p>
                    <p className="text-[10px] text-slate-500 leading-relaxed font-sans">
                      Por favor, mantén la ventana del editor abierta. Capturando capas vectoriales de cada escena en alta fidelidad de impresión...
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Transition Flashes / Crossfades */}
            <AnimatePresence mode="wait">
              {transitionEffect !== 'none' && (
                <motion.div 
                  key={transitionEffect}
                  initial={{ opacity: 1 }}
                  animate={{ opacity: 0 }}
                  transition={{ duration: 0.6, ease: "easeOut" }}
                  className={`absolute inset-0 z-[150] pointer-events-none ${
                    transitionEffect === 'flash-white' ? 'bg-white' : 
                    transitionEffect === 'flash-black' ? 'bg-black' : 
                    'bg-indigo-600/30 blur-xl'
                  }`}
                />
              )}
            </AnimatePresence>
          </motion.div>
          
          {viewMode !== 'final' && (
            <p className="mt-8 text-[10px] text-slate-500 italic font-light tracking-widest uppercase">
              Real-time rendering • {scenario.modules.filter(m => m.style.parallax).length > 0 ? '4D Depth Enabled' : 'Flat Composition'} • {scenario.modules.length} active modules
            </p>
          )}

          {viewMode === 'editor' && scenario.timeline.length > 0 && (
            <div className="w-full mt-4 space-y-4">
              <div className="bg-black/40 border border-white/5 rounded-xl p-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 px-2 py-1 bg-indigo-500/20 rounded text-[9px] font-mono text-indigo-400">
                    <span className="animate-pulse">●</span> SCANNING_AUTO_SKILLS
                  </div>
                  <p className="text-[10px] text-slate-500 font-mono tracking-tight lowercase">
                    detected: [cinematic_blur_v2, neural_parallax_4d, temporal_jitter]
                  </p>
                </div>
                <div className="text-[9px] text-slate-600 font-mono">
                  RENDER_QUALITY: 8K_UNREAL_ENGINE_MODE
                </div>
              </div>
              <Timeline 
                timeline={scenario.timeline}
                activeSceneId={activeSceneId}
                onSelectScene={handleSelectScene}
                onAddScene={() => addScene(scenario.timeline.length * 10)}
                onRemoveScene={removeScene}
                onUpdateScene={updateScene}
              />
            </div>
          )}
        </section>

        <ProductionSuite 
          scenarioName={scenario.name}
          audioTrack={scenario.audioTrack}
          onSetAudio={setAudioTrack}
          timeline={scenario.timeline}
          worldConfig={scenario.worldConfig}
          onUpdateWorldConfig={updateWorldConfig}
          activeEngine={scenario.modelEngine}
          onUpdateEngine={setModelEngine}
          onAddScene={addScene}
          onRender={handleRender}
          isRendering={isRendering}
        />

        {viewMode !== 'final' && (
          <div className="absolute bottom-12 left-1/2 -translate-x-1/2 w-full max-w-xl px-6 z-40">
            <div className="bg-[#0f172a]/60 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-2xl p-3 flex items-center gap-3">
              <div className={`p-2 rounded-xl flex items-center justify-center ${isGenerating ? 'bg-indigo-500 animate-pulse text-white' : 'bg-white/5 text-indigo-400'}`}>
                {isGenerating ? <Zap size={18} /> : <Sparkles size={18} />}
              </div>
              <input 
                placeholder="Ask your AI Agent for 4D ideas (e.g. 'Office desk with floating holographic light')..."
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAiGeneration()}
                className="flex-1 bg-transparent border-none outline-none text-xs text-white placeholder:text-slate-500"
                disabled={isGenerating}
              />
              <button onClick={handleAiGeneration} disabled={isGenerating || !aiPrompt.trim()} className="px-4 py-1.5 bg-indigo-500 hover:bg-indigo-400 disabled:opacity-30 rounded-xl text-[10px] font-bold transition-all text-white">
                DESIGN
              </button>
            </div>
          </div>
        )}
          </>
        )}
      </main>

      <footer className="h-8 border-t border-white/5 bg-black/60 backdrop-blur-xl px-4 flex items-center justify-between text-[8px] uppercase font-bold tracking-widest text-slate-500 z-30 shrink-0">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <div className={`w-1.5 h-1.5 rounded-full ${isGenerating ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'}`} />
            <span>{isGenerating ? 'Processing Node...' : 'System Nominal'}</span>
          </div>
          <div className="flex items-center gap-1.5 border-l border-white/10 pl-4">
            <Layers size={10} />
            <span>{scenario.modules.length} Active Modules</span>
          </div>
          <div className="flex items-center gap-1.5 border-l border-white/10 pl-4">
            <Sparkles size={10} className="text-indigo-400" />
            <span className="text-indigo-400">Vibe Level: 8.4</span>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <span>{scenario.modelEngine.toUpperCase()} ENGINE // v4.2.1</span>
          <div className="flex items-center gap-2">
            <span className="opacity-50">Local Mode</span>
            <div className="w-8 h-3 bg-white/5 rounded-full border border-white/10 relative">
               <div className="absolute left-1 top-0.5 w-2 h-2 bg-indigo-500 rounded-full" />
            </div>
          </div>
          <span className="font-mono text-indigo-400/50">60 FPS // 4D_READY</span>
        </div>
      </footer>
    </div>
  );
}

function CinematicHUD({ scenario, activeSceneId, progress, isScientific }: { scenario: Scenario, activeSceneId: string | null, progress: number, isScientific: boolean }) {
  const currentScene = scenario.timeline.find(s => s.id === activeSceneId);
  
  return (
    <div className="absolute inset-0 z-[200] pointer-events-none flex flex-col justify-between p-8 font-mono">
      {/* Top HUD */}
      <div className="flex justify-between items-start">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse shadow-[0_0_10px_#ef4444]" />
            <span className="text-sm font-bold text-white tracking-widest">REC [SCN_{activeSceneId?.slice(0, 4)}]</span>
          </div>
          <span className="text-[10px] text-white/40 uppercase">VEO_ENGINE_V3 // {scenario.modelEngine}</span>
        </div>

        <div className="flex flex-col items-end gap-1">
          <div className="px-3 py-1 bg-white/5 border border-white/10 rounded flex items-center gap-3">
            <span className="text-[10px] text-white/60">WORLD_CORE:</span>
            <span className="text-[10px] font-bold text-indigo-400">{scenario.worldConfig.physics.toUpperCase()} // ATMO_{scenario.worldConfig.atmosphere.toUpperCase()}</span>
          </div>
          <div className="text-[8px] text-white/20">COORD_SYNC: 0.052, -1.229, 0.441</div>
        </div>
      </div>

      {/* Middle HUD (if scientific) */}
      {isScientific && (
        <div className="absolute top-1/2 left-8 -translate-y-1/2 flex flex-col gap-4">
          <div className="w-[1px] h-32 bg-indigo-500/30 relative">
            <motion.div 
              animate={{ y: [0, 128, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
              className="absolute -left-1 w-2 h-2 bg-indigo-500 rounded-full shadow-[0_0_8px_#6366f1]"
            />
          </div>
          <div className="flex flex-col text-[8px] text-indigo-400 gap-1 opacity-60">
            <span>MET-GLY-SER-LEU...</span>
            <span>ALPHA_FOLD_CONFIDENCE: 98.2%</span>
            <span>PROTEO_LIGAND_BOUND</span>
          </div>
        </div>
      )}

      {/* Bottom HUD */}
      <div className="flex justify-between items-end">
        <div className="space-y-2">
          <div className="flex items-center gap-4">
            <div className="flex flex-col">
              <span className="text-[8px] text-white/20 uppercase tracking-tighter">Current Scene</span>
              <span className="text-xs font-bold text-white max-w-[200px] truncate">{currentScene?.description?.replace('[AUTO-SKILL DETECTED:', '').replace(']', '') || 'Sequencing...'}</span>
            </div>
            <div className="h-6 w-[1px] bg-white/10" />
            <div className="flex flex-col">
              <span className="text-[8px] text-white/20 uppercase tracking-tighter">BPM SYNC</span>
              <span className="text-xs font-bold text-indigo-400">{scenario.audioTrack?.bpm || 120}</span>
            </div>
          </div>
        </div>

        <div className="flex flex-col items-end gap-3">
           <div className="flex items-center gap-3">
             <div className="flex flex-col items-end">
                <span className="text-[8px] text-white/20 uppercase">RENDER_STATUS</span>
                <span className="text-[10px] font-bold text-indigo-400">NEURAL_UPSCALING_X8</span>
             </div>
             <Infinity className="text-indigo-500 animate-pulse" size={20} />
           </div>
           <div className="w-48 h-1 bg-white/5 rounded-full overflow-hidden border border-white/5">
              <div 
                className="h-full bg-white transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
           </div>
        </div>
      </div>

      {/* Grid corners for that high-tech feel */}
      <div className="absolute top-4 left-4 w-12 h-12 border-t border-l border-white/20" />
      <div className="absolute top-4 right-4 w-12 h-12 border-t border-r border-white/20" />
      <div className="absolute bottom-4 left-4 w-12 h-12 border-b border-l border-white/20" />
      <div className="absolute bottom-4 right-4 w-12 h-12 border-b border-r border-white/20" />
    </div>
  );
}
