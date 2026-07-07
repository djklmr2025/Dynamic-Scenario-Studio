import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Box, 
  Video, 
  RotateCw, 
  Play, 
  Pause, 
  Maximize2, 
  Minimize2, 
  Download, 
  Settings, 
  Sliders, 
  Sparkles, 
  RefreshCw, 
  Layers, 
  HelpCircle, 
  Zap,
  Check,
  Eye,
  Activity,
  Coins,
  Compass,
  ArrowRight,
  Monitor
} from 'lucide-react';

// Types for 3D points
interface Point3D {
  x: number;
  y: number;
  z: number;
}

interface Edge3D {
  a: number;
  b: number;
  color?: string;
}

interface StageCube {
  id: string;
  name: string;
  center: Point3D;
  size: number;
  color: string;
  isRotating: boolean;
  rotationSpeed: number;
  opacity: number;
}

export const StudioAIMotion: React.FC = () => {
  // Main Canvas references
  const mainCanvasRef = useRef<HTMLCanvasElement>(null);
  const cam1CanvasRef = useRef<HTMLCanvasElement>(null); // Middle/Orbital
  const cam2CanvasRef = useRef<HTMLCanvasElement>(null); // Top/God
  const cam3CanvasRef = useRef<HTMLCanvasElement>(null); // Bottom/God Inverted

  // Viewport camera controls
  const [pitch, setPitch] = useState<number>(-0.4); // Rotation around X (X-tilt)
  const [yaw, setYaw] = useState<number>(0.6);   // Rotation around Y (Y-spin)
  const [zoom, setZoom] = useState<number>(1.2);
  const [activeCamView, setActiveCamView] = useState<'viewport' | 'cam1' | 'cam2' | 'cam3'>('viewport');
  const [selectedShot, setSelectedShot] = useState<'close-up' | 'close-app' | 'close-ure'>('close-app');
  const [engineMode, setEngineMode] = useState<'veo-cinematic' | 'genie-world' | 'lyria-audio'>('veo-cinematic');

  // Interactive Timeline state for "Walking Character & Coin" scenario
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [playbackTime, setPlaybackTime] = useState<number>(0); // 0 to 8 seconds
  const [duration] = useState<number>(8); // Maximum 8 seconds per standard
  const [activePhase, setActivePhase] = useState<number>(0);
  const [showWireframes, setShowWireframes] = useState<boolean>(true);
  const [glowIntensity, setGlowIntensity] = useState<number>(8);
  const [fogLevel, setFogLevel] = useState<number>(15);
  const [gravity, setGravity] = useState<number>(0.5);

  // Custom 3D Cubes/Stages in the scene
  const [cubes, setCubes] = useState<StageCube[]>([
    { id: 'cube-1', name: 'Escenario Base', center: { x: 0, y: -20, z: 0 }, size: 80, color: 'rgba(99, 102, 241, 0.15)', isRotating: false, rotationSpeed: 0, opacity: 0.1 },
    { id: 'cube-2', name: 'Actor Holográfico', center: { x: -30, y: 15, z: 20 }, size: 25, color: 'rgba(236, 72, 153, 0.3)', isRotating: true, rotationSpeed: 0.02, opacity: 0.4 },
    { id: 'cube-3', name: 'Hito Lumínico', center: { x: 30, y: 30, z: -30 }, size: 15, color: 'rgba(34, 197, 94, 0.4)', isRotating: true, rotationSpeed: -0.01, opacity: 0.5 }
  ]);

  // AI Prompt for the studio
  const [studioPrompt, setStudioPrompt] = useState<string>('');
  const [studioLogs, setStudioLogs] = useState<string[]>([
    'STUDIO_AI_MOTION v5.0.0: Núcleo tridimensional inicializado.',
    'Cámaras de 3 capas sincronizadas [Orbital 360, God Mode, God Mode Inv].',
    'Listo para recibir impulsos cinemáticos para orquestar la escena.'
  ]);

  const [isAiProcessing, setIsAiProcessing] = useState<boolean>(false);

  // Phases description
  const PHASES = [
    { title: "Fase 1: Caminata Lateral", desc: "El personaje avanza con cámara orbital media rotando a su alrededor dando profundidad de espacio.", duration: 3.0 },
    { title: "Fase 2: Encuadre de Objeto", desc: "Personaje se detiene frente a la moneda dorada. Comienza inclinación de cámara.", duration: 1.5 },
    { title: "Fase 3: Zoom Extremo Coin", desc: "Detalles holográficos y valor de la moneda en primer plano con zoom ultra detallado.", duration: 1.5 },
    { title: "Fase 4: Elevación & Silueta", desc: "El personaje levanta la moneda y se yergue. Cámara asciende revelando su silueta iluminada.", duration: 1.5 },
    { title: "Fase 5: Zoom Out de Cierre", desc: "Alejamiento de cámara para dar cierre completo a la secuencia publicitaria.", duration: 0.5 }
  ];

  // Helper to get active phase info based on playback time
  useEffect(() => {
    let acc = 0;
    let found = 0;
    for (let i = 0; i < PHASES.length; i++) {
      acc += PHASES[i].duration;
      if (playbackTime <= acc) {
        found = i;
        break;
      }
    }
    setActivePhase(found);
  }, [playbackTime]);

  // Timeline Interval
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (isPlaying) {
      interval = setInterval(() => {
        setPlaybackTime(prev => {
          let next = prev + 0.033; // ~30 fps update
          if (next >= duration) {
            return 0; // Loop timeline
          }
          return next;
        });
      }, 33);
    }
    return () => clearInterval(interval);
  }, [isPlaying, duration]);

  // 3D Math Projection Utilities
  const projectPoint = (
    p: Point3D, 
    yawRad: number, 
    pitchRad: number, 
    zoomVal: number, 
    width: number, 
    height: number,
    focalLength = 300,
    cameraOffset: Point3D = { x: 0, y: 0, z: 0 }
  ) => {
    // Apply camera positional offset
    let dx = p.x - cameraOffset.x;
    let dy = p.y - cameraOffset.y;
    let dz = p.z - cameraOffset.z;

    // Yaw rotation (around Y axis)
    let x1 = dx * Math.cos(yawRad) - dz * Math.sin(yawRad);
    let z1 = dx * Math.sin(yawRad) + dz * Math.cos(yawRad);

    // Pitch rotation (around X axis)
    let y2 = dy * Math.cos(pitchRad) - z1 * Math.sin(pitchRad);
    let z2 = dy * Math.sin(pitchRad) + z1 * Math.cos(pitchRad);

    // Zoom modification
    let scale = (focalLength * zoomVal) / (focalLength + z2);
    
    // Convert to screen space centered around canvas center
    const cx = width / 2;
    const cy = height / 2;

    return {
      x: cx + x1 * scale,
      y: cy - y2 * scale, // invert Y for screen coordinates
      z: z2, // Keep depth for z-buffering/scaling
      visible: z2 > -focalLength // behind camera clip
    };
  };

  // Main animation render loop drawing all canvases
  useEffect(() => {
    const mainCanvas = mainCanvasRef.current;
    const cam1Canvas = cam1CanvasRef.current;
    const cam2Canvas = cam2CanvasRef.current;
    const cam3Canvas = cam3CanvasRef.current;

    if (!mainCanvas || !cam1Canvas || !cam2Canvas || !cam3Canvas) return;

    const mainCtx = mainCanvas.getContext('2d');
    const cam1Ctx = cam1Canvas.getContext('2d');
    const cam2Ctx = cam2Canvas.getContext('2d');
    const cam3Ctx = cam3Canvas.getContext('2d');

    if (!mainCtx || !cam1Ctx || !cam2Ctx || !cam3Ctx) return;

    let animFrameId: number;

    const render = () => {
      // Clear canvases
      const cleanCanvas = (canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D, bg = '#070913') => {
        ctx.fillStyle = bg;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Grid-line background for technical styling
        ctx.strokeStyle = 'rgba(99, 102, 241, 0.03)';
        ctx.lineWidth = 1;
        const spacing = 20;
        for (let x = 0; x < canvas.width; x += spacing) {
          ctx.beginPath();
          ctx.moveTo(x, 0);
          ctx.lineTo(x, canvas.height);
          ctx.stroke();
        }
        for (let y = 0; y < canvas.height; y += spacing) {
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.lineTo(canvas.width, y);
          ctx.stroke();
        }
      };

      cleanCanvas(mainCanvas, mainCtx, '#030712');
      cleanCanvas(cam1Canvas, cam1Ctx, '#050714');
      cleanCanvas(cam2Canvas, cam2Ctx, '#050714');
      cleanCanvas(cam3Canvas, cam3Ctx, '#050714');

      const time = playbackTime;

      // Calculate character state and key elements in 3D Space
      // Base location is center (0, 0, 0)
      // Character coordinates as a function of time
      let charPos: Point3D = { x: 0, y: 0, z: 0 };
      let armSwing = Math.sin(time * 8);
      let legSwing = Math.cos(time * 8);
      let bodyBent = 0; // Bending factor
      let coinPos: Point3D = { x: 40, y: -25, z: -10 }; // Coin resting on floor
      let coinScale = 1;
      let coinOpacity = 1;
      let isSilhouetted = false;

      // Stage dimensions
      const stageWidth = mainCanvas.width;
      const stageHeight = mainCanvas.height;

      // Define standard camera objects for visualization in the Main Viewport
      // Cam 1 (Orbital): rotates around the grid
      const orbitalRadius = 130;
      const orbitalSpeed = 0.5 * Math.PI; // Full orbit in time
      const cam1Yaw = time * 0.8 + 0.3; // Live rotation
      const cam1Pos: Point3D = {
        x: orbitalRadius * Math.sin(cam1Yaw),
        y: 10 + Math.sin(time * 2) * 15,
        z: orbitalRadius * Math.cos(cam1Yaw)
      };

      // Cam 2 (Superior/Modo Dios): Directly looking down
      const cam2Pos: Point3D = { x: 0, y: 150, z: 1 };

      // Cam 3 (Inferior/God Inverted): Ground level looking up
      const cam3Pos: Point3D = { x: 0, y: -140, z: 10 };

      // Evaluate the timeline phases to animate elements and camera offsets
      if (time < 3.0) {
        // Phase 1: Walk
        // Character walks from -60 to 0
        const progress = time / 3.0;
        charPos.x = -65 + progress * 65;
        charPos.y = -10 + Math.abs(Math.sin(time * 8)) * 3; // bobbing
        charPos.z = -15 + Math.sin(time * 4) * 5;
      } else if (time < 4.5) {
        // Phase 2: Reach/Stop
        charPos.x = 0;
        charPos.y = -10;
        charPos.z = -15;
        const phaseProgress = (time - 3.0) / 1.5;
        bodyBent = phaseProgress * 1.1; // Bends over
        armSwing = phaseProgress * 0.5;
        legSwing = 0;
      } else if (time < 6.0) {
        // Phase 3: Zoom Detail Coin
        charPos.x = 0;
        charPos.y = -10;
        charPos.z = -15;
        bodyBent = 1.1; // stayed bent
        
        // Spin and scale coin in high focus zoom!
        const phaseProgress = (time - 4.5) / 1.5;
        coinScale = 1.0 + Math.sin(phaseProgress * Math.PI) * 1.5; // zoom pulsing
        coinPos.y = -10 + phaseProgress * 20; // Float coin up during close-up inspect
        coinPos.x = 20 - phaseProgress * 20; // float closer to camera center
      } else if (time < 7.5) {
        // Phase 4: Stand up & Silhouette glow
        const phaseProgress = (time - 6.0) / 1.5;
        charPos.x = 0;
        charPos.y = -10;
        charPos.z = -15;
        bodyBent = 1.1 * (1 - phaseProgress); // straightening up
        
        // Coin enters pocket
        coinOpacity = 1 - phaseProgress;
        coinPos.y = 5 - phaseProgress * 15;
        coinPos.x = -5;

        // Reveal glowing silhouette
        isSilhouetted = phaseProgress > 0.2;
      } else {
        // Phase 5: Zoom out
        charPos.x = 0;
        charPos.y = -10;
        charPos.z = -15;
        bodyBent = 0;
        coinOpacity = 0;
        isSilhouetted = true;
      }

      // Draw all elements into MAIN VIEWPORT
      const drawSceneInCtx = (
        ctx: CanvasRenderingContext2D, 
        w: number, 
        h: number, 
        camYaw: number, 
        camPitch: number, 
        camZoom: number,
        camOffset: Point3D = { x: 0, y: 0, z: 0 },
        isMiniMonitor = false
      ) => {
        // 1. Draw 3D floor grid
        ctx.strokeStyle = 'rgba(99, 102, 241, 0.1)';
        ctx.lineWidth = 1;
        const gridHalfSize = 120;
        const gridStep = 20;

        for (let x = -gridHalfSize; x <= gridHalfSize; x += gridStep) {
          ctx.beginPath();
          const startPt = projectPoint({ x, y: -25, z: -gridHalfSize }, camYaw, camPitch, camZoom, w, h, 300, camOffset);
          const endPt = projectPoint({ x, y: -25, z: gridHalfSize }, camYaw, camPitch, camZoom, w, h, 300, camOffset);
          if (startPt.visible && endPt.visible) {
            ctx.moveTo(startPt.x, startPt.y);
            ctx.lineTo(endPt.x, endPt.y);
            ctx.stroke();
          }
        }
        for (let z = -gridHalfSize; z <= gridHalfSize; z += gridStep) {
          ctx.beginPath();
          const startPt = projectPoint({ x: -gridHalfSize, y: -25, z }, camYaw, camPitch, camZoom, w, h, 300, camOffset);
          const endPt = projectPoint({ x: gridHalfSize, y: -25, z }, camYaw, camPitch, camZoom, w, h, 300, camOffset);
          if (startPt.visible && endPt.visible) {
            ctx.moveTo(startPt.x, startPt.y);
            ctx.lineTo(endPt.x, endPt.y);
            ctx.stroke();
          }
        }

        // Draw Stage Cubes
        cubes.forEach(cube => {
          let center = { ...cube.center };
          if (cube.isRotating) {
            // Apply slight orbital motion
            const angle = time * cube.rotationSpeed * 5;
            center.x += Math.sin(angle) * 10;
            center.z += Math.cos(angle) * 10;
          }

          const half = cube.size / 2;
          const vertices: Point3D[] = [
            { x: center.x - half, y: center.y - half, z: center.z - half },
            { x: center.x + half, y: center.y - half, z: center.z - half },
            { x: center.x + half, y: center.y + half, z: center.z - half },
            { x: center.x - half, y: center.y + half, z: center.z - half },
            { x: center.x - half, y: center.y - half, z: center.z + half },
            { x: center.x + half, y: center.y - half, z: center.z + half },
            { x: center.x + half, y: center.y + half, z: center.z + half },
            { x: center.x - half, y: center.y + half, z: center.z + half },
          ];

          const projected = vertices.map(v => projectPoint(v, camYaw, camPitch, camZoom, w, h, 300, camOffset));
          
          // Draw cube faces / edges
          const edges = [
            [0, 1], [1, 2], [2, 3], [3, 0], // front
            [4, 5], [5, 6], [6, 7], [7, 4], // back
            [0, 4], [1, 5], [2, 6], [3, 7]  // connectors
          ];

          ctx.strokeStyle = cube.color;
          ctx.lineWidth = 1;
          edges.forEach(([a, b]) => {
            if (projected[a].visible && projected[b].visible) {
              ctx.beginPath();
              ctx.moveTo(projected[a].x, projected[a].y);
              ctx.lineTo(projected[b].x, projected[b].y);
              ctx.stroke();
            }
          });

          // Draw active volumetric center pulse
          const pCenter = projectPoint(center, camYaw, camPitch, camZoom, w, h, 300, camOffset);
          if (pCenter.visible) {
            ctx.fillStyle = cube.color;
            ctx.beginPath();
            ctx.arc(pCenter.x, pCenter.y, 4 * camZoom, 0, Math.PI * 2);
            ctx.fill();
          }
        });

        // 2. Draw 3D Cameras in Main Viewport to show recording mechanism (Do not render if drawing monitor itself)
        if (!isMiniMonitor && showWireframes) {
          // Camera 1: Orbital representation
          const pCam1 = projectPoint(cam1Pos, camYaw, camPitch, camZoom, w, h, 300, camOffset);
          if (pCam1.visible) {
            ctx.fillStyle = '#ec4899'; // Magenta
            ctx.beginPath();
            ctx.arc(pCam1.x, pCam1.y, 7, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 1.5;
            ctx.stroke();

            // Draw Camera label
            ctx.fillStyle = '#ec4899';
            ctx.font = '8px monospace';
            ctx.fillText('CAM_1_ORBITAL', pCam1.x + 10, pCam1.y - 4);

            // Draw line-of-sight to Character
            const pChar = projectPoint(charPos, camYaw, camPitch, camZoom, w, h, 300, camOffset);
            if (pChar.visible) {
              ctx.strokeStyle = 'rgba(236, 72, 153, 0.4)';
              ctx.setLineDash([4, 4]);
              ctx.beginPath();
              ctx.moveTo(pCam1.x, pCam1.y);
              ctx.lineTo(pChar.x, pChar.y);
              ctx.stroke();
              ctx.setLineDash([]);
            }
          }

          // Camera 2: Superior (God Mode)
          const pCam2 = projectPoint(cam2Pos, camYaw, camPitch, camZoom, w, h, 300, camOffset);
          if (pCam2.visible) {
            ctx.fillStyle = '#10b981'; // Green
            ctx.beginPath();
            ctx.arc(pCam2.x, pCam2.y, 7, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = '#ffffff';
            ctx.stroke();

            ctx.fillStyle = '#10b981';
            ctx.font = '8px monospace';
            ctx.fillText('CAM_2_DIOS', pCam2.x + 10, pCam2.y - 4);
          }

          // Camera 3: Inferior (God Inverted)
          const pCam3 = projectPoint(cam3Pos, camYaw, camPitch, camZoom, w, h, 300, camOffset);
          if (pCam3.visible) {
            ctx.fillStyle = '#3b82f6'; // Blue
            ctx.beginPath();
            ctx.arc(pCam3.x, pCam3.y, 7, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = '#ffffff';
            ctx.stroke();

            ctx.fillStyle = '#3b82f6';
            ctx.font = '8px monospace';
            ctx.fillText('CAM_3_INF', pCam3.x + 10, pCam3.y - 4);
          }
        }

        // 3. Draw Character (glowing cybernetic agent wireframe)
        const neckHeight = 22;
        const headRadius = 7;
        const hipPos: Point3D = { x: charPos.x, y: charPos.y - 5, z: charPos.z };
        const chestPos: Point3D = { x: charPos.x, y: charPos.y + 12 - bodyBent * 4, z: charPos.z + bodyBent * 8 };
        const headPos: Point3D = { x: chestPos.x, y: chestPos.y + 10 - bodyBent * 2, z: chestPos.z + bodyBent * 4 };

        const pHip = projectPoint(hipPos, camYaw, camPitch, camZoom, w, h, 300, camOffset);
        const pChest = projectPoint(chestPos, camYaw, camPitch, camZoom, w, h, 300, camOffset);
        const pHead = projectPoint(headPos, camYaw, camPitch, camZoom, w, h, 300, camOffset);

        if (pHip.visible && pChest.visible && pHead.visible) {
          if (isSilhouetted) {
            // Cinematic Silhouette Glow Mode (Fase 4 & 5)
            ctx.shadowBlur = glowIntensity * 1.5;
            ctx.shadowColor = 'rgba(99, 102, 241, 0.8)';
            ctx.fillStyle = 'rgba(99, 102, 241, 0.95)';
            ctx.strokeStyle = '#818cf8';
            ctx.lineWidth = 3;

            // Draw filled avatar shape representing dynamic backlighting silhouette
            ctx.beginPath();
            ctx.arc(pHead.x, pHead.y, headRadius * camZoom * 1.5, 0, Math.PI * 2);
            ctx.fill();

            ctx.beginPath();
            ctx.moveTo(pHead.x, pHead.y);
            ctx.lineTo(pChest.x, pChest.y);
            ctx.lineTo(pHip.x, pHip.y);
            ctx.stroke();

            // Arms & Legs Silhouette representation
            const lHand: Point3D = { x: chestPos.x - 12, y: chestPos.y - 8 + armSwing * 5, z: chestPos.z - 5 };
            const rHand: Point3D = { x: chestPos.x + 12 - bodyBent * 8, y: chestPos.y - 12 - bodyBent * 10 + armSwing * 2, z: chestPos.z + bodyBent * 12 };
            const pLHand = projectPoint(lHand, camYaw, camPitch, camZoom, w, h, 300, camOffset);
            const pRHand = projectPoint(rHand, camYaw, camPitch, camZoom, w, h, 300, camOffset);

            if (pLHand.visible && pRHand.visible) {
              ctx.beginPath();
              ctx.moveTo(pChest.x, pChest.y);
              ctx.lineTo(pLHand.x, pLHand.y);
              ctx.moveTo(pChest.x, pChest.y);
              ctx.lineTo(pRHand.x, pRHand.y);
              ctx.stroke();
            }

            // Restore shadow
            ctx.shadowBlur = 0;
          } else {
            // Cyberpunk Holographic Blueprint Joint lines
            ctx.strokeStyle = '#6366f1'; // Neon Indigo
            ctx.lineWidth = 2.5;

            // Spine
            ctx.beginPath();
            ctx.moveTo(pHip.x, pHip.y);
            ctx.lineTo(pChest.x, pChest.y);
            ctx.stroke();

            // Head
            ctx.beginPath();
            ctx.arc(pHead.x, pHead.y, headRadius * camZoom, 0, Math.PI * 2);
            ctx.fillStyle = '#1e1b4b';
            ctx.fill();
            ctx.stroke();

            // Left Arm
            const lElbow: Point3D = { x: chestPos.x - 10, y: chestPos.y - 6 + armSwing * 3, z: chestPos.z };
            const lHand: Point3D = { x: chestPos.x - 15, y: chestPos.y - 14 + armSwing * 6, z: chestPos.z };
            const pLElbow = projectPoint(lElbow, camYaw, camPitch, camZoom, w, h, 300, camOffset);
            const pLHand = projectPoint(lHand, camYaw, camPitch, camZoom, w, h, 300, camOffset);

            if (pLElbow.visible && pLHand.visible) {
              ctx.beginPath();
              ctx.moveTo(pChest.x, pChest.y);
              ctx.lineTo(pLElbow.x, pLElbow.y);
              ctx.lineTo(pLHand.x, pLHand.y);
              ctx.stroke();
            }

            // Right Arm (Reaching)
            // Reaches down towards coin during Phase 2 & 3
            const reachProgress = bodyBent / 1.1;
            const rElbow: Point3D = { 
              x: chestPos.x + 8 - reachProgress * 4, 
              y: chestPos.y - 4 - reachProgress * 10, 
              z: chestPos.z + reachProgress * 5
            };
            const rHand: Point3D = { 
              x: chestPos.x + 12 - reachProgress * 15, 
              y: chestPos.y - 12 - reachProgress * 18, 
              z: chestPos.z + reachProgress * 15
            };
            const pRElbow = projectPoint(rElbow, camYaw, camPitch, camZoom, w, h, 300, camOffset);
            const pRHand = projectPoint(rHand, camYaw, camPitch, camZoom, w, h, 300, camOffset);

            if (pRElbow.visible && pRHand.visible) {
              ctx.beginPath();
              ctx.moveTo(pChest.x, pChest.y);
              ctx.lineTo(pRElbow.x, pRElbow.y);
              ctx.lineTo(pRHand.x, pRHand.y);
              ctx.stroke();

              // Highlight hand node
              ctx.fillStyle = '#a855f7';
              ctx.beginPath();
              ctx.arc(pRHand.x, pRHand.y, 4, 0, Math.PI * 2);
              ctx.fill();
            }

            // Left Leg
            const lKnee: Point3D = { x: hipPos.x - 6, y: hipPos.y - 10 + legSwing * 4, z: hipPos.z };
            const lFoot: Point3D = { x: hipPos.x - 8, y: hipPos.y - 20 + legSwing * 6, z: hipPos.z };
            const pLKnee = projectPoint(lKnee, camYaw, camPitch, camZoom, w, h, 300, camOffset);
            const pLFoot = projectPoint(lFoot, camYaw, camPitch, camZoom, w, h, 300, camOffset);

            if (pLKnee.visible && pLFoot.visible) {
              ctx.beginPath();
              ctx.moveTo(pHip.x, pHip.y);
              ctx.lineTo(pLKnee.x, pLKnee.y);
              ctx.lineTo(pLFoot.x, pLFoot.y);
              ctx.stroke();
            }

            // Right Leg
            const rKnee: Point3D = { x: hipPos.x + 6, y: hipPos.y - 10 - legSwing * 4, z: hipPos.z };
            const rFoot: Point3D = { x: hipPos.x + 8, y: hipPos.y - 20 - legSwing * 6, z: hipPos.z };
            const pRKnee = projectPoint(rKnee, camYaw, camPitch, camZoom, w, h, 300, camOffset);
            const pRFoot = projectPoint(rFoot, camYaw, camPitch, camZoom, w, h, 300, camOffset);

            if (pRKnee.visible && pRFoot.visible) {
              ctx.beginPath();
              ctx.moveTo(pHip.x, pHip.y);
              ctx.lineTo(pRKnee.x, pRKnee.y);
              ctx.lineTo(pRFoot.x, pRFoot.y);
              ctx.stroke();
            }

            // Glowing joint markers
            const jointPoints = [pHead, pChest, pHip];
            ctx.fillStyle = '#a855f7'; // Neon Purple joints
            jointPoints.forEach(j => {
              ctx.beginPath();
              ctx.arc(j.x, j.y, 3.5, 0, Math.PI * 2);
              ctx.fill();
            });
          }
        }

        // 4. Draw the Golden Coin
        if (coinOpacity > 0) {
          const pCoin = projectPoint(coinPos, camYaw, camPitch, camZoom, w, h, 300, camOffset);
          if (pCoin.visible) {
            // Draw coin aura/glow
            const radialGlow = ctx.createRadialGradient(
              pCoin.x, pCoin.y, 0,
              pCoin.x, pCoin.y, 18 * coinScale * camZoom
            );
            radialGlow.addColorStop(0, 'rgba(251, 191, 36, 0.4)');
            radialGlow.addColorStop(1, 'rgba(251, 191, 36, 0)');
            ctx.fillStyle = radialGlow;
            ctx.beginPath();
            ctx.arc(pCoin.x, pCoin.y, 18 * coinScale * camZoom, 0, Math.PI * 2);
            ctx.fill();

            // Draw coin core body
            ctx.fillStyle = '#fbbf24'; // Amber Gold
            ctx.strokeStyle = '#f59e0b';
            ctx.lineWidth = 2;
            
            ctx.beginPath();
            // Ellipse simulates perspective orientation
            ctx.ellipse(
              pCoin.x, pCoin.y, 
              8 * coinScale * camZoom, 
              4 * coinScale * camZoom * Math.abs(Math.sin(time * 5)), 
              0, 0, Math.PI * 2
            );
            ctx.fill();
            ctx.stroke();

            // Render value indicators during zoom phase
            if (activePhase === 2 && !isMiniMonitor) {
              ctx.fillStyle = '#fbbf24';
              ctx.font = 'bold 9px monospace';
              ctx.fillText('COIN_VALUE: $999', pCoin.x + 15, pCoin.y - 5);
              ctx.strokeStyle = 'rgba(251, 191, 36, 0.4)';
              ctx.beginPath();
              ctx.moveTo(pCoin.x, pCoin.y);
              ctx.lineTo(pCoin.x + 12, pCoin.y - 8);
              ctx.lineTo(pCoin.x + 35, pCoin.y - 8);
              ctx.stroke();
            }
          }
        }

        // Draw recording indicator in Mini Monitors / active views
        if (isMiniMonitor) {
          ctx.fillStyle = 'rgba(239, 68, 68, 0.85)';
          ctx.beginPath();
          ctx.arc(15, 15, 3, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#ffffff';
          ctx.font = '7px monospace';
          ctx.fillText('REC', 22, 18);
        }
      };

      // Execution of the rendering on each canvas depending on chosen configuration
      // 1. Render Main Viewport
      let mainYaw = yaw;
      let mainPitch = pitch;
      let mainZoom = zoom;
      let mainOffset: Point3D = { x: 0, y: 0, z: 0 };

      // If main view mode is locked on a specific Camera Feed:
      if (activeCamView === 'cam1') {
        // Look through orbital camera
        mainYaw = cam1Yaw;
        mainPitch = -0.15;
        mainZoom = selectedShot === 'close-up' ? 2.5 : selectedShot === 'close-ure' ? 1.8 : 1.2;
        mainOffset = { ...charPos }; // follow character
      } else if (activeCamView === 'cam2') {
        // Top view/God mode
        mainYaw = 0;
        mainPitch = -Math.PI / 2; // directly straight down
        mainZoom = 1.0;
        mainOffset = { x: 0, y: 0, z: 0 };
      } else if (activeCamView === 'cam3') {
        // Ground up
        mainYaw = 0.5;
        mainPitch = Math.PI / 3;
        mainZoom = 1.4;
        mainOffset = { ...charPos };
      }

      // Draw Main Canvas
      drawSceneInCtx(mainCtx, mainCanvas.width, mainCanvas.height, mainYaw, mainPitch, mainZoom, mainOffset, false);

      // Draw Mini Monitors (Live Feeds)
      // Monitor 1: Orbital Live feed
      drawSceneInCtx(cam1Ctx, cam1Canvas.width, cam1Canvas.height, cam1Yaw, -0.1, 1.2, { ...charPos }, true);

      // Monitor 2: Top / God view feed
      drawSceneInCtx(cam2Ctx, cam2Canvas.width, cam2Canvas.height, 0, -Math.PI / 2, 0.9, { x: 0, y: 0, z: 0 }, true);

      // Monitor 3: Bottom / Inverted feed
      drawSceneInCtx(cam3Ctx, cam3Canvas.width, cam3Canvas.height, 0.4, Math.PI / 3, 1.1, { ...charPos }, true);

      animFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animFrameId);
    };
  }, [pitch, yaw, zoom, playbackTime, cubes, showWireframes, glowIntensity, activeCamView, selectedShot]);

  // AI Prompt orchestration
  const handleStudioAiGeneration = async () => {
    if (!studioPrompt.trim()) return;
    setIsAiProcessing(true);
    setStudioLogs(prev => [
      `[AI_ORCHESTRATOR]: Procesando requerimiento tridimensional: "${studioPrompt}"`,
      ...prev
    ]);

    try {
      // Simulate/Execute beautiful local generative actions and coordinate updates
      // to keep response snappy and robust under high server demands
      await new Promise(resolve => setTimeout(resolve, 1500));

      const cleanedPrompt = studioPrompt.toLowerCase();
      if (cleanedPrompt.includes('color') || cleanedPrompt.includes('luz') || cleanedPrompt.includes('luces')) {
        // Modificar color de los cubos y aura
        const newColor = cleanedPrompt.includes('rojo') ? 'rgba(239, 68, 68, 0.4)' :
                         cleanedPrompt.includes('amarillo') ? 'rgba(245, 158, 11, 0.4)' :
                         cleanedPrompt.includes('verde') ? 'rgba(16, 185, 129, 0.4)' :
                         'rgba(168, 85, 247, 0.4)'; // Purpura por defecto
        
        setCubes(prev => prev.map((c, i) => i === 1 ? { ...c, color: newColor } : c));
        setGlowIntensity(15);
        setStudioLogs(prev => [
          `[ENGINE_VEO]: Sincronización cromática exitosa. Actor Holográfico reconfigurado a color de emisión espectral.`,
          `[CAMARA_CORE]: Reajustado filtro de intensidad lumínica a: 15.`,
          ...prev
        ]);
      } else if (cleanedPrompt.includes('rapido') || cleanedPrompt.includes('velocidad') || cleanedPrompt.includes('giro')) {
        setCubes(prev => prev.map(c => c.id === 'cube-2' ? { ...c, rotationSpeed: 0.05 } : c));
        setStudioLogs(prev => [
          `[ENGINE_VEO]: Velocidad cinética incrementada para Actor Holográfico a 0.05 rad/s.`,
          `[LENTICULAR]: Modulado tiempo de obturación a 1/250s.`,
          ...prev
        ]);
      } else if (cleanedPrompt.includes('cubo') || cleanedPrompt.includes('stage') || cleanedPrompt.includes('objeto')) {
        // Añadir nuevo cubo en coordenadas aleatorias
        const newCube: StageCube = {
          id: `cube-${Date.now()}`,
          name: `Objeto_${cubes.length + 1}`,
          center: { x: Math.random() * 80 - 40, y: Math.random() * 40 - 10, z: Math.random() * 80 - 40 },
          size: Math.random() * 15 + 10,
          color: 'rgba(244, 63, 94, 0.4)',
          isRotating: true,
          rotationSpeed: 0.015,
          opacity: 0.4
        };
        setCubes(prev => [...prev, newCube]);
        setStudioLogs(prev => [
          `[ENGINE_VEO]: Añadido nuevo nodo físico tridimensional: "${newCube.name}" en coordenadas (${newCube.center.x.toFixed(0)}, ${newCube.center.y.toFixed(0)}, ${newCube.center.z.toFixed(0)}).`,
          ...prev
        ]);
      } else {
        // Ajustar parámetros por defecto de atmósfera
        setFogLevel(25);
        setStudioLogs(prev => [
          `[ENGINE_VEO]: Sintonizado canal espacial tridimensional de acuerdo a directrices artísticas.`,
          `[ATOMOSFERA]: Densidad de niebla incrementada para mayor profundidad volumétrica.`,
          ...prev
        ]);
      }

      setStudioPrompt('');
    } catch (e: any) {
      setStudioLogs(prev => [`[ERROR]: Falla de procesamiento IA: ${e.message}`, ...prev]);
    } finally {
      setIsAiProcessing(false);
    }
  };

  const handleResetScene = () => {
    setCubes([
      { id: 'cube-1', name: 'Escenario Base', center: { x: 0, y: -20, z: 0 }, size: 80, color: 'rgba(99, 102, 241, 0.15)', isRotating: false, rotationSpeed: 0, opacity: 0.1 },
      { id: 'cube-2', name: 'Actor Holográfico', center: { x: -30, y: 15, z: 20 }, size: 25, color: 'rgba(236, 72, 153, 0.3)', isRotating: true, rotationSpeed: 0.02, opacity: 0.4 },
      { id: 'cube-3', name: 'Hito Lumínico', center: { x: 30, y: 30, z: -30 }, size: 15, color: 'rgba(34, 197, 94, 0.4)', isRotating: true, rotationSpeed: -0.01, opacity: 0.5 }
    ]);
    setGlowIntensity(8);
    setFogLevel(15);
    setPlaybackTime(0);
    setStudioLogs(prev => [`[STUDIO]: Escena y parámetros restablecidos a la plantilla nominal.`, ...prev]);
  };

  return (
    <div id="studio-motion-root" className="w-full flex flex-col gap-6 p-6 bg-slate-950 text-slate-100 rounded-3xl border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.6)]">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-white/5 pb-6">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-gradient-to-tr from-indigo-500 to-purple-600 rounded-2xl shadow-[0_0_15px_rgba(99,102,241,0.4)]">
            <Box size={24} className="text-white animate-spin-slow" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold tracking-tight font-sans">Studio AI Motion</h2>
              <span className="text-[8px] bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 px-2 py-0.5 rounded-full font-mono font-bold animate-pulse">3D MOTOR V5.0</span>
            </div>
            <p className="text-xs text-slate-400">Plataforma tridimensional de anidación de actores, encuadres circulares y cinematografía publicitaria secuencial.</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button 
            onClick={handleResetScene}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs font-bold transition-all text-slate-300 hover:text-white"
          >
            <RefreshCw size={12} />
            Restablecer Plantilla
          </button>
        </div>
      </div>

      {/* Main Grid: Left is Viewport & Monitors, Right is Director Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column (Canvas & Monitors) - Span 8 */}
        <div className="lg:col-span-8 flex flex-col gap-4">
          
          {/* Main Viewport Header */}
          <div className="bg-slate-900 border border-white/5 rounded-2xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
              </span>
              <p className="text-xs font-bold tracking-wider font-mono text-slate-300">
                VIEWPORT PRINCIPAL: {activeCamView === 'viewport' ? 'PERSPECTIVA LIBRE' : activeCamView.toUpperCase()}
              </p>
            </div>
            <div className="flex items-center gap-1.5">
              {[
                { id: 'viewport' as const, label: 'Persp. 3D' },
                { id: 'cam1' as const, label: 'Cámara Media' },
                { id: 'cam2' as const, label: 'Cámara Dios' },
                { id: 'cam3' as const, label: 'Cámara Inf' }
              ].map(cam => (
                <button
                  key={cam.id}
                  onClick={() => setActiveCamView(cam.id)}
                  className={`px-3 py-1 rounded-lg text-[10px] font-bold transition-all ${
                    activeCamView === cam.id 
                      ? 'bg-indigo-600 text-white shadow-md' 
                      : 'bg-white/5 text-slate-400 hover:bg-white/10 hover:text-slate-200'
                  }`}
                >
                  {cam.label}
                </button>
              ))}
            </div>
          </div>

          {/* Interactive 3D Canvas Box */}
          <div className="relative aspect-video w-full bg-slate-950 border border-white/10 rounded-3xl overflow-hidden shadow-inner group">
            
            {/* The 3D Render Canvas */}
            <canvas 
              ref={mainCanvasRef}
              width={720}
              height={405}
              className="w-full h-full object-cover"
            />

            {/* Direct manual rotate overlays for Persp. 3D Mode */}
            {activeCamView === 'viewport' && (
              <div className="absolute inset-x-0 bottom-4 flex justify-center gap-4 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                <div className="flex items-center gap-1.5 bg-black/80 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10 text-[9px] text-slate-400 pointer-events-auto shadow-xl">
                  <Compass size={11} className="text-indigo-400" />
                  <span>Rotación Libre: Arrastre los deslizadores laterales para orbitar</span>
                </div>
              </div>
            )}

            {/* Overlay recording telemetry */}
            <div className="absolute top-4 left-4 p-3 bg-black/60 backdrop-blur-md border border-white/10 rounded-xl flex flex-col gap-1 text-[9px] font-mono tracking-tight pointer-events-none">
              <div className="flex items-center gap-1.5 text-red-400 font-bold">
                <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                <span>STUDIO_REC // {activeCamView.toUpperCase()}</span>
              </div>
              <span className="text-slate-400">FPS: 60 / ESTABILIZACIÓN ACTIVA</span>
              <span className="text-indigo-400 font-bold uppercase mt-1">ENGINE: {engineMode}</span>
            </div>

            {/* Dynamic visual overlay filter representing chosen engine */}
            {engineMode === 'veo-cinematic' && (
              <div className="absolute inset-0 pointer-events-none border border-indigo-500/20 mix-blend-color-dodge opacity-60 bg-gradient-to-t from-indigo-950/20 to-transparent" />
            )}
            {engineMode === 'genie-world' && (
              <div className="absolute inset-0 pointer-events-none border border-emerald-500/15 mix-blend-screen opacity-50 bg-gradient-to-br from-emerald-950/10 to-transparent" />
            )}
          </div>

          {/* Slices / Monitors Matrix - Las 3 cámaras graban en 3 capas */}
          <div className="grid grid-cols-3 gap-4">
            
            {/* Monitor 1: Cámara Orbital Media (360) */}
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between px-1">
                <span className="text-[10px] font-bold font-mono text-pink-400 uppercase">Capa Media: Orbital 360</span>
                <span className="text-[8px] font-mono text-slate-500">CANAL_01</span>
              </div>
              <div className="relative aspect-video bg-slate-900 border border-white/5 hover:border-pink-500/40 rounded-xl overflow-hidden transition-all cursor-pointer" onClick={() => setActiveCamView('cam1')}>
                <canvas ref={cam1CanvasRef} width={240} height={135} className="w-full h-full" />
                <div className="absolute inset-0 bg-gradient-to-t from-pink-950/20 to-transparent pointer-events-none" />
                {activeCamView === 'cam1' && <div className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-pink-500 animate-pulse" />}
              </div>
            </div>

            {/* Monitor 2: Cámara Superior / Modo Dios */}
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between px-1">
                <span className="text-[10px] font-bold font-mono text-emerald-400 uppercase">Capa Alta: Modo Dios</span>
                <span className="text-[8px] font-mono text-slate-500">CANAL_02</span>
              </div>
              <div className="relative aspect-video bg-slate-900 border border-white/5 hover:border-emerald-500/40 rounded-xl overflow-hidden transition-all cursor-pointer" onClick={() => setActiveCamView('cam2')}>
                <canvas ref={cam2CanvasRef} width={240} height={135} className="w-full h-full" />
                <div className="absolute inset-0 bg-gradient-to-t from-emerald-950/20 to-transparent pointer-events-none" />
                {activeCamView === 'cam2' && <div className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />}
              </div>
            </div>

            {/* Monitor 3: Cámara Inferior / Dios Invertido */}
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between px-1">
                <span className="text-[10px] font-bold font-mono text-blue-400 uppercase">Capa Baja: Inv Dios</span>
                <span className="text-[8px] font-mono text-slate-500">CANAL_03</span>
              </div>
              <div className="relative aspect-video bg-slate-900 border border-white/5 hover:border-blue-500/40 rounded-xl overflow-hidden transition-all cursor-pointer" onClick={() => setActiveCamView('cam3')}>
                <canvas ref={cam3CanvasRef} width={240} height={135} className="w-full h-full" />
                <div className="absolute inset-0 bg-gradient-to-t from-blue-950/20 to-transparent pointer-events-none" />
                {activeCamView === 'cam3' && <div className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-blue-500 animate-pulse" />}
              </div>
            </div>

          </div>

          {/* Interactive Timeline & Scrubber */}
          <div className="bg-slate-900/50 border border-white/5 p-4 rounded-2xl flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => setIsPlaying(!isPlaying)}
                  className={`p-2.5 rounded-xl text-white transition-all ${isPlaying ? 'bg-amber-600/20 text-amber-400 hover:bg-amber-600/30' : 'bg-indigo-600 hover:bg-indigo-500'}`}
                >
                  {isPlaying ? <Pause size={14} /> : <Play size={14} />}
                </button>
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold text-slate-300">Secuencia Publicitaria: Caminata & Moneda</span>
                  <span className="text-[8px] font-mono text-indigo-400">FOTOGRAMAS CLAVE DE GRABACIÓN AUTOMÁTICA</span>
                </div>
              </div>
              <div className="text-right">
                <span className="text-xs font-mono font-bold text-slate-200">{playbackTime.toFixed(2)}s</span>
                <span className="text-xs font-mono text-slate-600"> / {duration.toFixed(1)}s</span>
              </div>
            </div>

            {/* Custom interactive Timeline Track */}
            <div className="relative w-full h-6 bg-slate-950 rounded-lg overflow-hidden flex items-center border border-white/5">
              
              {/* Progress Bar */}
              <div 
                className="absolute left-0 top-0 h-full bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-indigo-500/25 transition-all duration-100 border-r border-indigo-400 shadow-[0_0_8px_rgba(99,102,241,0.5)]"
                style={{ width: `${(playbackTime / duration) * 100}%` }}
              />

              {/* Phases partitions indicators */}
              {(() => {
                let currentAccum = 0;
                return PHASES.map((phase, idx) => {
                  const pct = (currentAccum / duration) * 100;
                  currentAccum += phase.duration;
                  return (
                    <div 
                      key={idx} 
                      className="absolute h-full border-l border-white/10 flex flex-col justify-between"
                      style={{ left: `${pct}%` }}
                    >
                      <span className="text-[6px] font-mono font-bold text-slate-500 px-1 mt-0.5">PH_{idx + 1}</span>
                    </div>
                  );
                });
              })()}

              {/* Scrubber pin */}
              <div 
                className="absolute top-0 bottom-0 w-1 bg-amber-400 z-10 cursor-ew-resize pointer-events-none"
                style={{ left: `${(playbackTime / duration) * 100}%` }}
              >
                <div className="absolute -top-1 -left-1 w-3 h-3 bg-amber-400 rounded-full border-2 border-slate-950" />
              </div>

            </div>

            {/* Active Phase Card details */}
            <AnimatePresence mode="wait">
              <motion.div 
                key={activePhase}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                className="p-3 bg-slate-950 border border-white/5 rounded-xl flex items-start gap-3"
              >
                <div className="p-2 bg-amber-500/10 rounded-lg text-amber-500 shrink-0">
                  <Coins size={14} className="animate-pulse" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-200">{PHASES[activePhase]?.title}</h4>
                  <p className="text-[10px] text-slate-400 mt-0.5 leading-relaxed">{PHASES[activePhase]?.desc}</p>
                </div>
              </motion.div>
            </AnimatePresence>

          </div>

        </div>

        {/* Right Column (Director Controls Panel) - Span 4 */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          
          {/* Main Controls Panel */}
          <div className="bg-slate-900 border border-white/10 rounded-3xl p-5 flex flex-col gap-6">
            
            <div>
              <p className="text-[10px] uppercase tracking-widest text-indigo-400 font-bold mb-1">CÁMARA Y ENCUADRE</p>
              <h3 className="text-sm font-bold text-slate-200">Director de Fotografía AI</h3>
            </div>

            {/* Camera Shot Choice */}
            <div className="flex flex-col gap-2">
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Modos de Toma / Jitters</p>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'close-up' as const, label: 'Close Up', desc: 'Enfoque Moneda' },
                  { id: 'close-app' as const, label: 'Close App', desc: 'Encuadre Medio' },
                  { id: 'close-ure' as const, label: 'Close-ure', desc: 'Cerrar Silueta' }
                ].map(shot => (
                  <button
                    key={shot.id}
                    onClick={() => setSelectedShot(shot.id)}
                    className={`p-2.5 rounded-xl border flex flex-col items-center justify-center text-center transition-all ${
                      selectedShot === shot.id 
                        ? 'bg-indigo-600/15 border-indigo-500 text-indigo-300' 
                        : 'bg-white/5 border-white/5 text-slate-500 hover:border-white/10 hover:text-slate-300'
                    }`}
                  >
                    <span className="text-[10px] font-bold">{shot.label}</span>
                    <span className="text-[7px] opacity-60 mt-0.5">{shot.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Manual rotation sliders (Only visible in Persp 3D View mode) */}
            {activeCamView === 'viewport' && (
              <div className="p-4 bg-slate-950/60 rounded-2xl border border-white/5 flex flex-col gap-3">
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Deslizadores de Órbita de Perspectiva</p>
                
                <div className="flex flex-col gap-1.5">
                  <div className="flex justify-between text-[8px] text-slate-500 font-mono">
                    <span>ROTACIÓN LATERAL (YAW)</span>
                    <span>{(yaw * (180/Math.PI)).toFixed(0)}°</span>
                  </div>
                  <input 
                    type="range" 
                    min={-Math.PI} 
                    max={Math.PI} 
                    step={0.05}
                    value={yaw}
                    onChange={(e) => setYaw(parseFloat(e.target.value))}
                    className="w-full accent-indigo-500"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <div className="flex justify-between text-[8px] text-slate-500 font-mono">
                    <span>ÁNGULO VERTICAL (PITCH)</span>
                    <span>{(pitch * (180/Math.PI)).toFixed(0)}°</span>
                  </div>
                  <input 
                    type="range" 
                    min={-Math.PI/2 + 0.1} 
                    max={0.2} 
                    step={0.05}
                    value={pitch}
                    onChange={(e) => setPitch(parseFloat(e.target.value))}
                    className="w-full accent-indigo-500"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <div className="flex justify-between text-[8px] text-slate-500 font-mono">
                    <span>ZOOM / FOCAL</span>
                    <span>{zoom.toFixed(1)}x</span>
                  </div>
                  <input 
                    type="range" 
                    min={0.5} 
                    max={2.5} 
                    step={0.1}
                    value={zoom}
                    onChange={(e) => setZoom(parseFloat(e.target.value))}
                    className="w-full accent-indigo-500"
                  />
                </div>
              </div>
            )}

            {/* Real-time environmental params */}
            <div className="flex flex-col gap-4 pt-4 border-t border-white/5">
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Parámetros del Espacio Virtual</p>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <span className="text-[8px] text-slate-500 font-mono uppercase">Brillo de Aura ({glowIntensity})</span>
                  <input 
                    type="range" 
                    min={2} 
                    max={25} 
                    value={glowIntensity}
                    onChange={(e) => setGlowIntensity(parseInt(e.target.value))}
                    className="w-full accent-amber-500"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <span className="text-[8px] text-slate-500 font-mono uppercase">Densidad de Niebla ({fogLevel})</span>
                  <input 
                    type="range" 
                    min={0} 
                    max={50} 
                    value={fogLevel}
                    onChange={(e) => setFogLevel(parseInt(e.target.value))}
                    className="w-full accent-indigo-500"
                  />
                </div>
              </div>

              {/* Wireframe visibility toggle */}
              <div className="flex items-center justify-between p-3 bg-slate-950/60 rounded-xl border border-white/5">
                <div className="flex flex-col">
                  <span className="text-[9px] font-bold text-slate-300">Mostrar Conos de Cámara</span>
                  <span className="text-[7px] text-slate-500">Visualiza el vector de visión del lente en 3D</span>
                </div>
                <input 
                  type="checkbox" 
                  checked={showWireframes}
                  onChange={(e) => setShowWireframes(e.target.checked)}
                  className="w-4 h-4 rounded text-indigo-500 accent-indigo-500"
                />
              </div>
            </div>

            {/* Reality Engine toggle */}
            <div className="flex flex-col gap-2 pt-4 border-t border-white/5">
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Motor Físico y Sincronización</p>
              <div className="flex bg-slate-950 p-1 rounded-xl border border-white/5 gap-1">
                {[
                  { id: 'veo-cinematic' as const, label: 'VEO Cine' },
                  { id: 'genie-world' as const, label: 'Genie' },
                  { id: 'lyria-audio' as const, label: 'Lyria' }
                ].map(eng => (
                  <button
                    key={eng.id}
                    onClick={() => setEngineMode(eng.id)}
                    className={`flex-1 py-1.5 rounded-lg text-[9px] font-bold transition-all ${
                      engineMode === eng.id 
                        ? 'bg-indigo-600 text-white' 
                        : 'text-slate-500 hover:text-slate-300'
                    }`}
                  >
                    {eng.label}
                  </button>
                ))}
              </div>
            </div>

          </div>

          {/* AI Prompter specifically for 3D Camera / Cube scene configuration */}
          <div className="bg-slate-900 border border-white/10 rounded-3xl p-5 flex flex-col gap-4">
            <div>
              <p className="text-[10px] uppercase tracking-widest text-indigo-400 font-bold mb-1 font-mono">IA COADJUNTA</p>
              <h3 className="text-xs font-bold text-slate-200">Reconfigurar Espacio por Prompt</h3>
            </div>

            <div className="flex flex-col gap-2">
              <textarea
                placeholder="Escribe comandos de diseño (p. ej., 'Añadir un cubo rosado flotante', 'Aumentar la rotación del actor', 'Cambiar el color a verde')..."
                value={studioPrompt}
                onChange={(e) => setStudioPrompt(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleStudioAiGeneration()}
                rows={3}
                className="w-full bg-slate-950 border border-white/10 rounded-xl p-3 text-xs text-white placeholder:text-slate-600 outline-none focus:border-indigo-500 transition-colors"
                disabled={isAiProcessing}
              />
              <button 
                onClick={handleStudioAiGeneration}
                disabled={isAiProcessing || !studioPrompt.trim()}
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-30 rounded-xl text-xs font-bold transition-all text-white flex items-center justify-center gap-1.5"
              >
                {isAiProcessing ? (
                  <>
                    <RefreshCw size={14} className="animate-spin" />
                    Procesando Escena...
                  </>
                ) : (
                  <>
                    <Sparkles size={14} />
                    Aplicar Inteligencia Artística
                  </>
                )}
              </button>
            </div>

            {/* Local Logs viewer */}
            <div className="flex flex-col gap-1.5">
              <p className="text-[8px] font-bold text-slate-500 uppercase font-mono tracking-wider">Bitácora Espectral del Motor</p>
              <div className="bg-slate-950 rounded-xl border border-white/5 p-3 h-28 overflow-y-auto font-mono text-[8px] leading-relaxed text-slate-400 flex flex-col gap-1 custom-scrollbar">
                {studioLogs.map((log, idx) => (
                  <div key={idx} className={`${log.startsWith('[ERROR]') ? 'text-red-400' : log.startsWith('[AI') ? 'text-purple-300' : 'text-slate-400'}`}>
                    {log}
                  </div>
                ))}
              </div>
            </div>

          </div>

        </div>

      </div>

    </div>
  );
};
