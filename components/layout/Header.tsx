
import React, { useRef } from 'react';
import DrawingPad, { DrawingPadHandle } from '../inputs/DrawingPad';
import { Stroke } from '../../utils/drawing';

interface FontOption {
  name: string;
  label: string;
}

interface HeaderProps {
  inputType: 'text' | 'drawing';
  onInputTypeChange: (type: 'text' | 'drawing') => void;
  text: string;
  onTextChange: (text: string) => void;
  selectedFont: string;
  onFontChange: (font: string) => void;
  fonts: FontOption[];
  mode: 'preview' | 'validating' | 'tracing';
  onModeChange: (mode: 'preview' | 'validating' | 'tracing') => void;
  isComputing: boolean;
  onComputeText: () => void;
  onComputeDrawing: (strokes: Stroke[]) => void;
  onConfirmValidation: () => void;
  onOpenInfo: () => void;
}

const HeaderIcon = () => (
  <svg viewBox="0 0 512 512" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#020617" stopOpacity="1" />
        <stop offset="100%" stopColor="#1e293b" stopOpacity="1" />
      </linearGradient>
      <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
        <feGaussianBlur stdDeviation="5" result="blur"/>
        <feComposite in="SourceGraphic" in2="blur" operator="over"/>
      </filter>
    </defs>
    
    {/* Background */}
    <circle cx="256" cy="256" r="256" fill="url(#grad)"/>
    
    {/* Harmonic Orbitals */}
    <circle cx="256" cy="256" r="190" fill="none" stroke="#22d3ee" strokeWidth="1.5" opacity="0.15"/>
    <circle cx="256" cy="256" r="130" fill="none" stroke="#22d3ee" strokeWidth="2" opacity="0.3"/>
    
    {/* Stylized Pen Nib */}
    <path d="M256 136 L196 300 L256 364 L316 300 Z" fill="#f8fafc" filter="url(#glow)"/>
    <path d="M256 136 L196 300 L256 364 L316 300 Z" fill="url(#grad)" opacity="0.1"/> {/* Depth shading */}
    
    {/* Ink Slit */}
    <path d="M256 364 L256 280" stroke="#020617" strokeWidth="4" strokeLinecap="round"/>
    <circle cx="256" cy="260" r="12" fill="#020617" opacity="0.3"/>
    
    {/* Harmonic Ink Flow */}
    <path d="M256 364 C 256 364, 256 460, 160 460 C 80 460, 60 380, 100 320" 
          fill="none" 
          stroke="#22d3ee" 
          strokeWidth="10" 
          strokeLinecap="round" 
          strokeLinejoin="round"
          filter="url(#glow)"
    />
  </svg>
);

