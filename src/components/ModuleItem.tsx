import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Lock, Unlock, Maximize2, Trash2, Settings, ExternalLink, Video, Type as TextIcon, Image as ImageIcon, Frame, Music, Volume2, VolumeX, Code, Zap } from 'lucide-react';
import { Module, ModuleType } from '../types';

interface ModuleItemProps {
  module: Module;
  isEditing: boolean;
  isSelected: boolean;
  onUpdate: (updates: Partial<Module>) => void;
  onSelect: () => void;
  onRemove: () => void;
  onTriggerAction?: (action: any) => void;
}

export const ModuleItem: React.FC<ModuleItemProps> = ({
  module,
  isEditing,
  isSelected,
  onUpdate,
  onSelect,
  onRemove,
  onTriggerAction
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  // Handle Resize via scroll
  const handleWheel = useCallback((e: React.WheelEvent) => {
    if (!isSelected || !isEditing || module.isLocked) return;
    
    e.preventDefault();
    const scaleFactor = 0.5;
    const delta = e.deltaY > 0 ? -scaleFactor : scaleFactor;
    
    onUpdate({
      width: Math.max(5, Math.min(100, module.width + delta)),
      height: Math.max(5, Math.min(100, module.height + delta))
    });
  }, [isSelected, isEditing, module.isLocked, module.width, module.height, onUpdate]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = module.volume ?? 1;
    }
  }, [module.volume]);

  const renderContent = () => {
    switch (module.type) {
      case 'audio':
        return (
          <div className="w-full h-full flex flex-col items-center justify-center bg-indigo-500/10 border border-indigo-500/20 rounded-xl p-4">
            <Music className="text-indigo-400 mb-2" size={isSelected ? 32 : 24} />
            {isSelected && (
              <div className="flex flex-col items-center gap-1 w-full">
                <span className="text-[10px] text-indigo-200 uppercase font-bold truncate w-full text-center">{module.title}</span>
                <audio ref={audioRef} src={module.content} loop={module.isLooping} autoPlay />
                <div className="flex items-center gap-2 mt-2">
                   {module.volume === 0 ? <VolumeX size={12} /> : <Volume2 size={12} />}
                   <input 
                    type="range" 
                    min="0" max="1" step="0.1" 
                    value={module.volume ?? 1} 
                    onChange={(e) => onUpdate({ volume: parseFloat(e.target.value) })}
                    className="w-16 h-1 bg-white/10 rounded-full appearance-none cursor-pointer accent-indigo-500"
                   />
                </div>
              </div>
            )}
          </div>
        );
      case 'text':
        return <div className="w-full h-full p-4 overflow-auto text-white whitespace-pre-wrap">{module.content}</div>;
      case 'video':
        return (
          <div className="w-full h-full relative pointer-events-none">
            {module.content.includes('youtube.com') || module.content.includes('youtu.be') ? (
              <iframe 
                src={module.content.replace('watch?v=', 'embed/')} 
                className="w-full h-full border-0" 
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              />
            ) : (
              <video src={module.content} loop={module.isLooping} autoPlay muted className="w-full h-full object-cover" />
            )}
          </div>
        );
      case 'image':
        return <img src={module.content} alt={module.title} className="w-full h-full object-cover pointer-events-none" />;
      case 'js':
        return (
          <iframe 
            srcDoc={`
              <html>
                <body style="margin:0; overflow:hidden; background:transparent;">
                  ${module.content.includes('<script>') ? module.content : `<script>${module.content}</script>`}
                </body>
              </html>
            `}
            className="w-full h-full border-0 pointer-events-none"
            title={module.title}
          />
        );
      case 'html':
        return (
          <div 
            className="w-full h-full overflow-hidden"
            dangerouslySetInnerHTML={{ __html: module.content }} 
          />
        );
      case 'iframe':
      case 'link':
        return <iframe src={module.content} className="w-full h-full border-0 pointer-events-none" title={module.title} />;
      default:
        return null;
    }
  };

  const getIcon = (type: ModuleType) => {
    switch (type) {
      case 'text': return <TextIcon size={14} />;
      case 'video': return <Video size={14} />;
      case 'image': return <ImageIcon size={14} />;
      case 'iframe': return <Frame size={14} />;
      case 'audio': return <Music size={14} />;
      case 'js': return <Code size={14} />;
      case 'html': return <Code size={14} />;
      default: return <ExternalLink size={14} />;
    }
  };

  const animationProps = () => {
    if (!module.style) return {};
    switch (module.style.animation) {
      case 'subtle-float':
        return {
          animate: { y: [0, -10, 0] },
          transition: { duration: 4, repeat: Infinity, ease: "easeInOut" }
        };
      case 'pulse':
        return {
          animate: { scale: [1, 1.05, 1] },
          transition: { duration: 3, repeat: Infinity, ease: "easeInOut" }
        };
      case 'gentle-shake':
        return {
          animate: { rotate: [-1, 1, -1] },
          transition: { duration: 5, repeat: Infinity, ease: "easeInOut" }
        };
      case 'sway':
        return {
          animate: { rotate: [-2, 2, -2], x: [-1, 1, -1] },
          transition: { duration: 6, repeat: Infinity, ease: "easeInOut" }
        };
      case 'blink':
        return {
          animate: { opacity: [1, 0.4, 1, 0.8, 1] },
          transition: { duration: 2, repeat: Infinity, times: [0, 0.2, 0.4, 0.6, 1], ease: "easeInOut" }
        };
      case 'drift':
        return {
          animate: { x: [0, 40, 0], opacity: [0.8, 1, 0.8] },
          transition: { duration: 20, repeat: Infinity, ease: "linear" }
        };
      default:
        return {};
    }
  };

  const parallaxValue = (module.style?.parallax ?? 0) * 20;

  return (
    <motion.div
      ref={containerRef}
      onWheel={handleWheel}
      initial={false}
      animate={{
        top: `${module.y}%`,
        left: `${module.x}%`,
        width: `${module.width}%`,
        height: `${module.height}%`,
        zIndex: module.zIndex,
        boxShadow: isSelected ? `0 0 0 2px ${module.style?.accentColor || '#6366f1'}, 0 8px 16px rgba(0,0,0,0.5)` : '0 4px 8px rgba(0,0,0,0.3)',
        scale: isSelected ? 1.02 : 1,
        x: isEditing ? 0 : parallaxValue, // Simple parallax horizontal
        filter: module.style?.blur ? `blur(${module.style.blur}px)` : 'none',
        borderColor: module.style?.accentColor || 'transparent',
        borderWidth: module.style?.accentColor ? 2 : 0,
        ...animationProps().animate
      }}
      transition={{
        ...animationProps().transition,
        duration: 0.2 // Default for property changes
      }}
      className={`absolute cursor-move select-none overflow-hidden group transition-shadow`}
      style={{
        borderRadius: `${module.style?.borderRadius || 0}px`,
        backgroundColor: module.style?.backgroundColor || 'transparent',
        opacity: module.style?.opacity ?? 1,
        border: `${module.style?.borderWidth || 0}px solid ${module.style?.borderColor || 'transparent'}`,
      }}
      onClick={(e) => {
        e.stopPropagation();
        onSelect();
        module.actions?.filter(a => a.trigger === 'click').forEach(a => onTriggerAction?.(a));
      }}
      onMouseEnter={() => {
        module.actions?.filter(a => a.trigger === 'hover').forEach(a => onTriggerAction?.(a));
        module.actions?.filter(a => a.trigger === 'enter').forEach(a => onTriggerAction?.(a));
      }}
      onMouseLeave={() => {
        module.actions?.filter(a => a.trigger === 'exit').forEach(a => onTriggerAction?.(a));
      }}
      drag={isEditing && !module.isLocked}
      dragMomentum={false}
      onDragStart={() => setIsDragging(true)}
      onDragEnd={(_, info) => {
        setIsDragging(false);
        if (containerRef.current?.parentElement) {
          const parent = containerRef.current.parentElement;
          const rect = parent.getBoundingClientRect();
          const newX = (containerRef.current.offsetLeft / rect.width) * 100;
          const newY = (containerRef.current.offsetTop / rect.height) * 100;
          onUpdate({ x: newX, y: newY });
        }
      }}
    >
      {/* Content */}
      <div className="w-full h-full relative">
        {renderContent()}
      </div>

      {/* Editor Controls */}
      <AnimatePresence>
        {isEditing && (isSelected || !isDragging) && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute top-0 left-0 right-0 p-2 bg-black/60 backdrop-blur-md flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <div className="flex items-center gap-2">
              <div className="text-white/80 p-1 bg-white/10 rounded">
                {getIcon(module.type)}
              </div>
              <span className="text-[10px] uppercase tracking-wider text-white font-medium truncate w-24">
                {module.title}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <button 
                onClick={(e) => { 
                  e.stopPropagation(); 
                  const types: ModuleType[] = ['text', 'image', 'video', 'js'];
                  const nextType = types[(types.indexOf(module.type) + 1) % types.length];
                  onUpdate({ type: nextType });
                }}
                title="Morph Type"
                className="p-1 hover:bg-indigo-500/40 rounded transition-colors text-indigo-300"
              >
                <Zap size={12} />
              </button>
              <button 
                onClick={(e) => { e.stopPropagation(); onUpdate({ isLocked: !module.isLocked }); }}
                className="p-1 hover:bg-white/20 rounded transition-colors text-white"
              >
                {module.isLocked ? <Lock size={12} /> : <Unlock size={12} />}
              </button>
              <button 
                onClick={(e) => { e.stopPropagation(); onRemove(); }}
                className="p-1 hover:bg-red-500/40 rounded transition-colors text-white"
              >
                <Trash2 size={12} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Resize Handle (Bottom Right) */}
      {isEditing && isSelected && !module.isLocked && module.type !== 'audio' && (
        <div 
          className="absolute bottom-0 right-0 w-4 h-4 cursor-nwse-resize bg-indigo-500 rounded-tl-lg"
          onMouseDown={(e) => {
            e.stopPropagation();
            setIsResizing(true);
            const startX = e.clientX;
            const startY = e.clientY;
            const startWidth = module.width;
            const startHeight = module.height;

            const handleMouseMove = (moveEvent: MouseEvent) => {
              if (containerRef.current?.parentElement) {
                const parentRect = containerRef.current.parentElement.getBoundingClientRect();
                const deltaX = ((moveEvent.clientX - startX) / parentRect.width) * 100;
                const deltaY = ((moveEvent.clientY - startY) / parentRect.height) * 100;
                onUpdate({
                  width: Math.max(5, startWidth + deltaX),
                  height: Math.max(5, startHeight + deltaY)
                });
              }
            };

            const handleMouseUp = () => {
              setIsResizing(false);
              document.removeEventListener('mousemove', handleMouseMove);
              document.removeEventListener('mouseup', handleMouseUp);
            };

            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
          }}
        >
          <Maximize2 size={8} className="absolute bottom-0.5 right-0.5 text-white" />
        </div>
      )}
    </motion.div>
  );
};
