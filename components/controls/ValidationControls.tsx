
import React from 'react';

interface ValidationControlsProps {
  numHarmonics: number;
  setNumHarmonics: (val: number) => void;
  maxHarmonics: number;
  showOriginal: boolean;
  setShowOriginal: (val: boolean) => void;
}

const ValidationControls: React.FC<ValidationControlsProps> = ({
  numHarmonics,
  setNumHarmonics,
  maxHarmonics,
  showOriginal,
  setShowOriginal
}) => {
  return (
    <div className="w-full bg-[#0B1221] rounded-[2rem] border border-white/10 p-6 md:p-10 flex flex-col md:flex-row items-center justify-between gap-8 md:gap-12 shadow-2xl">
        <div className="flex flex-col gap-4 w-full md:flex-1">
            <div className="flex justify-between items-end">
                <span className="text-[10px] md:text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">Harmonic Complexity</span>
                <span className="text-cyan-400 font-mono text-lg font-bold tracking-wider">{numHarmonics}</span>
            </div>
            
            <input
                type="range"
                min="5"
                max={maxHarmonics}
                value={numHarmonics}
                onChange={(e) => setNumHarmonics(parseInt(e.target.value))}
                className="w-full cursor-pointer touch-none"
            />
            
            <div className="text-[10px] text-slate-600 font-medium tracking-wide">
                Adjust detail level
            </div>
        </div>

        <div className="w-full md:w-px h-px md:h-16 bg-white/5"></div>

        <div className="flex items-center justify-between w-full md:w-auto gap-8">
            <span className="text-[10px] md:text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 whitespace-nowrap">Original Text</span>
            <button
                onClick={() => setShowOriginal(!showOriginal)}
                className={`w-14 h-7 rounded-full relative transition-colors duration-300 focus:outline-none ${showOriginal ? 'bg-cyan-500' : 'bg-slate-800'}`}
            >
                <div className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-all duration-300 shadow-sm ${showOriginal ? 'left-[26px]' : 'left-1'}`} />
            </button>
        </div>
    </div>
  );
};

export default ValidationControls;
