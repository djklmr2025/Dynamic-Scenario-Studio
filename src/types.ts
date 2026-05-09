/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type AspectRatio = '4:3' | '16:9' | '16:10';

export type ModelEngine = 'gemini-1.5' | 'gemini-1.0' | 'lyria-audio' | 'gemma-open' | 'applied-ai' | 'video-gen-x' | '4d-db' | 'screenmatch' | 'flow-nexus' | 'cat-4d' | 'physics-sim';

export type ModuleType = 'text' | 'video' | 'image' | 'html' | 'link' | 'iframe' | 'audio' | 'js';

export type TriggerType = 'click' | 'hover' | 'enter' | 'exit' | 'timer';
export type ActionEffect = 'move' | 'scale' | 'opacity' | 'style' | 'content' | 'scene' | 'sound' | 'physics' | 'external-link';

export interface ModuleAction {
  id: string;
  trigger: TriggerType;
  effect: ActionEffect;
  payload: any; // Valid JSON payload for the effect
}

export interface ModuleStyle {
  borderRadius: number; // in pixels
  backgroundColor: string;
  opacity: number;
  borderWidth: number;
  borderColor: string;
  parallax?: number; // 0-1 for depth effect
  blur?: number; // for depth of field
  animation?: 'subtle-float' | 'pulse' | 'gentle-shake' | 'sway' | 'blink' | 'drift' | 'none';
  accentColor?: string; // For the 4D Essence colors
}

export interface Module {
  id: string;
  type: ModuleType;
  title: string;
  content: string; // URL for video/image/audio, text for text, HTML string for html
  x: number; // percentage (0-100)
  y: number; // percentage (0-100)
  width: number; // percentage (0-100)
  height: number; // percentage (0-100)
  isLocked: boolean;
  zIndex: number;
  style: ModuleStyle;
  actions?: ModuleAction[];
  isLooping?: boolean; // For audio/video
  volume?: number; // 0-1
}

export interface WorldConfig {
  gravity: number; // 0-1
  physics: 'linear' | 'floating' | 'liquid' | 'static';
  atmosphere: 'clear' | 'foggy' | 'electrical' | 'digital';
  interactionLevel: number; // For future "Genie" interactivity
}

export interface Scene {
  id: string;
  timestamp: number; // in seconds
  modules: Module[];
  transition: TransitionStyle;
  duration: number; // in seconds
  description?: string; // Lyric or director note
  worldConfig?: WorldConfig; // Local overrides for interactive worlds
}

export interface AudioTrack {
  url: string;
  name: string;
  bpm?: number;
  duration?: number;
}

export interface Scenario {
  id: string;
  userId?: string;
  name: string;
  aspectRatio: AspectRatio;
  modules: Module[];
  timeline: Scene[]; // Multi-scene support for videoclips
  audioTrack?: AudioTrack;
  worldConfig: WorldConfig; // Global scenario physics
  modelEngine: ModelEngine; // Selected AI model logic
  backgroundColor: string;
  backgroundImage?: string;
  createdAt: number;
  updatedAt: number;
}

export type ViewMode = 'editor' | 'preview' | 'final';

export type TransitionStyle = 'none' | 'crossfade' | 'flash-white' | 'flash-black';

declare global {
  interface Window {
    ethereum?: any;
  }
}
