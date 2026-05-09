import React from 'react';
import { motion } from 'framer-motion';
import { Play, SkipForward, SkipBack, Plus, Trash2, Clock, Music } from 'lucide-react';
import { Scene, TransitionStyle } from '../types';

interface TimelineProps {
  timeline: Scene[];
  activeSceneId: string | null;
  onSelectScene: (id: string) => void;
  onAddScene: () => void;
  onRemoveScene: (id: string) => void;
  onUpdateScene: (id: string, updates: Partial<Scene>) => void;
}

export const Timeline: React.FC<TimelineProps> = ({
  timeline,
  activeSceneId,
  onSelectScene,
  onAddScene,
  onRemoveScene,
  onUpdateScene
}) => {
  return (
    <div className="h-40 bg-black/40 border-t border-white/10 flex flex-col backdrop-blur-xl z-30">
      <div className="flex items-center justify-between px-6 py-2 border-b border-white/5 bg-white/5">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400">Sequence Director</span>
          </div>
          <div className="h-4 w-[1px] bg-white/10 mx-2" />
          <div className="flex items-center gap-1 font-mono text-[9px] text-indigo-400">
             VEO_OS // ACTIVE_SEQUENCER
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={onAddScene}
            className="flex items-center gap-2 px-3 py-1.5 bg-indigo-500/10 border border-indigo-500/30 rounded-lg text-[9px] uppercase font-bold tracking-tight text-indigo-300 hover:bg-indigo-500 hover:text-white transition-all shadow-[0_0_15px_rgba(99,102,241,0.1)]"
          >
            <Plus size={12} /> Add Keyframe
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-x-auto overflow-y-hidden custom-scrollbar flex items-center px-6 gap-3">
        {timeline.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center opacity-30 gap-2">
            <Music size={24} />
            <p className="text-[10px] uppercase tracking-widest">No hay escenas. Pídeme un 'Videoclip' para empezar la dirección creativa.</p>
          </div>
        ) : (
          timeline.map((scene, index) => (
            <motion.div 
              key={scene.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className={`relative min-w-[180px] h-24 rounded-xl border-2 transition-all cursor-pointer overflow-hidden group ${
                activeSceneId === scene.id 
                  ? 'border-indigo-500 bg-indigo-500/10 shadow-[0_0_20px_rgba(99,102,241,0.3)]' 
                  : 'border-white/5 bg-white/5 hover:border-white/20'
              }`}
              onClick={() => onSelectScene(scene.id)}
            >
              {/* Scene Content Preview (Abstract) */}
              <div className="absolute inset-0 opacity-20 pointer-events-none">
                 <div className="flex flex-wrap gap-1 p-2">
                   {scene.modules.map((m, i) => (
                     <div key={i} className="w-3 h-3 rounded-sm bg-white/40" />
                   ))}
                 </div>
              </div>

              <div className="absolute inset-0 p-3 flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[9px] font-mono text-indigo-400 font-bold">{String(index + 1).padStart(2, '0')}</span>
                    <Clock size={10} className="text-slate-500" />
                    <span className="text-[9px] font-mono text-slate-500">{Math.floor(scene.timestamp)}s</span>
                  </div>
                  <button 
                    onClick={(e) => { e.stopPropagation(); onRemoveScene(scene.id); }}
                    className="p-1 opacity-0 group-hover:opacity-100 hover:bg-red-500/20 text-red-400/60 hover:text-red-400 rounded transition-all"
                  >
                    <Trash2 size={10} />
                  </button>
                </div>

                <div className="space-y-1">
                   <p className="text-[10px] font-medium text-slate-200 truncate">{scene.description || 'Sin descripción'}</p>
                   <div className="flex items-center gap-2">
                     <select 
                       value={scene.transition}
                       onChange={(e) => onUpdateScene(scene.id, { transition: e.target.value as TransitionStyle })}
                       className="bg-black/40 border border-white/5 rounded px-1.5 py-0.5 text-[8px] uppercase tracking-tighter text-slate-500 hover:text-indigo-300 outline-none transition-colors"
                     >
                       <option value="none">Cut</option>
                       <option value="crossfade">Cross</option>
                       <option value="flash-white">F. White</option>
                       <option value="flash-black">F. Black</option>
                     </select>
                     <input 
                       type="number"
                       value={scene.duration}
                       onChange={(e) => onUpdateScene(scene.id, { duration: parseFloat(e.target.value) })}
                       className="bg-black/40 border border-white/5 rounded w-8 px-1 py-0.5 text-[8px] text-slate-400 outline-none"
                     />
                   </div>
                </div>
              </div>

              {/* Progress Indicator */}
              {activeSceneId === scene.id && (
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: '100%' }}
                  transition={{ duration: scene.duration, ease: "linear" }}
                  className="absolute bottom-0 left-0 h-1 bg-indigo-500"
                />
              )}
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
};
