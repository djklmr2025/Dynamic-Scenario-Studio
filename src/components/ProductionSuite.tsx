import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Music, 
  Clapperboard, 
  Activity, 
  Cpu, 
  Save, 
  PlayCircle,
  PauseCircle,
  Scissors,
  Eye,
  FileVideo,
  Globe,
  Zap,
  Wind,
  Terminal,
  Database,
  Layers,
  Sparkles,
  Download,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  FolderOpen
} from 'lucide-react';
import { AudioTrack, Scene, WorldConfig, ModelEngine } from '../types';

interface ProductionSuiteProps {
  scenarioName: string;
  audioTrack?: AudioTrack;
  onSetAudio: (track: AudioTrack) => void;
  timeline: Scene[];
  onSetTimeline?: (scenes: Scene[]) => void;
  worldConfig: WorldConfig;
  onUpdateWorldConfig: (updates: Partial<WorldConfig>) => void;
  onAddScene: (timestamp: number) => void;
  activeEngine: ModelEngine;
  onUpdateEngine: (engine: ModelEngine) => void;
}

const CITRICOS_DEMO_SCENES: Scene[] = [
  {
    id: "scn_01",
    timestamp: 0.0,
    duration: 6.5,
    imageUrl: "D:\\DJKLMR\\Videos\\JAZZ BEAT\\Citricos_y_Sal_Videoclip\\escena_01.jpg",
    description: "Intro: Vista general del mercado costero al atardecer.",
    modules: [],
    transition: "crossfade"
  },
  {
    id: "scn_02",
    timestamp: 6.5,
    duration: 16.5,
    imageUrl: "D:\\DJKLMR\\Videos\\JAZZ BEAT\\Citricos_y_Sal_Videoclip\\escena_02.jpg",
    description: "Verso 1: Puesto de frutas con naranjas y limones bañados por la luz dorada.",
    modules: [],
    transition: "crossfade"
  },
  {
    id: "scn_03",
    timestamp: 23.0,
    duration: 16.0,
    imageUrl: "D:\\DJKLMR\\Videos\\JAZZ BEAT\\Citricos_y_Sal_Videoclip\\escena_03.jpg",
    description: "Verso 2: Callejón empedrado con faroles y vista lejana al mar azul.",
    modules: [],
    transition: "crossfade"
  },
  {
    id: "scn_04",
    timestamp: 39.0,
    duration: 16.5,
    imageUrl: "D:\\DJKLMR\\Videos\\JAZZ BEAT\\Citricos_y_Sal_Videoclip\\escena_04.jpg",
    description: "Coro: Olas rompiendo suavemente contra el muelle al atardecer.",
    modules: [],
    transition: "crossfade"
  },
  {
    id: "scn_05",
    timestamp: 55.5,
    duration: 13.5,
    imageUrl: "D:\\DJKLMR\\Videos\\JAZZ BEAT\\Citricos_y_Sal_Videoclip\\escena_05.jpg",
    description: "Interludio Instrumental: Siluetas de gaviotas volando sobre el océano.",
    modules: [],
    transition: "crossfade"
  },
  {
    id: "scn_06",
    timestamp: 69.0,
    duration: 15.0,
    imageUrl: "D:\\DJKLMR\\Videos\\JAZZ BEAT\\Citricos_y_Sal_Videoclip\\escena_06.jpg",
    description: "Verso 3: Personas caminando y sombras alargadas en el paseo marítimo.",
    modules: [],
    transition: "crossfade"
  },
  {
    id: "scn_07",
    timestamp: 84.0,
    duration: 15.5,
    imageUrl: "D:\\DJKLMR\\Videos\\JAZZ BEAT\\Citricos_y_Sal_Videoclip\\escena_07.jpg",
    description: "Verso 4: Canasta de frutas con gotas de rocío y fondo desenfocado.",
    modules: [],
    transition: "crossfade"
  },
  {
    id: "scn_08",
    timestamp: 99.5,
    duration: 16.5,
    imageUrl: "D:\\DJKLMR\\Videos\\JAZZ BEAT\\Citricos_y_Sal_Videoclip\\escena_08.jpg",
    description: "Coro 2: Vista dramática del sol ocultándose en el horizonte marino.",
    modules: [],
    transition: "crossfade"
  },
  {
    id: "scn_09",
    timestamp: 116.0,
    duration: 24.0,
    imageUrl: "D:\\DJKLMR\\Videos\\JAZZ BEAT\\Citricos_y_Sal_Videoclip\\escena_09.jpg",
    description: "Puente: Luz de luna reflejada en el agua con tonos azules profundos.",
    modules: [],
    transition: "crossfade"
  },
  {
    id: "scn_10",
    timestamp: 140.0,
    duration: 24.0,
    imageUrl: "D:\\DJKLMR\\Videos\\JAZZ BEAT\\Citricos_y_Sal_Videoclip\\escena_10.jpg",
    description: "Coro Final & Outro: Faro costero encendido en la noche estrellada.",
    modules: [],
    transition: "crossfade"
  }
];

