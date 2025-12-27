
import React from 'react';
import { FourierCoefficient } from '../../types';

interface EpicycleListProps {
  coefficients: FourierCoefficient[];
  t: number;
}

const HarmonicCard: React.FC<{ coeff: FourierCoefficient; t: number; index: number }> = ({ coeff, t, index }) => {
  const phase = coeff.freq * t + coeff.phase;
  const x = Math.cos(phase);
  const y = Math.sin(phase);

  const hue = (index * 22) % 360;
  const color = `hsla(${hue}, 85%, 65%, 1)`;
  
  const isDC = coeff.freq === 0;
  const isPositive = coeff.freq > 0;
  const magnitude = Math.abs(coeff.freq);

  // Animation speed based on frequency magnitude
  const spinDuration = magnitude === 0 ? 0 : Math.max(0.5, 10 / magnitude);

  return (
    <div className="bg-[#111827]/80 backdrop-blur-md border border-white/10 rounded-lg p-2 flex items-center gap-3 hover:border-cyan-500/50 hover:bg-[#1f2937] transition-all group relative overflow-hidden shadow-md">
      {/* Subtle Side Accent */}
      <div 
        className="absolute left-0 top-0 bottom-0 w-0.5 opacity-40"
        style={{ backgroundColor: color }}
      ></div>

      {/* Compact High-Visibility Clock */}
      <div className="relative w-10 h-10 shrink-0 bg-black/80 rounded-full border border-white/10 overflow-hidden shadow-inner">
        {/* Rotation Indicator */}
        {!isDC && (
          <div 
            className={`absolute inset-0 flex items-center justify-center opacity-10`}
            style={{ 
              animation: `spin ${spinDuration}s linear infinite ${isPositive ? '' : 'reverse'}` 
            }}
          >
             <div className="w-full h-full border-t border-white rounded-full"></div>
          </div>
        )}

        {/* Vector Hand */}
        <div 
          className="absolute top-1/2 left-1/2 w-1/2 h-0.5 origin-left rounded-full z-10"
          style={{ 
            transform: `translate(0, -50%) rotate(${phase}rad)`,
            backgroundColor: color,
            boxShadow: `0 0 6px ${color}`
          }}
        ></div>
        
        {/* Tip */}
        <div 
          className="absolute w-2 h-2 rounded-full top-1/2 left-1/2 -ml-1 -mt-1 z-20"
          style={{ 
            transform: `translate(${x * 13}px, ${y * 13}px)`,
            backgroundColor: color,
            boxShadow: `0 0 10px ${color}`
          }}
        ></div>
        
        {/* Central Pivot */}
        <div className="absolute top-1/2 left-1/2 -ml-0.5 -mt-0.5 w-1 h-1 rounded-full bg-white/60 z-30"></div>
      </div>

      <div className="flex flex-col min-w-0 flex-1 gap-0.5">
          <div className="flex justify-between items-center">
              <span className="text-[8px] font-black uppercase tracking-tighter text-slate-400">
                  {isDC ? 'DC' : `#${magnitude}`}
              </span>
              {!isDC && (
                <span className={`text-[7px] font-black px-1 rounded-[2px] ${isPositive ? 'text-emerald-400 border border-emerald-400/20 bg-emerald-400/5' : 'text-rose-400 border border-rose-400/20 bg-rose-400/5'}`}>
                  {isPositive ? 'CW' : 'CCW'}
                </span>
              )}
          </div>
          
          <div className="flex items-center gap-1.5">
              <span className="text-xs font-black text-white tracking-tight leading-none">
                  {coeff.amp.toFixed(1)}
              </span>
              <span className="text-[7px] font-bold text-slate-500 uppercase tracking-tighter">AMP</span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-[7px] font-mono text-cyan-400/70 font-bold tracking-tight">
                {isDC ? 'STATIC' : `${magnitude}Hz`}
            </span>
            {/* Tiny Weight Indicator */}
            <div className="flex gap-0.5">
                {[1, 2].map((i) => (
                    <div 
                      key={i} 
                      className={`w-1 h-1 rounded-full ${
                        (coeff.amp / 80 > i/2) ? 'bg-cyan-500' : 'bg-white/5'
                      }`}
                    ></div>
                ))}
            </div>
          </div>
      </div>
    </div>
  );
};

const EpicycleList: React.FC<EpicycleListProps> = ({ coefficients, t }) => {
  // Show more harmonics (80) in a dense 2-column grid.
  const displayCoeffs = [...coefficients].sort((a, b) => b.amp - a.amp).slice(0, 80);

  return (
    <div className="flex flex-col h-full max-h-[675px] w-full border-l border-white/5 lg:border-l-0 bg-[#030712]/40 rounded-3xl overflow-hidden">
      <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between bg-black/50 backdrop-blur-xl">
         <div className="flex flex-col">
            <h3 className="text-[10px] font-black uppercase tracking-[0.25em] text-white">Harmonic Matrix</h3>
            <span className="text-[7px] font-mono text-slate-500 uppercase font-black">Spectral Flow Analysis</span>
         </div>
         <div className="flex flex-col items-end">
             <span className="text-sm font-black font-mono text-cyan-400 leading-none">{coefficients.length}</span>
             <span className="text-[6px] text-slate-600 font-bold uppercase tracking-widest">Nodes</span>
         </div>
      </div>
      
      <div className="flex-1 overflow-y-auto px-3 py-4 grid grid-cols-2 gap-2 no-scrollbar mask-fade-v scroll-smooth">
        <style>{`
          .mask-fade-v {
            mask-image: linear-gradient(to bottom, transparent, black 3%, black 97%, transparent);
          }
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}</style>
        {displayCoeffs.map((c, idx) => (
          <HarmonicCard 
            key={`${c.freq}-${idx}`} 
            coeff={c} 
            t={t} 
            index={idx}
          />
        ))}
        
        {coefficients.length > 80 && (
          <div className="col-span-2 text-center py-4 mt-2 border-t border-white/5 opacity-30">
            <span className="text-[7px] font-black uppercase tracking-[0.3em] text-slate-500">
                + {coefficients.length - 80} secondary components
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default EpicycleList;
