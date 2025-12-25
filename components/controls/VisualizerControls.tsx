
import React from 'react';

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
  mode = 'tracing'
}) => {
  return (
    <div className="w-full bg-[#0B1221] backdrop-blur-xl rounded-[2.5rem] border border-white/10 p-4 md:px-8 md:py-5 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-6 transition-all z-20">
      <div className="flex items-center gap-6 w-full md:w-auto justify-between md:justify-start">
        {/* Play/Pause Button */}
        <button
          onClick={onTogglePlay}
          className={`w-14 h-14 rounded-full flex items-center justify-center transition-all flex-shrink-0 ${
            isPaused || mode === 'validating'
            ? 'bg-emerald-500 text-[#020617] shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:scale-105 hover:bg-emerald-400' 
            : 'bg-white text-slate-950 hover:bg-slate-200'
          }`}
        >
          {isPaused || mode === 'validating' ? (
             <svg className="w-6 h-6 ml-1" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
          ) : (
             <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" /></svg>
          )}
        </button>

        <div className="hidden md:block h-12 w-px bg-white/5"></div>
      </div>

      <div className="flex flex-col md:flex-row gap-6 md:gap-12 w-full flex-1 justify-center md:px-4">
          {/* Complexity Cursor */}
          <div className="flex flex-col gap-3 w-full">
            <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-slate-500">
              <span>Complexity</span>
              <span className="text-cyan-400 font-mono">{numHarmonics} / {maxHarmonics}</span>
            </div>
            <input
              type="range"
              min="2"
              max={Math.max(2, maxHarmonics)}
              value={numHarmonics}
              onChange={(e) => onHarmonicsChange(parseInt(e.target.value))}
              className="w-full touch-none"
            />
          </div>

          {/* Velocity Cursor */}
          <div className="flex flex-col gap-3 w-full md:max-w-[200px]">
            <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-slate-500">
              <span>Velocity</span>
              <span className="text-cyan-400 font-mono">{speed.toFixed(1)}x</span>
            </div>
            <input
              type="range"
              min="0.1"
              max="3"
              step="0.1"
              value={speed}
              onChange={(e) => onSpeedChange(parseFloat(e.target.value))}
              className="w-full cursor-pointer touch-none"
            />
          </div>
      </div>

      <div className="hidden md:block h-12 w-px bg-white/5 mx-2"></div>

      {/* Toggles */}
      <div className="flex gap-3 justify-between w-full md:w-auto md:justify-start">
        <button
          onClick={onToggleReference}
          className={`p-4 rounded-2xl border transition-all ${
            showReference ? 'bg-white/10 border-white/20 text-white shadow-[0_0_15px_rgba(255,255,255,0.1)]' : 'bg-transparent border-white/5 text-slate-600 hover:text-slate-400'
          }`}
          title={mode === 'validating' ? "Toggle Original Text" : "Toggle Reference Shadow"}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
          </svg>
        </button>

        <button
          onClick={onToggleCircles}
          className={`p-4 rounded-2xl border transition-all ${
            showCircles ? 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.1)]' : 'bg-transparent border-white/5 text-slate-600 hover:text-slate-400'
          }`}
          title="Toggle Epicycles"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
        </button>
        
        <button
          onClick={onToggleColorByLetter}
          className={`p-4 rounded-2xl border transition-all ${
            colorByLetter ? 'bg-pink-500/10 border-pink-500/30 text-pink-400 shadow-[0_0_15px_rgba(236,72,153,0.1)]' : 'bg-transparent border-white/5 text-slate-600 hover:text-slate-400'
          }`}
          title="Color by Letter"
        >
           <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
           </svg>
        </button>

        <button
          onClick={onRestart}
          className="p-4 bg-slate-800 hover:bg-slate-700 text-white rounded-2xl transition-all ml-2 border border-slate-700 shadow-lg"
          title="Restart"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </button>

        {onExportClick && (
            <button
            onClick={onExportClick}
            className="p-4 bg-slate-800 hover:bg-emerald-600 text-white rounded-2xl transition-all ml-2 border border-slate-700 shadow-lg group"
            title="Export Video"
            >
            <svg className="w-5 h-5 group-hover:animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            </button>
        )}
      </div>
    </div>
  );
};

export default VisualizerControls;