const Header: React.FC<HeaderProps> = ({
  inputType,
  onInputTypeChange,
  text,
  onTextChange,
  selectedFont,
  onFontChange,
  fonts,
  mode,
  onModeChange,
  isComputing,
  onComputeText,
  onComputeDrawing,
  onConfirmValidation,
  onOpenInfo,
}) => {
  const drawingRef = useRef<DrawingPadHandle>(null);

  const handleGenerateClick = () => {
    if (inputType === 'text') {
        onComputeText();
    } else {
        if (drawingRef.current) {
            const strokes = drawingRef.current.getStrokes();
            onComputeDrawing(strokes);
        }
    }
  };

  return (
    <header className="w-full flex flex-col items-center gap-8 py-8 relative z-10">
      
      {/* Brand Section */}
      <div className="flex flex-row items-center justify-center gap-5 md:gap-6 relative w-full">
        <div className="flex flex-row items-center justify-center gap-5 md:gap-6">
            <div className="relative group shrink-0 w-16 h-16 md:w-20 md:h-20">
                <div className="absolute -inset-4 bg-cyan-500/20 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
                <div className="relative z-10 w-full h-full drop-shadow-[0_0_15px_rgba(34,211,238,0.5)]">
                    <HeaderIcon />
                </div>
            </div>
            
            <div className="flex flex-col items-start">
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-black bg-gradient-to-br from-white via-slate-200 to-slate-500 bg-clip-text text-transparent tracking-tighter uppercase font-sans leading-none">
                Harmonic Ink
                </h1>
                <p className="text-slate-500 text-[10px] md:text-xs font-bold tracking-[0.3em] md:tracking-[0.4em] uppercase mt-2 ml-1">
                Fourier Series Handwriting
                </p>
            </div>
        </div>
        
        {/* Guide Button */}
        <button 
            onClick={onOpenInfo}
            className="absolute right-0 top-1/2 -translate-y-1/2 flex items-center gap-3 px-5 py-2.5 bg-slate-900/80 hover:bg-slate-800 text-slate-400 hover:text-white transition-all rounded-full border border-white/10 hover:border-cyan-500/30 hidden md:flex group backdrop-blur-md shadow-lg hover:shadow-cyan-500/10"
        >
            <span className="text-[10px] font-black uppercase tracking-[0.2em]">Guide</span>
            <div className="w-6 h-6 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-cyan-500/20 group-hover:text-cyan-400 transition-colors">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
        </button>
      </div>

      {/* Mode Switcher */}
      {mode === 'preview' && (
          <div className="flex p-1 bg-white/5 rounded-xl border border-white/5 relative z-10">
              <button
                  onClick={() => onInputTypeChange('text')}
                  className={`px-6 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${
                      inputType === 'text' 
                      ? 'bg-white text-slate-950 shadow-lg scale-105' 
                      : 'text-slate-500 hover:text-white'
                  }`}
              >
                  Write Text
              </button>
              <button
                  onClick={() => onInputTypeChange('drawing')}
                  className={`px-6 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${
                      inputType === 'drawing' 
                      ? 'bg-white text-slate-950 shadow-lg scale-105' 
                      : 'text-slate-500 hover:text-white'
                  }`}
              >
                  Freehand Draw
              </button>
          </div>
      )}

      {/* Input Area Container */}
      <div className="w-full max-w-xl flex flex-col gap-4 relative group mt-2 transition-all duration-300">
          <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500/20 to-emerald-500/20 rounded-2xl blur opacity-20 group-hover:opacity-40 transition duration-500"></div>
          
          <div className="relative bg-[#0B1221] border border-white/10 rounded-2xl p-2 shadow-2xl">
            
            {/* Input Content based on Type */}
            {inputType === 'text' ? (
                <div className="flex items-center p-1.5">
                    <input
                        type="text"
                        value={text}
                        onChange={(e) => onTextChange(e.target.value.slice(0, 15))}
                        className="flex-1 bg-transparent border-none outline-none text-white px-6 py-3 text-xl md:text-2xl font-light placeholder-slate-700 min-w-0"
                        placeholder="Type a word..."
                        disabled={mode !== 'preview'}
                    />
                </div>
            ) : (
                <div className={`p-4 transition-opacity duration-300 ${mode !== 'preview' ? 'opacity-50 pointer-events-none grayscale' : ''}`}>
                    <DrawingPad 
                        ref={drawingRef} 
                        onInteract={() => {}} 
                        onGenerate={mode === 'preview' ? handleGenerateClick : undefined}
                        isGenerating={isComputing}
                    />
                </div>
            )}

            {/* Action Bar (Footer of Input) - Only for Text Mode or Edit Mode */}
            {inputType === 'text' && (
                <div className="flex justify-end pt-2 px-2 pb-2 border-t border-white/5 mt-2">
                    {mode === 'preview' ? (
                        <button
                            onClick={handleGenerateClick}
                            disabled={isComputing || !text.trim()}
                            className="w-full md:w-auto bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-8 py-3 rounded-xl uppercase tracking-widest text-[10px] transition-all shadow-lg shadow-emerald-900/20 disabled:opacity-50 disabled:shadow-none whitespace-nowrap flex items-center justify-center gap-2"
                        >
                            {isComputing ? (
                                <>
                                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-slate-950" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                    Computing...
                                </>
                            ) : (
                                'Generate Path'
                            )}
                        </button>
                    ) : (
                        <button
                            onClick={() => onModeChange('preview')}
                            className="w-full md:w-auto bg-slate-800 hover:bg-slate-700 text-white px-8 py-3 rounded-xl font-bold text-[10px] uppercase tracking-widest transition-all whitespace-nowrap"
                        >
                            Edit Text
                        </button>
                    )}
                </div>
            )}
            
            {/* For drawing mode, we just need the "Edit" button if we are not in preview */}
            {inputType === 'drawing' && mode !== 'preview' && (
                <div className="flex justify-end pt-2 px-2 pb-2 border-t border-white/5 mt-2">
                    <button
                        onClick={() => onModeChange('preview')}
                        className="w-full md:w-auto bg-slate-800 hover:bg-slate-700 text-white px-8 py-3 rounded-xl font-bold text-[10px] uppercase tracking-widest transition-all whitespace-nowrap"
                    >
                        Edit Drawing
                    </button>
                </div>
            )}
          </div>
          
          {/* Mobile Info Button */}
          <button 
              onClick={onOpenInfo}
              className="md:hidden w-full mt-2 py-2 text-xs font-bold uppercase tracking-widest text-slate-500 hover:text-cyan-400 flex items-center justify-center gap-2"
          >
              Guide
          </button>
      </div>

      {/* Font Selection (Only visible in Text Mode) */}
      {inputType === 'text' && (
          <div className={`flex flex-wrap justify-center gap-3 w-full max-w-4xl px-4 transition-all duration-500 ${mode !== 'preview' ? 'opacity-50 pointer-events-none blur-[2px]' : ''}`}>
              {fonts.map((f) => (
                <button
                  key={f.name}
                  onClick={() => onFontChange(f.name)}
                  disabled={mode !== 'preview'}
                  className={`px-5 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all border whitespace-nowrap flex-shrink-0 ${
                    selectedFont === f.name 
                    ? 'bg-white text-slate-950 border-white shadow-[0_0_15px_rgba(255,255,255,0.3)] scale-105 transform' 
                    : 'bg-white/5 text-slate-400 border-white/5 hover:border-white/20 hover:bg-white/10 disabled:opacity-50'
                  }`}
                >
                  {f.label}
                </button>
              ))}
          </div>
      )}
    </header>
  );
};

export default Header;
