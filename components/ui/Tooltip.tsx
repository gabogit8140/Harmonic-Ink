
import React from 'react';

export const Tooltip = ({ children }: { children?: React.ReactNode }) => (
  <div className="absolute bottom-[115%] left-1/2 -translate-x-1/2 px-2.5 py-1.5 bg-slate-900 text-white text-[9px] font-bold uppercase tracking-widest rounded-lg border border-white/10 opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none whitespace-nowrap z-[100] shadow-[0_4px_20px_rgba(0,0,0,0.5)] translate-y-2 group-hover:translate-y-0 backdrop-blur-md">
    {children}
    <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-900"></div>
  </div>
);
