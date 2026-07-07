import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Music, 
  Clapperboard, 
  Activity, 
  Cpu, 
  Save, 
  PlayCircle,
  Scissors,
  Eye,
  FileVideo,
  Globe,
  Zap,
  Wind,
  Terminal,
  Database,
  Layers,
  Sparkles
} from 'lucide-react';
import { AudioTrack, Scene, WorldConfig, ModelEngine } from '../types';

interface ProductionSuiteProps {
  scenarioName: string;
  audioTrack?: AudioTrack;
  onSetAudio: (track: AudioTrack) => void;
  timeline: Scene[];
  worldConfig: WorldConfig;
  onUpdateWorldConfig: (updates: Partial<WorldConfig>) => void;
  onAddScene: (timestamp: number) => void;
  onRender: () => void;
  isRendering: boolean;
  activeEngine: ModelEngine;
  onUpdateEngine: (engine: ModelEngine) => void;
}

export const ProductionSuite: React.FC<ProductionSuiteProps> = ({
  scenarioName,
  audioTrack,
  onSetAudio,
  timeline,
  worldConfig,
  onUpdateWorldConfig,
  onAddScene,
  onRender,
  isRendering,
  activeEngine,
  onUpdateEngine
}) => {
  const [showDashboard, setShowDashboard] = useState(false);
  const [musicUrl, setMusicUrl] = useState('');
  const [neuralLogs, setNeuralLogs] = useState<string[]>([]);

  const handleMusicaSubmit = () => {
    if (!musicUrl) return;
    onSetAudio({
      url: musicUrl,
      name: musicUrl.split('/').pop() || 'Original Track',
      bpm: 120, // Simulated BPM detection
      duration: 300 // Simulated 5 mins
    });
    setMusicUrl('');
  };

  return (
    <>
      <button 
        onClick={() => setShowDashboard(true)}
        className="fixed bottom-28 right-8 z-50 p-4 bg-indigo-500 text-white rounded-full shadow-[0_0_30px_rgba(99,102,241,0.5)] hover:scale-110 active:scale-95 transition-all group"
      >
        <Clapperboard size={24} className="group-hover:rotate-12 transition-transform" />
      </button>

      <AnimatePresence>
        {showDashboard && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed inset-8 z-[200] bg-[#020617]/95 backdrop-blur-3xl border border-white/10 rounded-3xl shadow-[0_0_100px_rgba(0,0,0,0.8)] flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="h-16 border-b border-white/5 flex items-center justify-between px-8 bg-white/5">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-500/20 text-indigo-400 rounded-lg">
                  <Cpu size={20} />
                </div>
                <div>
                  <h2 className="text-sm font-bold uppercase tracking-widest text-indigo-100">ARKAIOS PRODUCTION SUITE</h2>
                  <p className="text-[10px] text-slate-500 uppercase font-mono">Creative Director OS // Project: {scenarioName}</p>
                </div>
              </div>
              <button 
                onClick={() => setShowDashboard(false)}
                className="px-4 py-2 bg-rose-600/20 hover:bg-rose-600 text-rose-400 hover:text-white border border-rose-500/20 hover:border-rose-500 rounded-xl text-[11px] uppercase font-bold tracking-wider transition-all flex items-center gap-1.5 shadow-lg cursor-pointer"
                title="Cerrar Dashboard de Producción"
              >
                <span>Cerrar Dashboard</span>
                <span className="font-mono text-xs leading-none">✕</span>
              </button>
            </div>

            <div className="flex-1 flex overflow-hidden">
              {/* Left Column: Audio & Tools */}
              <div className="w-80 border-r border-white/5 p-6 space-y-8 overflow-y-auto custom-scrollbar">
                <section className="space-y-4">
                  <div className="flex items-center gap-2 text-indigo-400">
                    <Music size={16} />
                    <span className="text-[10px] uppercase font-bold tracking-widest">Sound Pre-listen (Hub)</span>
                  </div>
                  
                  {audioTrack ? (
                    <div className="p-4 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl space-y-3">
                      <div className="flex items-center gap-3">
                         <div className="w-10 h-10 bg-indigo-500 flex items-center justify-center rounded-lg">
                           <PlayCircle size={20} />
                         </div>
                         <div className="flex-1 truncate">
                           <p className="text-xs font-bold text-indigo-200 truncate">{audioTrack.name}</p>
                           <p className="text-[9px] text-indigo-400/60 font-mono">120 BPM detected</p>
                         </div>
                      </div>
                      <div className="flex gap-2">
                        <button className="flex-1 py-2 bg-indigo-500/20 hover:bg-indigo-500/40 rounded-lg text-[9px] font-bold uppercase transition-all">Reloop</button>
                        <button onClick={() => onAddScene(Date.now())} className="px-3 py-2 bg-indigo-500 hover:bg-indigo-400 rounded-lg text-white transition-all">
                          <Scissors size={14} />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 bg-white/5 border border-white/5 rounded-2xl space-y-4">
                      <p className="text-[10px] text-slate-500 leading-relaxed italic">No audio detected. Load track for beat-sync direction.</p>
                      <input 
                        type="text" 
                        placeholder="Music URL (MP3/SoundCloud)..."
                        value={musicUrl}
                        onChange={(e) => setMusicUrl(e.target.value)}
                        className="w-full bg-black/40 border border-white/5 rounded-lg px-3 py-2 text-[10px] outline-none focus:border-indigo-500/50"
                      />
                      <button 
                        onClick={handleMusicaSubmit}
                        className="w-full py-2 bg-indigo-500 hover:bg-indigo-400 rounded-xl text-[10px] font-bold uppercase transition-all"
                      >
                        Initialize Audio Agent
                      </button>
                    </div>
                  )}
                </section>

                <section className="space-y-4 pt-6 border-t border-white/5">
                  <div className="flex items-center gap-2 text-indigo-400">
                    <Globe size={16} />
                    <span className="text-[10px] uppercase font-bold tracking-widest">Genie World Engine</span>
                  </div>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between text-[9px] uppercase font-mono text-slate-500">
                        <span>Gravity Matrix</span>
                        <span>{(worldConfig.gravity * 100).toFixed(0)}%</span>
                      </div>
                      <input 
                        type="range" 
                        min="0" max="1" step="0.1"
                        value={worldConfig.gravity}
                        onChange={(e) => onUpdateWorldConfig({ gravity: parseFloat(e.target.value) })}
                        className="w-full accent-indigo-500"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                       {(['linear', 'floating', 'liquid', 'static'] as const).map(p => (
                         <button 
                           key={p}
                           onClick={() => onUpdateWorldConfig({ physics: p })}
                           className={`py-2 rounded-lg text-[9px] uppercase font-bold transition-all border ${worldConfig.physics === p ? 'bg-indigo-500 border-indigo-400 text-white' : 'bg-white/5 border-white/5 text-slate-500 hover:border-white/20'}`}
                         >
                           {p}
                         </button>
                       ))}
                    </div>

                    <div className="pt-2 text-[9px] text-slate-500 italic leading-relaxed">
                      "Genie detectará estos parámetros para generar un entorno interactivo coherente."
                    </div>
                  </div>
                </section>

                <section className="space-y-4 pt-6 border-t border-white/5">
                  <div className="flex items-center gap-2 text-indigo-400">
                    <Database size={16} />
                    <span className="text-[10px] uppercase font-bold tracking-widest">Neural Link Engines</span>
                  </div>
                  <div className="grid grid-cols-1 gap-2">
                     {[
                       { id: 'gemini-3.1', name: 'Gemini 3.1 Pro', desc: 'Reasoning & Logic', color: 'bg-indigo-500' },
                       { id: 'veo-cinematic', name: 'Veo Cinematic', desc: 'State-of-the-art Video', color: 'bg-rose-500' },
                       { id: 'genie-world', name: 'Genie 3 World', desc: 'Interactive Environments', color: 'bg-emerald-500' },
                       { id: 'gemma-open', name: 'Gemma 4 Core', desc: 'Foundation Architect', color: 'bg-amber-500' },
                       { id: 'lyria-audio', name: 'Lyria Pro', desc: 'Neural Sound Synthesis', color: 'bg-blue-500' },
                       { id: 'applied-ai', name: 'Breathe AI Master', desc: 'Syllabus-Based Intelligence', color: 'bg-white text-black' },
                       { id: 'video-gen-x', name: 'Video Gen SOTA', desc: 'Diffusion-Based Sequences', color: 'bg-purple-800' },
                       { id: '4d-db', name: '4D Database', desc: 'Enterprise Schema Logic', color: 'bg-slate-500' },
                       { id: 'screenmatch', name: 'Screenmatch AI', desc: 'Media Indexing & Catalog', color: 'bg-red-600' },
                       { id: 'cat-4d', name: 'CAT-4D Architect', desc: 'Multi-View Dynamic 3D', color: 'bg-lime-500' },
                       { id: 'sansar-vr', name: 'Sansar VR Logic', desc: 'Immersive Learning Engine', color: 'bg-orange-500' },
                       { id: 'flow-nexus', name: 'Flow Nexus 2.0', desc: 'Animation Infrastructure', color: 'bg-fuchsia-600' }
                     ].map(engine => (
                       <button 
                         key={engine.id}
                         onClick={() => onUpdateEngine(engine.id as ModelEngine)}
                         className={`p-3 rounded-2xl flex items-center gap-3 border transition-all text-left ${activeEngine === engine.id ? `border-white/20 ${engine.color} bg-opacity-20 shadow-[0_0_15px_rgba(255,255,255,0.1)]` : 'border-white/5 bg-white/5 opacity-50 hover:opacity-80'}`}
                       >
                          <div className={`w-2 h-2 rounded-full ${activeEngine === engine.id ? 'bg-white animate-pulse' : 'bg-slate-600'}`} />
                          <div className="flex-1">
                             <p className="text-[10px] font-bold text-white leading-none">{engine.name}</p>
                             <p className="text-[8px] text-slate-400 mt-1 uppercase font-mono">{engine.desc}</p>
                          </div>
                          {activeEngine === engine.id && <Sparkles size={12} className="text-white/40" />}
                       </button>
                     ))}
                  </div>
                </section>

                <section className="space-y-4 pt-6 border-t border-white/5">
                  <div className="flex items-center gap-2 text-amber-400">
                    <Layers size={16} />
                    <span className="text-[10px] uppercase font-bold tracking-widest">DeepMind Knowledge Base</span>
                  </div>
                  <div className="space-y-2">
                     <div className="p-2 bg-amber-500/5 rounded-lg border border-amber-500/10 flex items-center justify-between">
                        <span className="text-[8px] text-amber-200/60 uppercase font-mono">Gemma Core Docs</span>
                        <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                     </div>
                     <div className="p-2 bg-blue-500/5 rounded-lg border border-blue-500/10 flex items-center justify-between">
                        <span className="text-[8px] text-blue-200/60 uppercase font-mono">AlphaFold / AlphaMissense</span>
                        <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                     </div>
                     <div className="p-2 bg-emerald-500/5 rounded-lg border border-emerald-500/10 flex items-center justify-between">
                        <span className="text-[8px] text-emerald-200/60 uppercase font-mono">AlphaProteo Enzyme Sync</span>
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                     </div>
                  </div>
                </section>

                <section className="space-y-4 pt-6 border-t border-white/5">
                  <div className="flex items-center gap-2 text-cyan-400">
                    <Globe size={16} />
                    <span className="text-[10px] uppercase font-bold tracking-widest text-cyan-400">Arkaios External Sync</span>
                  </div>
                  <div className="space-y-2 p-3 bg-cyan-500/5 rounded-2xl border border-cyan-500/20">
                    <p className="text-[9px] text-cyan-200/60 leading-relaxed italic">
                      Sincroniza enlaces de tu Cloudinary o Arkaios Image Hub para usarlos en tiempo real.
                    </p>
                    <div className="flex gap-2 mt-2">
                       <input 
                         type="text" 
                         placeholder="Asset Name (e.g. dna_video)" 
                         className="flex-1 bg-black/40 border border-white/10 rounded-lg px-2 py-1.5 text-[8px] text-white focus:outline-none focus:border-cyan-500/50" 
                         id="external-asset-name"
                       />
                    </div>
                    <div className="flex gap-2">
                       <input 
                         type="text" 
                         placeholder="HTTPS Link (Cloudinary/Arkaios)" 
                         className="flex-1 bg-black/40 border border-white/10 rounded-lg px-2 py-1.5 text-[8px] text-white focus:outline-none focus:border-cyan-500/50" 
                         id="external-asset-url"
                       />
                       <button 
                         onClick={() => {
                           const nameInput = document.getElementById('external-asset-name') as HTMLInputElement;
                           const urlInput = document.getElementById('external-asset-url') as HTMLInputElement;
                           const name = nameInput.value;
                           const url = urlInput.value;
                           if (name && url) {
                             (window as any).syncExternalAsset?.({ name, url });
                             nameInput.value = '';
                             urlInput.value = '';
                           }
                         }}
                         className="px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 rounded-lg text-[8px] font-bold uppercase transition-all text-white"
                       >
                         Sync
                       </button>
                    </div>
                    <div className="pt-2 flex flex-wrap gap-1">
                       {[
                         { name: 'texture_crystal', url: 'https://images.unsplash.com/photo-1614728894747-a83421e2b9c9?q=80' },
                         { name: 'cyber_glitch', url: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?q=80' },
                         { name: 'organic_dna', url: 'https://images.unsplash.com/photo-1530973428-5bf2db2e4d71?q=80' }
                       ].map(preset => (
                         <button 
                           key={preset.name}
                           onClick={() => {
                             (window as any).syncExternalAsset?.(preset);
                           }}
                           className="px-2 py-1 bg-cyan-900/40 border border-cyan-800/30 rounded text-[7px] text-cyan-300 hover:bg-cyan-800/50 transition-all uppercase"
                         >
                           + {preset.name}
                         </button>
                       ))}
                    </div>
                  </div>
                </section>

                <section className="space-y-4 pt-6 border-t border-white/5">
                  <div className="flex items-center gap-2 text-fuchsia-400">
                    <Zap size={16} />
                    <span className="text-[10px] uppercase font-bold tracking-widest">Community Node Integrations</span>
                  </div>
                  <div className="space-y-2">
                     <div className="p-3 bg-fuchsia-500/5 rounded-2xl border border-fuchsia-500/20">
                        <p className="text-[10px] font-bold text-fuchsia-100">djklmr2025 // Nexus Hub</p>
                        <div className="mt-2 flex flex-wrap gap-1">
                           {['Flow Creator', 'Previewer 2.0', 'Showcase'].map(node => (
                             <span key={node} className="text-[7px] px-1.5 py-0.5 bg-fuchsia-500/20 text-fuchsia-300 rounded border border-fuchsia-500/30 uppercase">{node}</span>
                           ))}
                        </div>
                        <button 
                          onClick={() => {
                            const data = JSON.stringify({ project: scenarioName, timeline, activeEngine, date: new Date().toISOString() }, null, 2);
                            const blob = new Blob([data], { type: 'application/json' });
                            const url = URL.createObjectURL(blob);
                            const a = document.createElement('a');
                            a.href = url;
                            a.download = `flow_compatible_export.json`;
                            a.click();
                          }}
                          className="mt-3 w-full py-2 bg-fuchsia-600 hover:bg-fuchsia-500 rounded-xl text-[9px] font-bold uppercase transition-all text-white flex items-center justify-center gap-2"
                        >
                          <Save size={12} />
                          Export Flow Compatible JSON
                        </button>
                     </div>
                  </div>
                </section>

                <section className="space-y-4 pt-6 border-t border-white/5">
                  <div className="flex items-center gap-2 text-indigo-400">
                    <Terminal size={16} />
                    <span className="text-[10px] uppercase font-bold tracking-widest">Active Processing</span>
                  </div>
                  <div className="p-3 bg-black/60 rounded-xl border border-white/5 font-mono text-[8px] space-y-1 h-32 overflow-y-auto custom-scrollbar">
                     <p className="text-indigo-400 blinking-cursor">SYSTEM_BOOT: Protocol {activeEngine.toUpperCase()}</p>
                     <p className="text-slate-500">Checking cross-model handshake...</p>
                     <p className="text-emerald-500">Neural paths verified.</p>
                     <p className="text-amber-500">Gemma Core Logic: Documentation Synced.</p>
                     <p className="text-slate-500">Aggregating visual skills...</p>
                     <p className="text-indigo-300">Ready for VEO instructions.</p>
                  </div>
                </section>
              </div>

              {/* Center: Storyboard/Hub */}
              <div className="flex-1 p-8 overflow-y-auto custom-scrollbar bg-black/20">
                 <div className="mb-8 flex items-center justify-between">
                    <div>
                       <h3 className="text-xl font-bold text-white">Storyboard Director</h3>
                       <p className="text-xs text-slate-500">Visualiza cada escena antes del Rip Final.</p>
                    </div>
                    <button 
                      onClick={onRender}
                      disabled={isRendering || timeline.length === 0}
                      className="flex items-center gap-3 px-6 py-3 bg-white text-black rounded-2xl font-bold text-xs hover:bg-slate-200 transition-all disabled:opacity-30"
                    >
                      {isRendering ? (
                        <>
                          <motion.div 
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                          >
                            <Cpu size={18} />
                          </motion.div>
                          RIP + RENDER IN PROGRESS...
                        </>
                      ) : (
                        <>
                          <FileVideo size={18} />
                          RIP + RENDER (CONSOLIDATE)
                        </>
                      )}
                    </button>
                 </div>

                 <div className="grid grid-cols-2 lg:grid-cols-3 gap-6">
                    {timeline.map((scene, idx) => (
                      <motion.div 
                        key={scene.id}
                        whileHover={{ y: -5 }}
                        className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden group"
                      >
                         <div className="aspect-video bg-black flex items-center justify-center relative overflow-hidden">
                            <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-indigo-500 via-transparent to-transparent" />
                            <div className="absolute inset-0 flex flex-wrap gap-1 p-4 opacity-40">
                               {scene.modules.map((m, i) => (
                                 <div key={i} className="w-4 h-4 rounded bg-indigo-500/40 border border-indigo-500/20" />
                               ))}
                            </div>
                            <div className="absolute inset-0 flex items-center justify-center group-hover:scale-110 transition-transform">
                              <Eye size={24} className="text-white/20 group-hover:text-white transition-all shadow-2xl" />
                            </div>
                            <div className="absolute bottom-2 left-2 bg-black/80 px-2 py-1 rounded border border-white/10 text-[8px] font-mono text-indigo-400 backdrop-blur-md">
                              SCN_{String(idx + 1).padStart(2,'0')}
                            </div>
                         </div>
                         <div className="p-4 space-y-2">
                            <div className="flex items-center justify-between text-[8px] text-slate-500 font-bold uppercase">
                               <span>Start: {scene.timestamp}s</span>
                               <span>Duration: {scene.duration}s</span>
                            </div>
                            <p className="text-[10px] text-slate-300 font-medium line-clamp-2 italic leading-relaxed">
                               "{scene.description || 'Petición sin título'}"
                            </p>
                            <div className="pt-2 flex gap-1">
                               {scene.modules.slice(0, 4).map((_, i) => (
                                 <div key={i} className="w-1.5 h-1.5 rounded-full bg-indigo-500/40" />
                               ))}
                            </div>
                         </div>
                      </motion.div>
                    ))}
                    
                    <button 
                      onClick={() => onAddScene(timeline.length * 10)}
                      className="aspect-video bg-indigo-500/5 border border-dashed border-indigo-500/20 rounded-2xl flex flex-col items-center justify-center gap-3 text-indigo-400 hover:bg-indigo-500/10 hover:border-indigo-500/40 transition-all group"
                    >
                       <Scissors size={24} className="group-hover:scale-110 transition-transform" />
                       <span className="text-[10px] uppercase font-bold tracking-widest">Inject Scene Segment</span>
                    </button>
                 </div>
              </div>
            </div>

            {/* Footer Status */}
            <div className="h-10 border-t border-white/5 bg-black px-8 flex items-center justify-between text-[9px] uppercase tracking-tighter text-slate-600">
               <div className="flex gap-4">
                  <span>Renderer Level: 8K Optimized</span>
                  <span>Threads: AI-Parallelized</span>
               </div>
               <div className="flex gap-4 items-center">
                  <div className="flex items-center gap-1.5">
                     <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                     <span className="text-slate-400">Hub Online</span>
                  </div>
                  <span className="text-indigo-500/60 font-bold tracking-widest">ARK_VEO_OS_V4.1</span>
               </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
