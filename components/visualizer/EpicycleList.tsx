
import React, { useMemo, useState } from 'react';
import { FourierCoefficient } from '../../types';

interface EpicycleListProps {
  coefficients: FourierCoefficient[];
  t: number;
}

const HarmonicClock: React.FC<{ 
    coeff: FourierCoefficient; 
    t: number; 
    color: string;
    isPair: boolean; 
}> = ({ coeff, t, color, isPair }) => {
  const phase = coeff.freq * t + coeff.phase;
  const isPositive = coeff.freq > 0;
  const isDC = coeff.freq === 0;

  return (
    <div className="flex flex-col items-center gap-1">
      {/* Clock Face */}
      <div className="relative w-8 h-8 shrink-0 bg-[#0B1221] rounded-full border border-white/10 shadow-inner">
        {/* Vector Hand */}
        <div 
          className="absolute top-1/2 left-1/2 w-[45%] h-[1px] origin-left rounded-full z-10"
          style={{ 
            transform: `translate(0, -50%) rotate(${phase}rad)`,
            backgroundColor: color,
            boxShadow: `0 0 5px ${color}`
          }}
        ></div>
        
        {/* Pivot */}
        <div className="absolute top-1/2 left-1/2 -ml-0.5 -mt-0.5 w-0.5 h-0.5 rounded-full bg-white z-20"></div>
      </div>

      {/* Sub-label for direction */}
      {!isDC && (
          <div className="flex items-center gap-1">
             <span className={`text-[9px] font-mono font-bold ${isPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
                {isPositive ? '+' : '-'}
             </span>
             <svg 
                className={`w-2 h-2 text-slate-600 ${!isPositive ? '-scale-x-100' : ''}`} 
                viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"
             >
                <path d="M21 12a9 9 0 0 0-9-9" /><path d="M21 12l2-4" /><path d="M21 12l-4-4" />
             </svg>
          </div>
      )}
      {isDC && <span className="text-[9px] text-slate-600 font-mono">DC</span>}
    </div>
  );
};

const EpicycleList: React.FC<EpicycleListProps> = ({ coefficients, t }) => {
  const [showInfo, setShowInfo] = useState(false);

  // Grouping Logic
  const groups = useMemo(() => {
      const gMap = new Map<number, FourierCoefficient[]>();
      
      coefficients.forEach(c => {
          const mag = Math.abs(c.freq);
          if (!gMap.has(mag)) gMap.set(mag, []);
          gMap.get(mag)!.push(c);
      });

      const gArray = Array.from(gMap.entries()).map(([freq, coeffs]) => {
          // Sort pairs so positive is usually first or consistent
          coeffs.sort((a, b) => b.freq - a.freq);
          const maxAmp = Math.max(...coeffs.map(c => c.amp));
          return { freq, coeffs, maxAmp };
      });

      // Sort groups by max amplitude to show most significant harmonics first
      gArray.sort((a, b) => {
          if (a.freq === 0) return -1; // Keep DC first
          if (b.freq === 0) return 1;
          return b.maxAmp - a.maxAmp;
      });

      return gArray.slice(0, 100); // Limit to reasonable number of groups
  }, [coefficients]);

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-4 border-b border-white/5 pb-2">
         <div className="flex items-center gap-3">
             <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Harmonic Components</h3>
             <button 
                onClick={() => setShowInfo(!showInfo)}
                className={`w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-serif italic border transition-all ${showInfo ? 'bg-cyan-500 border-cyan-400 text-black' : 'bg-white/5 border-white/20 text-slate-500 hover:text-cyan-400 hover:border-cyan-400'}`}
             >
                i
             </button>
         </div>
         <div className="flex items-center gap-4">
            <span className="text-[10px] font-mono text-cyan-400 font-bold">{coefficients.length} VECTORS</span>
         </div>
      </div>
      
      {/* Mathematical Guide Section */}
      {showInfo && (
        <div className="mb-6 p-5 rounded-xl bg-slate-900/50 border border-white/10 grid grid-cols-1 md:grid-cols-3 gap-6 animate-in fade-in slide-in-from-top-2 duration-300">
            <div className="space-y-2">
                <h4 className="text-[10px] font-black text-white uppercase tracking-widest border-b border-white/10 pb-1 mb-1">
                    1. The AVG (H0)
                </h4>
                <p className="text-[10px] text-slate-400 leading-relaxed">
                    <span className="text-cyan-400 font-mono">AVG</span> stands for the Average term (Frequency 0). In math, this is the constant <span className="font-serif italic text-white">c₀</span>. It represents the <strong>Center of Gravity</strong> of your drawing. It does not rotate; it simply positions the pen in the center of the screen.
                </p>
            </div>
            
            <div className="space-y-2">
                <h4 className="text-[10px] font-black text-white uppercase tracking-widest border-b border-white/10 pb-1 mb-1">
                    2. Sorting Logic
                </h4>
                <p className="text-[10px] text-slate-400 leading-relaxed">
                    Components are sorted by <strong>Amplitude</strong> (Circle Radius), not frequency. We display the largest circles first because they contribute most to the overall shape. Smaller, high-frequency circles (details) appear later in the list.
                </p>
            </div>

            <div className="space-y-2">
                <h4 className="text-[10px] font-black text-white uppercase tracking-widest border-b border-white/10 pb-1 mb-1">
                    3. Conjugate Pairs
                </h4>
                <p className="text-[10px] text-slate-400 leading-relaxed">
                    Each harmonic <span className="font-mono text-white">H<sub className="opacity-50">k</sub></span> consists of a pair: <span className="text-emerald-400 font-mono">+k</span> (Counter-Clockwise) and <span className="text-rose-400 font-mono">-k</span> (Clockwise). These counter-rotating vectors work together to squash perfect circles into the complex ellipses needed for handwriting.
                </p>
            </div>
        </div>
      )}

      <div className="flex flex-wrap gap-2 content-start justify-center md:justify-start">
        {groups.map((group, gIdx) => {
            // Determine color based on group index
            const hue = (gIdx * 25) % 360;
            const color = `hsla(${hue}, 85%, 65%, 1)`;

            return (
                <div key={group.freq} className="flex flex-col items-center bg-white/[0.02] border border-white/5 rounded-lg p-2 min-w-[3rem]">
                    <div className="flex items-center gap-1.5 mb-2 border-b border-white/5 pb-1 w-full justify-center">
                        <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">
                            {group.freq === 0 ? 'AVG' : `H${group.freq}`}
                        </span>
                        <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: color }}></div>
                    </div>
                    
                    <div className="flex gap-3">
                        {group.coeffs.map((c, i) => (
                            <HarmonicClock 
                                key={c.freq} 
                                coeff={c} 
                                t={t} 
                                color={color} 
                                isPair={group.coeffs.length > 1}
                            />
                        ))}
                    </div>
                </div>
            );
        })}
      </div>
      
      {coefficients.length > 200 && (
          <div className="mt-5 pt-2 border-t border-white/5 text-center">
             <span className="text-[9px] font-bold uppercase tracking-widest text-slate-600">
                ...and more
             </span>
          </div>
      )}
    </div>
  );
};

export default EpicycleList;