const CITRICOS_DEMO_SUBTITLES = `[00:00 - 00:06] Intro
Yeah, escucho el eco de la tarde,
un aroma que me lleva de vuelta...
[00:07 - 00:22] Verso 1
La fruta fresca brilla en el puesto,
cítricos amargos flotan en el viento.
Humedad marina que abraza la piel,
y tu recuerdo regresa otra vez.
[00:23 - 00:38] Verso 2
Cierro los ojos buscando tu luz,
en este mercado que huele a sur.
Cada color me recuerda a tu hogar,
un nido lejano difícil de hallar.
[00:39 - 00:55] Coro
Sabor a mar me duele,
huele a limón tu boca,
atardece y me desvelo,
sabor a mar me duele...
[00:55 - 01:08] Interludio instrumental
[01:09 - 01:23] Verso 3
La tarde cae despacio y fría,
mientras la gente pasa sonriendo,
y yo atrapado en esta agonía,
de un paraíso que estoy perdiendo.
[01:24 - 01:39] Verso 4
Frutas maduras que huelen a olvido,
en este suelo que no es el mío,
un eco dulce de lo que ha sido,
me deja el alma llena de frío.
[01:40 - 01:55] Coro
Sabor a mar me duele,
huele a limón tu boca,
atardece y me desvelo,
sabor a mar me duele...
[01:56 - 02:20] Puente
La sal se me mete en las heridas,
los cítricos queman lo que juré,
y entre tantas luces encendidas,
ya no sé si alguna vez te encontré.
[02:21 - 02:44] Coro Final & Outro
Sabor a mar me duele,
huele a limón tu boca,
atardece y me desvelo,
sabor a mar me duele...
Cítricos y sal en el aire...
Sólo me queda el frío de la tarde...`;

