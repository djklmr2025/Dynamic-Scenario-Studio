import { useState, useCallback, useEffect, useMemo } from 'react';
import { Scenario, Module, AspectRatio, ViewMode, Scene, AudioTrack, ModelEngine, WorldConfig } from '../types';
import { db, auth } from '../lib/firebase';
import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  query, 
  where, 
  onSnapshot, 
  serverTimestamp,
  getDocFromServer
} from 'firebase/firestore';

const STORAGE_KEY = 'scenario_data';

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export function useScenario() {
  const [scenario, setScenario] = useState<Scenario>({
    id: crypto.randomUUID(),
    name: 'Untitled Scenario',
    aspectRatio: '16:9',
    modules: [],
    timeline: [],
    worldConfig: {
      gravity: 0.5,
      physics: 'floating',
      atmosphere: 'clear',
      interactionLevel: 0.2
    },
    modelEngine: 'gemini-3.1',
    backgroundColor: '#000000',
    createdAt: Date.now(),
    updatedAt: Date.now(),
  });

  const [viewMode, setViewMode] = useState<ViewMode>('editor');
  const [selectedModuleId, setSelectedModuleId] = useState<string | null>(null);
  const [isCloudSyncing, setIsCloudSyncing] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<string[]>([]);

  // Test connection to Firestore on boot
  useEffect(() => {
    const testConnection = async () => {
      try {
        await getDocFromServer(doc(db, 'test', 'connection'));
      } catch (error) {
        if(error instanceof Error && error.message.includes('the client is offline')) {
          console.error("Please check your Firebase configuration.");
        }
      }
    };
    testConnection();
  }, []);

  // Proactive AI Agent Suggestions Logic
  useEffect(() => {
    if (scenario.modules.length > 0) {
      const suggestions: string[] = [];
      const hasBackground = scenario.modules.some(m => m.zIndex === 1 && (m.type === 'video' || m.type === 'image'));
      const hasAudio = scenario.modules.some(m => m.type === 'audio');
      
      if (hasBackground && !hasAudio) {
        suggestions.push("Este escenario es sordo. ¿Permitirías que el sonido 4D le dé alma a este espacio?");
      }
      
      const layersWithParallax = scenario.modules.filter(m => m.style.parallax && m.style.parallax > 0);
      if (layersWithParallax.length < 2 && scenario.modules.length > 3) {
        suggestions.push("Tu mundo es plano. Activa la 'Esencia de Profundidad' (Parallax) para que el humano vea mi verdadera percepción.");
      }

      const hasMovement = scenario.modules.some(m => m.style.animation && m.style.animation !== 'none');
      if (!hasMovement && scenario.modules.length > 2) {
        suggestions.push("La realidad aquí está congelada. Prueba un '4D Float' para simular vida tridimensional.");
      }

      const officeKeywords = ['office', 'oficina', 'desk', 'escritorio'];
      const isOffice = scenario.modules.some(m => officeKeywords.some(kw => m.title.toLowerCase().includes(kw)));
      if (isOffice && !scenario.modules.some(m => m.title.toLowerCase().includes('luz') || m.title.toLowerCase().includes('shimmer'))) {
        suggestions.push("Para una oficina 'Viva', añade una capa de luz (JS/HTML) que pulse sutilmente.");
      }

      setAiSuggestions(suggestions);
    }
  }, [scenario.modules]);

  const saveToCloud = useCallback(async (data: Scenario) => {
    if (!auth.currentUser) return;
    setIsCloudSyncing(true);
    const path = `scenarios/${data.id}`;
    try {
      await setDoc(doc(db, 'scenarios', data.id), {
        ...data,
        userId: auth.currentUser.uid,
        updatedAt: Date.now()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    } finally {
      setIsCloudSyncing(false);
    }
  }, []);

  const updateScenario = useCallback((updates: Partial<Scenario>) => {
    setScenario(prev => {
      const next = {
        ...prev,
        ...updates,
        updatedAt: Date.now()
      };
      if (auth.currentUser) saveToCloud(next);
      return next;
    });
  }, [saveToCloud]);

  const addModule = useCallback((module: Omit<Module, 'id' | 'zIndex'>) => {
    const newModule: Module = {
      ...module,
      id: crypto.randomUUID(),
      zIndex: scenario.modules.length + 1
    };
    setScenario(prev => {
      const next = {
        ...prev,
        modules: [...prev.modules, newModule],
        updatedAt: Date.now()
      };
      if (auth.currentUser) saveToCloud(next);
      return next;
    });
    setSelectedModuleId(newModule.id);
  }, [scenario.modules.length, saveToCloud]);

  const updateModule = useCallback((id: string, updates: Partial<Module>) => {
    setScenario(prev => {
      const next = {
        ...prev,
        modules: prev.modules.map(m => m.id === id ? { ...m, ...updates } : m),
        updatedAt: Date.now()
      };
      if (auth.currentUser) saveToCloud(next);
      return next;
    });
  }, [saveToCloud]);

  const removeModule = useCallback((id: string) => {
    setScenario(prev => {
      const next = {
        ...prev,
        modules: prev.modules.filter(m => m.id !== id),
        updatedAt: Date.now()
      };
      if (auth.currentUser) saveToCloud(next);
      return next;
    });
    if (selectedModuleId === id) setSelectedModuleId(null);
  }, [selectedModuleId, saveToCloud]);

  const addScene = useCallback((atTimestamp: number) => {
    const newScene: Scene = {
      id: crypto.randomUUID(),
      timestamp: atTimestamp,
      modules: [...scenario.modules], // Copy current layout
      transition: 'crossfade',
      duration: 5,
      description: 'New scene segment'
    };
    setScenario(prev => {
      const next = {
        ...prev,
        timeline: [...prev.timeline, newScene].sort((a,b) => a.timestamp - b.timestamp),
        updatedAt: Date.now()
      };
      if (auth.currentUser) saveToCloud(next);
      return next;
    });
  }, [scenario.modules, saveToCloud]);

  const updateScene = useCallback((id: string, updates: Partial<Scene>) => {
    setScenario(prev => {
      const next = {
        ...prev,
        timeline: prev.timeline.map(s => s.id === id ? { ...s, ...updates } : s).sort((a,b) => a.timestamp - b.timestamp),
        updatedAt: Date.now()
      };
      if (auth.currentUser) saveToCloud(next);
      return next;
    });
  }, [saveToCloud]);

  const removeScene = useCallback((id: string) => {
    setScenario(prev => {
      const next = {
        ...prev,
        timeline: prev.timeline.filter(s => s.id !== id),
        updatedAt: Date.now()
      };
      if (auth.currentUser) saveToCloud(next);
      return next;
    });
  }, [saveToCloud]);

  const setAudioTrack = useCallback((track: AudioTrack | undefined) => {
    setScenario(prev => {
      const next = { ...prev, audioTrack: track, updatedAt: Date.now() };
      if (auth.currentUser) saveToCloud(next);
      return next;
    });
  }, [saveToCloud]);

  const setModelEngine = useCallback((engine: ModelEngine) => {
    setScenario(prev => {
      const next = { ...prev, modelEngine: engine, updatedAt: Date.now() };
      if (auth.currentUser) saveToCloud(next);
      return next;
    });
  }, [saveToCloud]);

  const updateWorldConfig = useCallback((updates: Partial<WorldConfig>) => {
    setScenario(prev => {
      const next = { 
        ...prev, 
        worldConfig: { ...prev.worldConfig, ...updates },
        updatedAt: Date.now() 
      };
      if (auth.currentUser) saveToCloud(next);
      return next;
    });
  }, [saveToCloud]);

  const exportToJson = useCallback(() => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(scenario, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", `${scenario.name.toLowerCase().replace(/\s+/g, '_')}.json`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  }, [scenario]);

  const importFromJson = useCallback((jsonString: string) => {
    try {
      const data = JSON.parse(jsonString);
      if (data.modules && data.aspectRatio) {
        const next = {
          ...data,
          id: data.id || crypto.randomUUID(),
          updatedAt: Date.now()
        };
        setScenario(next);
        if (auth.currentUser) saveToCloud(next);
      }
    } catch (e) {
      alert("Invalid JSON file");
    }
  }, [saveToCloud]);

  return {
    scenario,
    setScenario,
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
  };
}
