
import React from 'react';
import { Tooltip } from '../ui/Tooltip';

interface VisualizerControlsProps {
  isPaused: boolean;
  onTogglePlay: () => void;
  numHarmonics: number;
  onHarmonicsChange: (val: number) => void;
  maxHarmonics: number;
  speed: number;
  onSpeedChange: (val: number) => void;
  showCircles: boolean;
  onToggleCircles: () => void;
  showReference: boolean;
  onToggleReference: () => void;
  onRestart: () => void;
  colorByLetter: boolean;
  onToggleColorByLetter: () => void;
  onExportClick?: () => void;
  mode?: 'tracing' | 'validating' | 'preview';
  showClocks?: boolean;
  onToggleClocks?: () => void;
  fidelity?: number;
}

const VisualizerControls: React.FC<VisualizerControlsProps> = ({
  isPaused,
  onTogglePlay,
  numHarmonics,
  onHarmonicsChange,
  maxHarmonics,
  speed,
  onSpeedChange,
  showCircles,
  onToggleCircles,
  showReference,
  onToggleReference,
  onRestart,
  colorByLetter,
  onToggleColorByLetter,
  onExportClick,
  mode = 'tracing',
  showClocks,
  onToggleClocks,
  fidelity = 0
}) => {
  // Hard cap harmonic control at 500 for high selection precision
  const effectiveMax = Math.min(500, Math.max(2, maxHarmonics));

  return (
    <div className="w-full bg-[#0B1221] backdrop-blur-xl rounded-[2.5rem] border border-white/10 p-6 md:px-8 md:py-6 shadow-2xl flex flex-col xl:flex-row items-center justify-between gap-8 transition-all z-20">
      
      {/* 1. Settings Section (Complexity & Speed) */}
      <div className="flex flex-col md:flex-row gap-8 w-full xl:w-auto flex-1 justify-start items-start md:items-center">
          
          {/* Complexity Slider */}
          <div className="group relative flex flex-col gap-3 w-full xl:max-w-[400px]">
            <Tooltip>Harmonic Complexity ({numHarmonics})</Tooltip>
            <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-slate-500">
              <span className="flex items-center gap-3">
                COMPLEXITY 
                <span className="text-[9px] text-emerald-400 px-2 py-0.5 border border-emerald-400/30 rounded-md bg-emerald-400/10 font-black shadow-[0_0_10px_rgba(52,211,153,0.1)]">
                   FIDELITY: {(fidelity * 100).toFixed(1)}%
                </span>
              </span>
              <span className="text-cyan-400 font-mono font-black text-xs">{numHarmonics} / {effectiveMax}</span>
            </div>
            <input
              type="range"
              min="2"
              max={effectiveMax}
              step="1"
              value={numHarmonics}
              onChange={(e) => onHarmonicsChange(parseInt(e.target.value))}
              className="w-full touch-none h-6 cursor-pointer"
            />
          </div>

          {/* Velocity Slider */}
          <div className="group relative flex flex-col gap-3 w-full md:w-48 xl:w-56 shrink-0">
            <Tooltip>Velocity ({speed.toFixed(1)}x)</Tooltip>
            <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-slate-500">
              <span>VELOCITY</span>
              <span className="text-cyan-400 font-mono font-black text-xs">{speed.toFixed(1)}X</span>
            </div>
            <input
              type="range"
              min="0.1"
              max="3"
              step="0.1"
              value={speed}
              onChange={(e) => onSpeedChange(parseFloat(e.target.value))}
              className="w-full cursor-pointer touch-none h-6"
            />
          </div>
      </div>

      <div className="hidden xl:block h-12 w-px bg-white/5 mx-2"></div>

      {/* 2. Utility Section */}
      <div className="flex gap-3 justify-center md:justify-end w-full xl:w-auto flex-wrap">
        
        {/* Toggle Color / Menu */}
        <button
          onClick={onToggleColorByLetter}
          className={`group relative p-4 rounded-2xl border transition-all hover:scale-105 active:scale-95 ${
            colorByLetter ? 'bg-slate-800 border-white/10 text-slate-400 hover:text-white' : 'bg-transparent border-white/5 text-slate-600 hover:text-slate-400 hover:bg-white/5'
          }`}
        >
           <Tooltip>Color Coding</Tooltip>
           <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
           </svg>
        </button>

        {/* Toggle Reference */}
        <button
          onClick={onToggleReference}
          className={`group relative p-4 rounded-2xl border transition-all hover:scale-105 active:scale-95 ${
            showReference ? 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.1)]' : 'bg-transparent border-white/5 text-slate-600 hover:text-slate-400 hover:bg-white/5'
          }`}
        >
          <Tooltip>{mode === 'validating' ? "Original Text" : "Reference Path"}</Tooltip>
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
        </button>

        {/* Toggle Epicycles */}
        <button
          onClick={onToggleCircles}
          className={`group relative p-4 rounded-2xl border transition-all hover:scale-105 active:scale-95 ${
            showCircles ? 'bg-fuchsia-500/10 border-fuchsia-500/30 text-fuchsia-400 shadow-[0_0_15px_rgba(217,70,239,0.1)]' : 'bg-transparent border-white/5 text-slate-600 hover:text-slate-400 hover:bg-white/5'
          }`}
        >
          <Tooltip>Vectors</Tooltip>
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
          </svg>
        </button>
        
        {/* Toggle HUD/Clock */}
        {onToggleClocks && (
          <button
            onClick={onToggleClocks}
            className={`group relative p-4 rounded-2xl border transition-all hover:scale-105 active:scale-95 ${
              showClocks ? 'bg-amber-500/10 border-amber-500/30 text-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.1)]' : 'bg-transparent border-white/5 text-slate-600 hover:text-slate-400 hover:bg-white/5'
            }`}
          >
             <Tooltip>Stats Overlay</Tooltip>
             <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
             </svg>
          </button>
        )}

        {/* Restart */}
        <button
          onClick={onRestart}
          className="group relative p-4 bg-transparent hover:bg-white/10 text-slate-500 hover:text-white rounded-2xl transition-all border border-white/5 hover:border-white/20 shadow-none hover:scale-105 active:scale-95"
        >
          <Tooltip>Restart</Tooltip>
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </button>

        {/* Export (conditionally rendered) */}
        {onExportClick && (
            <button
            onClick={onExportClick}
            className="group relative p-4 bg-transparent hover:bg-white/10 text-slate-500 hover:text-white rounded-2xl transition-all border border-white/5 hover:border-white/20 shadow-none hover:scale-105 active:scale-95"
            >
            <Tooltip>Export Video</Tooltip>
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            </button>
        )}
      </div>

      <div className="hidden xl:block h-12 w-px bg-white/5 mx-2"></div>

      {/* 3. Play Button Section (Moved to End) */}
      <div className="flex items-center justify-center shrink-0 w-full md:w-auto my-2 md:my-0">
        <button
          onClick={onTogglePlay}
          className={`group relative w-16 h-16 rounded-full flex items-center justify-center transition-all flex-shrink-0 border-2 ${
            isPaused || mode === 'validating'
            ? 'bg-emerald-500 border-emerald-400 text-[#020617] shadow-[0_0_30px_rgba(16,185,129,0.3)] hover:scale-105 hover:bg-emerald-400' 
            : 'bg-white border-white text-slate-950 hover:bg-slate-200 shadow-[0_0_20px_rgba(255,255,255,0.2)]'
          }`}
        >
          <Tooltip>{isPaused ? "Start Synthesis" : "Pause Synthesis"}</Tooltip>
          {isPaused || mode === 'validating' ? (
             <svg className="w-7 h-7 ml-1" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
          ) : (
             <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" /></svg>
          )}
        </button>
      </div>

    </div>
  );
};

export default VisualizerControls;