export const ProductionSuite: React.FC<ProductionSuiteProps> = ({
  scenarioName,
  audioTrack,
  onSetAudio,
  timeline,
  onSetTimeline,
  worldConfig,
  onUpdateWorldConfig,
  onAddScene,
  activeEngine,
  onUpdateEngine
}) => {
  const [showDashboard, setShowDashboard] = useState(false);
  const [musicUrl, setMusicUrl] = useState('');
  const [subtitlesText, setSubtitlesText] = useState('');
  const [aspectRatio, setAspectRatio] = useState<'16:9' | '9:16'>('16:9');
  
  // Render execution state
  const [isRendering, setIsRendering] = useState(false);
  const [renderProgress, setRenderProgress] = useState(0);
  const [renderStatus, setRenderStatus] = useState<string>('idle');
  const [neuralLogs, setNeuralLogs] = useState<string[]>([]);
  const [renderedVideoUrl, setRenderedVideoUrl] = useState<string | null>(null);
  const [renderedVideoFilename, setRenderedVideoFilename] = useState<string>('videoclip.mp4');

  const pollIntervalRef = useRef<any>(null);
  const logsContainerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll neural logs
  useEffect(() => {
    if (logsContainerRef.current) {
      logsContainerRef.current.scrollTop = logsContainerRef.current.scrollHeight;
    }
  }, [neuralLogs]);

  // Clean polling on unmount
  useEffect(() => {
    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    };
  }, []);

  const addNeuralLog = (msg: string) => {
    setNeuralLogs(prev => [...prev.slice(-40), `[${new Date().toLocaleTimeString()}] ${msg}`]);
  };

  const handleMusicaSubmit = () => {
    if (!musicUrl) return;
    onSetAudio({
      url: musicUrl,
      name: musicUrl.split(/[/\\]/).pop() || 'Original Track',
      bpm: 90,
      duration: 164
    });
    setMusicUrl('');
    addNeuralLog(`Audio cargado: ${musicUrl}`);
  };

  const handleLoadCitricosDemo = () => {
    onSetAudio({
      url: "D:\\DJKLMR\\Videos\\JAZZ BEAT\\Cítricos_y_sal.mp3",
      name: "Cítricos y Sal (Master Oficial)",
      bpm: 90,
      duration: 164
    });
    if (onSetTimeline) {
      onSetTimeline(CITRICOS_DEMO_SCENES);
    }
    setSubtitlesText(CITRICOS_DEMO_SUBTITLES);
    setAspectRatio('16:9');
    addNeuralLog("DEMO 'Cítricos y Sal' cargado exitosamente (10 escenas + audio master + letra sincronizada).");
  };

  const handleStartRender = async () => {
    if (isRendering) return;
    if (timeline.length === 0) {
      alert("Por favor añade al menos una escena o carga el demo antes de compilar.");
      return;
    }

    setIsRendering(true);
    setRenderProgress(0);
    setRenderStatus('iniciando');
    setRenderedVideoUrl(null);
    addNeuralLog("Iniciando solicitud de compilación al backend de ARKAIOS...");

    try {
      const response = await fetch('/api/videoclip/render', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          audioPath: audioTrack?.url || '',
          aspectRatio,
          scenes: timeline,
          subtitlesText
        })
      });

      if (!response.ok) {
        throw new Error(`Error en servidor: ${response.statusText}`);
      }

      const data = await response.json();
      const jobId = data.jobId;
      addNeuralLog(`Trabajo de compilación creado: ${jobId}`);

      // Start polling
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);

      pollIntervalRef.current = setInterval(async () => {
        try {
          const statusRes = await fetch(`/api/videoclip/status/${jobId}`);
          if (!statusRes.ok) return;
          const statusData = await statusRes.json();

          setRenderProgress(statusData.progress || 0);
          setRenderStatus(statusData.status);

          if (statusData.currentStep) {
            addNeuralLog(statusData.currentStep);
          }

          if (statusData.status === 'completed') {
            clearInterval(pollIntervalRef.current);
            setIsRendering(false);
            setRenderProgress(100);
            setRenderedVideoUrl(statusData.videoUrl);
            setRenderedVideoFilename(statusData.videoFilename || 'videoclip.mp4');
            addNeuralLog(`✓ RENDER COMPLETO: ${statusData.videoUrl}`);
          } else if (statusData.status === 'error') {
            clearInterval(pollIntervalRef.current);
            setIsRendering(false);
            addNeuralLog(`✕ ERROR EN RENDER: ${statusData.error}`);
            alert(`Error al compilar video: ${statusData.error}`);
          }
        } catch (err: any) {
          console.error("Error consultando estado de render:", err);
        }
      }, 1500);

    } catch (err: any) {
      setIsRendering(false);
      addNeuralLog(`✕ Fallo al iniciar render: ${err.message}`);
      alert(`No se pudo iniciar la compilación: ${err.message}`);
    }
  };

  return (
    <>
      {/* Floating Clapperboard Trigger */}
      <button 
        onClick={() => setShowDashboard(true)}
        className="fixed bottom-28 right-8 z-50 p-4 bg-gradient-to-tr from-indigo-600 to-purple-600 text-white rounded-full shadow-[0_0_30px_rgba(99,102,241,0.6)] hover:scale-110 active:scale-95 transition-all group flex items-center gap-2"
        title="Abrir ARKAIOS Production Suite"
      >
        <Clapperboard size={24} className="group-hover:rotate-12 transition-transform" />
        <span className="hidden group-hover:inline text-xs font-bold uppercase tracking-wider pr-2">Studio Videoclips</span>
      </button>

      <AnimatePresence>
        {showDashboard && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed inset-4 md:inset-8 z-[200] bg-[#020617]/95 backdrop-blur-3xl border border-white/10 rounded-3xl shadow-[0_0_100px_rgba(0,0,0,0.9)] flex flex-col overflow-hidden text-slate-200"
          >
            {/* Top Bar Header */}
            <div className="h-16 border-b border-white/10 flex items-center justify-between px-8 bg-white/5">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-indigo-500/20 text-indigo-400 rounded-xl border border-indigo-500/30 shadow-[0_0_15px_rgba(99,102,241,0.2)]">
                  <Cpu size={22} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-sm font-bold uppercase tracking-widest text-indigo-100">ARKAIOS PRODUCTION SUITE</h2>
                    <span className="px-2 py-0.5 bg-indigo-500/20 text-indigo-300 rounded text-[9px] font-mono font-semibold border border-indigo-500/30">v4.2 PRO</span>
                  </div>
                  <p className="text-[10px] text-slate-400 font-mono">Dynamic Scenario Studio // Project: <span className="text-indigo-300">{scenarioName}</span></p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                {/* Demo Preset Button */}
                <button 
                  onClick={handleLoadCitricosDemo}
                  className="px-3.5 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 rounded-xl text-[10px] uppercase font-bold tracking-wider transition-all flex items-center gap-1.5 shadow-md cursor-pointer hover:scale-105"
                  title="Cargar escena completa, audio master y subtitulos de Citricos y Sal"
                >
                  <Sparkles size={13} className="text-amber-400" />
                  <span>Cargar Demo: Cítricos y Sal</span>
                </button>

                {/* Close Button */}
                <button 
                  onClick={() => setShowDashboard(false)}
                  className="px-3.5 py-1.5 bg-rose-600/20 hover:bg-rose-600 text-rose-300 hover:text-white border border-rose-500/30 hover:border-rose-500 rounded-xl text-[11px] uppercase font-bold tracking-wider transition-all flex items-center gap-1.5 shadow-lg cursor-pointer"
                  title="Cerrar Dashboard de Producción"
                >
                  <span>Cerrar</span>
                  <span className="font-mono text-xs leading-none">✕</span>
                </button>
              </div>
            </div>

            {/* Main Studio Body */}
            <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
              
              {/* Left Column: Audio, Formats & Config */}
              <div className="w-full md:w-84 border-r border-white/10 p-6 space-y-6 overflow-y-auto custom-scrollbar bg-slate-950/40">
                
                {/* Audio Master Track */}
                <section className="space-y-3">
                  <div className="flex items-center justify-between text-indigo-400">
                    <div className="flex items-center gap-2">
                      <Music size={16} />
                      <span className="text-[10px] uppercase font-bold tracking-widest">Master Audio Track</span>
                    </div>
                    {audioTrack && (
                      <span className="text-[8px] px-1.5 py-0.5 bg-green-500/20 text-green-300 border border-green-500/30 rounded font-mono">CONECTADO</span>
                    )}
                  </div>
                  
                  {audioTrack ? (
                    <div className="p-3.5 bg-indigo-500/10 border border-indigo-500/30 rounded-2xl space-y-2.5">
                      <div className="flex items-center gap-3">
                         <div className="w-9 h-9 bg-indigo-500/30 border border-indigo-400/40 flex items-center justify-center rounded-xl text-indigo-300">
                           <PlayCircle size={20} />
                         </div>
                         <div className="flex-1 min-w-0">
                           <p className="text-xs font-bold text-indigo-100 truncate">{audioTrack.name}</p>
                           <p className="text-[9px] text-indigo-300/70 font-mono truncate" title={audioTrack.url}>{audioTrack.url}</p>
                         </div>
                      </div>
                      <div className="flex justify-between text-[9px] text-slate-400 font-mono pt-1 border-t border-indigo-500/10">
                        <span>BPM: {audioTrack.bpm || 90}</span>
                        <span>Duración: {audioTrack.duration || 164}s</span>
                      </div>
                    </div>
                  ) : (
                    <div className="p-3 bg-white/5 border border-white/5 rounded-2xl space-y-2">
                      <p className="text-[9px] text-slate-400 leading-relaxed">Ruta al archivo MP3 (ej: D:\DJKLMR\Videos\JAZZ BEAT\Cítricos_y_sal.mp3):</p>
                      <div className="flex gap-1.5">
                        <input 
                          type="text" 
                          placeholder="Ruta local o URL de audio..."
                          value={musicUrl}
                          onChange={(e) => setMusicUrl(e.target.value)}
                          className="flex-1 bg-black/50 border border-white/10 rounded-lg px-2.5 py-1.5 text-[9px] outline-none focus:border-indigo-500/50 font-mono text-white"
                        />
                        <button 
                          onClick={handleMusicaSubmit}
                          className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-[9px] font-bold uppercase transition-all text-white"
                        >
                          Cargar
                        </button>
                      </div>
                    </div>
                  )}
                </section>

                {/* Aspect Ratio Selector */}
                <section className="space-y-3 pt-4 border-t border-white/5">
                  <div className="flex items-center gap-2 text-indigo-400">
                    <FileVideo size={16} />
                    <span className="text-[10px] uppercase font-bold tracking-widest">Formato de Video</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <button 
                      onClick={() => setAspectRatio('16:9')}
                      className={`p-2.5 rounded-xl border text-left transition-all ${aspectRatio === '16:9' ? 'bg-indigo-600/30 border-indigo-400 text-white shadow-[0_0_15px_rgba(99,102,241,0.2)]' : 'bg-white/5 border-white/5 text-slate-400 hover:border-white/10'}`}
                    >
                      <div className="text-[10px] font-bold">16:9 Horizontal</div>
                      <div className="text-[8px] font-mono opacity-60">1920x1080 (YouTube/Cinema)</div>
                    </button>
                    <button 
                      onClick={() => setAspectRatio('9:16')}
                      className={`p-2.5 rounded-xl border text-left transition-all ${aspectRatio === '9:16' ? 'bg-indigo-600/30 border-indigo-400 text-white shadow-[0_0_15px_rgba(99,102,241,0.2)]' : 'bg-white/5 border-white/5 text-slate-400 hover:border-white/10'}`}
                    >
                      <div className="text-[10px] font-bold">9:16 Vertical</div>
                      <div className="text-[8px] font-mono opacity-60">1080x1920 (TikTok/Reels)</div>
                    </button>
                  </div>
                </section>

                {/* Subtitles & Lyrics Editor */}
                <section className="space-y-3 pt-4 border-t border-white/5">
                  <div className="flex items-center justify-between text-indigo-400">
                    <div className="flex items-center gap-2">
                      <Terminal size={16} />
                      <span className="text-[10px] uppercase font-bold tracking-widest">Letras / Subtítulos ASS</span>
                    </div>
                    <span className="text-[8px] text-slate-500 font-mono">Marcas [MM:SS]</span>
                  </div>
                  <textarea 
                    value={subtitlesText}
                    onChange={(e) => setSubtitlesText(e.target.value)}
                    placeholder="[00:00 - 00:06] Intro&#10;Verso con subtítulos..."
                    rows={6}
                    className="w-full bg-black/60 border border-white/10 rounded-xl p-2.5 text-[9px] font-mono text-slate-200 outline-none focus:border-indigo-500/50 custom-scrollbar resize-none"
                  />
                  <div className="text-[8px] text-slate-500 italic">
                    Los subtítulos se queman con estilo cinemático y sombra negra usando FFmpeg libass.
                  </div>
                </section>

                {/* Neural Compiler Logs */}
                <section className="space-y-3 pt-4 border-t border-white/5">
                  <div className="flex items-center justify-between text-indigo-400">
                    <div className="flex items-center gap-2">
                      <Activity size={16} />
                      <span className="text-[10px] uppercase font-bold tracking-widest">Compiler Terminal</span>
                    </div>
                    {isRendering && (
                      <div className="flex items-center gap-1 text-[8px] text-indigo-300 font-mono">
                        <RefreshCw size={10} className="animate-spin" />
                        <span>COMPILANDO</span>
                      </div>
                    )}
                  </div>
                  <div 
                    ref={logsContainerRef}
                    className="p-3 bg-black/70 rounded-xl border border-white/10 font-mono text-[8px] space-y-1 h-36 overflow-y-auto custom-scrollbar text-slate-300"
                  >
                     <p className="text-indigo-400 font-bold">ARKAIOS COMPILER ENGINE v4.2 [ONLINE]</p>
                     <p className="text-slate-500">FFmpeg Ken Burns ZoomPan: ACTIVADO</p>
                     <p className="text-slate-500">Audio Muxing AAC 320kbps: ACTIVADO</p>
                     {neuralLogs.map((log, i) => (
                       <p key={i} className={log.includes('✓') ? 'text-green-400' : log.includes('✕') ? 'text-red-400' : 'text-slate-300'}>
                         {log}
                       </p>
                     ))}
                  </div>
                </section>
              </div>

              {/* Center & Right: Storyboard Hub & Video Preview */}
              <div className="flex-1 p-6 md:p-8 overflow-y-auto custom-scrollbar bg-black/30 flex flex-col justify-between">
                <div>
                  {/* Top Action Bar */}
                  <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/5">
                    <div>
                      <h3 className="text-lg font-bold text-white flex items-center gap-2">
                        <span>Storyboard Director</span>
                        <span className="px-2 py-0.5 bg-white/10 text-slate-300 text-[10px] rounded-full font-mono font-normal">
                          {timeline.length} escenas
                        </span>
                      </h3>
                      <p className="text-[11px] text-slate-400">Configura las escenas, sincroniza tiempos y compila el videoclip en alta resolución.</p>
                    </div>

                    <div className="flex items-center gap-3">
                      <button 
                        onClick={handleStartRender}
                        disabled={isRendering || timeline.length === 0}
                        className="flex items-center gap-2.5 px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white rounded-2xl font-bold text-xs tracking-wider uppercase transition-all shadow-[0_0_25px_rgba(99,102,241,0.4)] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer hover:scale-105 active:scale-95"
                      >
                        {isRendering ? (
                          <>
                            <RefreshCw size={16} className="animate-spin" />
                            <span>COMPILANDO ({renderProgress}%)</span>
                          </>
                        ) : (
                          <>
                            <FileVideo size={16} />
                            <span>RIP + RENDER (COMPILAR 1080p)</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Render Progress Bar */}
                  {isRendering && (
                    <motion.div 
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mb-6 p-4 bg-indigo-500/10 border border-indigo-500/30 rounded-2xl space-y-2"
                    >
                      <div className="flex justify-between items-center text-xs font-mono">
                        <span className="text-indigo-300 font-bold flex items-center gap-2">
                          <Cpu size={14} className="animate-pulse" />
                          PROCESANDO ESCENAS CON FFMPEG KEN BURNS
                        </span>
                        <span className="text-white font-bold">{renderProgress}%</span>
                      </div>
                      <div className="w-full h-2.5 bg-black/60 rounded-full overflow-hidden border border-white/10">
                        <div 
                          className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 transition-all duration-300 rounded-full shadow-[0_0_10px_#6366f1]"
                          style={{ width: `${renderProgress}%` }}
                        />
                      </div>
                    </motion.div>
                  )}

                  {/* Finished Video Player & Download Banner */}
                  {renderedVideoUrl && (
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.98 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="mb-8 p-6 bg-gradient-to-br from-indigo-950/60 to-purple-950/60 border border-indigo-500/40 rounded-3xl shadow-[0_0_40px_rgba(99,102,241,0.3)] space-y-4"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-green-400">
                          <CheckCircle2 size={18} />
                          <span className="text-xs font-bold uppercase tracking-wider">¡Videoclip Compilado Exitosamente!</span>
                        </div>
                        <a 
                          href={renderedVideoUrl}
                          download={renderedVideoFilename}
                          className="flex items-center gap-2 px-4 py-2 bg-green-500 hover:bg-green-600 text-black font-bold text-xs rounded-xl shadow-lg transition-all hover:scale-105"
                        >
                          <Download size={14} />
                          <span>Descargar MP4 (1080p)</span>
                        </a>
                      </div>

                      <div className="aspect-video w-full max-w-2xl mx-auto bg-black rounded-2xl overflow-hidden border border-white/20 shadow-2xl">
                        <video 
                          src={renderedVideoUrl} 
                          controls 
                          autoPlay 
                          className="w-full h-full object-contain"
                        />
                      </div>
                    </motion.div>
                  )}

                  {/* Scene Storyboard Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                    {timeline.map((scene, idx) => (
                      <motion.div 
                        key={scene.id || idx}
                        whileHover={{ y: -4 }}
                        className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden group hover:border-indigo-500/40 transition-all flex flex-col shadow-lg"
                      >
                         <div className="aspect-video bg-black flex items-center justify-center relative overflow-hidden">
                            {scene.imageUrl ? (
                              <img 
                                src={scene.imageUrl.startsWith('http') ? scene.imageUrl : `/renders/${scene.imageUrl.split(/[/\\]/).pop()}`} 
                                alt={scene.description || `Scene ${idx+1}`}
                                onError={(e) => {
                                  // Fallback if local path is not statically served directly
                                  (e.target as any).style.display = 'none';
                                }}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                              />
                            ) : (
                              <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-indigo-950/40 to-black">
                                <Eye size={28} className="text-white/20" />
                              </div>
                            )}

                            <div className="absolute top-2 left-2 bg-black/80 px-2 py-0.5 rounded border border-white/10 text-[8px] font-mono text-indigo-400 backdrop-blur-md">
                              SCN_{String(idx + 1).padStart(2,'0')}
                            </div>
                            <div className="absolute top-2 right-2 bg-indigo-500/80 px-2 py-0.5 rounded text-[8px] font-mono text-white font-bold backdrop-blur-md">
                              {scene.duration}s
                            </div>
                         </div>

                         <div className="p-3.5 space-y-2 flex-1 flex flex-col justify-between">
                            <div>
                              <div className="flex items-center justify-between text-[8px] text-slate-400 font-bold uppercase font-mono">
                                 <span>Inicio: {scene.timestamp.toFixed(1)}s</span>
                                 <span>Duración: {scene.duration.toFixed(1)}s</span>
                              </div>
                              <p className="text-[10px] text-slate-200 font-medium line-clamp-2 italic mt-1">
                                 "{scene.description || 'Sin descripción'}"
                              </p>
                            </div>

                            {/* Scene Image URL / Path Input */}
                            <div className="pt-2 border-t border-white/5">
                              <input 
                                type="text"
                                value={scene.imageUrl || ''}
                                onChange={(e) => {
                                  const updatedTimeline = [...timeline];
                                  updatedTimeline[idx] = { ...updatedTimeline[idx], imageUrl: e.target.value };
                                  if (onSetTimeline) onSetTimeline(updatedTimeline);
                                }}
                                placeholder="Ruta de imagen (JPG/PNG)..."
                                className="w-full bg-black/40 border border-white/5 rounded px-2 py-1 text-[8px] font-mono text-slate-400 focus:text-white outline-none focus:border-indigo-500/50"
                              />
                            </div>
                         </div>
                      </motion.div>
                    ))}
                    
                    {/* Add Scene Card */}
                    <button 
                      onClick={() => {
                        const lastScene = timeline[timeline.length - 1];
                        const newTimestamp = lastScene ? lastScene.timestamp + lastScene.duration : 0;
                        onAddScene(newTimestamp);
                      }}
                      className="aspect-video bg-indigo-500/5 border border-dashed border-indigo-500/20 rounded-2xl flex flex-col items-center justify-center gap-2.5 text-indigo-400 hover:bg-indigo-500/10 hover:border-indigo-500/40 transition-all group cursor-pointer"
                    >
                       <Scissors size={22} className="group-hover:scale-110 transition-transform" />
                       <span className="text-[10px] uppercase font-bold tracking-widest">Añadir Nueva Escena</span>
                    </button>
                  </div>
                </div>

                {/* Footer Status Bar */}
                <div className="mt-8 pt-4 border-t border-white/10 flex items-center justify-between text-[9px] uppercase tracking-wider text-slate-500 font-mono">
                   <div className="flex gap-4">
                      <span>Render: 1080p Full HD</span>
                      <span>Audio: 320 kbps AAC</span>
                      <span>Motion: Ken Burns 60fps</span>
                   </div>
                   <div className="flex gap-4 items-center">
                      <div className="flex items-center gap-1.5">
                         <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                         <span className="text-slate-300">FFmpeg Compiler Listo</span>
                      </div>
                      <span className="text-indigo-400 font-bold">ARKAIOS STUDIO ENGINE</span>
                   </div>
                </div>
              </div>

            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
