
import React, { useState } from 'react';

interface InfoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const InfoModal: React.FC<InfoModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'guide' | 'math'>('guide');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md transition-opacity duration-300">
      <style>{`
        @keyframes modalPop {
            0% { opacity: 0; transform: scale(0.95) translateY(20px); }
            100% { opacity: 1; transform: scale(1) translateY(0); }
        }
      `}</style>
      <div 
        className="bg-[#020617] border border-white/10 rounded-3xl w-full max-w-3xl h-[85vh] shadow-[0_0_100px_rgba(34,211,238,0.15)] relative overflow-hidden flex flex-col ring-1 ring-white/10"
        style={{ animation: 'modalPop 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards' }}
      >
        {/* Decorative Glows */}
        <div className="absolute -top-20 -left-20 w-64 h-64 bg-cyan-500/10 rounded-full blur-[80px] pointer-events-none"></div>
        <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-fuchsia-500/10 rounded-full blur-[80px] pointer-events-none"></div>
        
        {/* Header Background */}
        <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent"></div>
        
        {/* Modal Top Bar */}
        <div className="flex justify-between items-center p-6 border-b border-white/10 bg-slate-900/50 shrink-0 relative z-10">
            <h2 className="text-xl md:text-2xl font-black text-white uppercase tracking-tighter">
              <span className="text-cyan-400">Harmonic</span> Knowledge Base
            </h2>
            <button 
                onClick={onClose}
                className="p-2 rounded-full hover:bg-white/10 transition-colors text-slate-400 hover:text-white"
            >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-white/10 bg-black/20 shrink-0 relative z-10">
            <button 
                onClick={() => setActiveTab('guide')}
                className={`flex-1 py-4 text-xs font-black uppercase tracking-[0.2em] transition-all relative ${activeTab === 'guide' ? 'text-white' : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'}`}
            >
                User Guide
                {activeTab === 'guide' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.5)]"></div>}
            </button>
            <button 
                onClick={() => setActiveTab('math')}
                className={`flex-1 py-4 text-xs font-black uppercase tracking-[0.2em] transition-all relative ${activeTab === 'math' ? 'text-white' : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'}`}
            >
                The Mathematics
                {activeTab === 'math' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-fuchsia-500 shadow-[0_0_10px_rgba(217,70,239,0.5)]"></div>}
            </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6 md:p-10 space-y-8 scroll-smooth custom-scrollbar bg-transparent relative z-10">
            {activeTab === 'guide' ? <UserGuideContent /> : <MathContent />}
        </div>
        
        {/* Footer */}
        <div className="p-4 border-t border-white/10 bg-slate-900/50 shrink-0 flex justify-end relative z-10">
            <button 
                onClick={onClose}
                className="px-6 py-2 bg-white/10 hover:bg-white/20 text-white text-xs font-bold uppercase tracking-widest rounded-lg transition-colors"
            >
                Close
            </button>
        </div>
      </div>
    </div>
  );
};

const UserGuideContent = () => (
    <div className="space-y-8 text-slate-300">
        <section>
            <h3 className="text-lg font-bold text-cyan-400 mb-4 uppercase tracking-widest">1. Input & Generation</h3>
            <p className="leading-relaxed mb-4 text-sm">
                Begin by typing a word or short phrase into the input field at the top. Select a calligraphic font style that appeals to you. Click <span className="text-emerald-400 font-bold">Generate Path</span> to convert the text into mathematical vector data.
            </p>
            <p className="leading-relaxed text-sm">
                The app first calculates the "skeleton" of the font, converting pixels into a single-stroke path that simulates handwriting, rather than just outlining the letters.
            </p>
        </section>

        <section>
            <h3 className="text-lg font-bold text-cyan-400 mb-4 uppercase tracking-widest">2. Validation & Tracing</h3>
            <p className="leading-relaxed mb-4 text-sm">
                Once generated, you enter <strong>Validation Mode</strong>. Here you see the raw path. Click the "Play" button (or the large circle) to begin the <strong>Fourier Synthesis</strong>.
            </p>
        </section>

        <section>
            <h3 className="text-lg font-bold text-cyan-400 mb-4 uppercase tracking-widest">3. The Controls</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="bg-white/5 p-4 rounded-xl border border-white/5">
                    <span className="block font-bold text-white mb-1">Harmonic Complexity</span>
                    Controls the number of rotating vectors (circles). More circles mean higher fidelity to the original text, but also more visual noise.
                </div>
                <div className="bg-white/5 p-4 rounded-xl border border-white/5">
                    <span className="block font-bold text-white mb-1">Velocity</span>
                    Controls the speed of the animation. Lower the speed to appreciate the intricate dance of the epicycles.
                </div>
                <div className="bg-white/5 p-4 rounded-xl border border-white/5">
                    <span className="block font-bold text-white mb-1">Epicycles (Vectors)</span>
                    Toggles the visibility of the rotating circles and arms. Turn this off to see the "ghost" pen drawing alone.
                </div>
                <div className="bg-white/5 p-4 rounded-xl border border-white/5">
                    <span className="block font-bold text-white mb-1">Color Coding</span>
                    When enabled, each letter is drawn in a distinct color, helping visualize the segmentation of the continuous Fourier path.
                </div>
            </div>
        </section>

        <section>
            <h3 className="text-lg font-bold text-cyan-400 mb-4 uppercase tracking-widest">4. Exporting</h3>
            <p className="leading-relaxed text-sm">
                Want to share the animation? Click the <span className="font-bold text-white">Export Video</span> button in the control bar. You can choose resolution (up to 4K) and frame rate. The app will record the canvas frame-by-frame for perfect smoothness.
            </p>
        </section>
    </div>
);

const MathContent = () => (
    <div className="space-y-10 text-slate-300">
        <section>
            <h3 className="text-xl font-black text-fuchsia-400 mb-6 uppercase tracking-widest">The Clockwork Universe</h3>
            <p className="leading-relaxed mb-6">
                What you are seeing is not an animation of a pen following a pre-defined track. It is a mathematical simulation of a concept proposed by Joseph Fourier in the early 19th century: 
                <em className="block my-4 pl-4 border-l-2 border-fuchsia-500/50 text-white font-serif text-lg">
                    "Any periodic function, no matter how complex, can be rewritten as a sum of simple sine and cosine waves."
                </em>
            </p>
            <p className="leading-relaxed">
                In this visualizer, we apply this concept to geometry. Instead of waves, we use <strong>rotating circles</strong> (epicycles). By chaining enough circles together—each rotating at a different speed and size—we can trace <em>any</em> drawing, signature, or shape.
            </p>
        </section>

        <section className="bg-white/5 p-6 rounded-2xl border border-white/5">
            <h3 className="text-lg font-bold text-cyan-400 mb-4 uppercase tracking-widest">The Formula</h3>
            <p className="leading-relaxed mb-4 text-sm">
                We treat the drawing surface as a Complex Plane. Every point on the line is a number <span className="font-mono text-emerald-400">z = x + iy</span>. The path of the pen <span className="font-mono text-white">f(t)</span> is calculated by the Discrete Fourier Transform (DFT):
            </p>
            <div className="flex justify-center my-8">
                <div className="bg-[#0B1221] px-8 py-6 rounded-xl border border-cyan-500/30 shadow-[0_0_30px_rgba(34,211,238,0.1)]">
                    <code className="text-xl md:text-2xl font-serif text-white">
                        f(t) = <span className="text-fuchsia-400">∑</span> c<sub className="text-slate-400">n</sub> ⋅ e<sup className="text-emerald-400">i ⋅ n ⋅ t</sup>
                    </code>
                </div>
            </div>
            <ul className="space-y-3 text-sm list-disc pl-5 marker:text-cyan-500">
                <li><span className="font-mono text-fuchsia-400 font-bold">∑ (Sigma)</span>: The sum of all the circles attached to each other.</li>
                <li><span className="font-mono text-white font-bold">c<sub>n</sub></span>: The <strong>Radius</strong> and starting <strong>Angle</strong> of the <em>n</em>-th circle. This is calculated using the DFT algorithm on your input text.</li>
                <li><span className="font-mono text-emerald-400 font-bold">n</span>: The <strong>Frequency</strong>. The 1st circle rotates once, the 2nd rotates twice, the 3rd rotates three times, etc.</li>
                <li><span className="font-mono text-white font-bold">e<sup>...</sup></span>: Euler's formula, which translates these numbers into circular rotation.</li>
            </ul>
        </section>

        <section>
            <h3 className="text-lg font-bold text-cyan-400 mb-4 uppercase tracking-widest">How it Works</h3>
            <div className="space-y-6">
                <div className="flex gap-4">
                    <div className="shrink-0 w-8 h-8 rounded-full bg-cyan-900/50 flex items-center justify-center font-bold text-cyan-400 border border-cyan-500/30">1</div>
                    <div>
                        <h4 className="font-bold text-white text-sm uppercase mb-1">Sampling</h4>
                        <p className="text-sm opacity-80">We render your text and extract the XY coordinates of the pen stroke. This creates a list of thousands of points (Complex Numbers).</p>
                    </div>
                </div>
                <div className="flex gap-4">
                    <div className="shrink-0 w-8 h-8 rounded-full bg-cyan-900/50 flex items-center justify-center font-bold text-cyan-400 border border-cyan-500/30">2</div>
                    <div>
                        <h4 className="font-bold text-white text-sm uppercase mb-1">Decomposition (DFT)</h4>
                        <p className="text-sm opacity-80">The DFT algorithm takes this path and breaks it down into "Average Position", "Main Circular Motion", "Secondary Detail Motion", etc. It outputs the list of vectors you see in the sidebar.</p>
                    </div>
                </div>
                <div className="flex gap-4">
                    <div className="shrink-0 w-8 h-8 rounded-full bg-cyan-900/50 flex items-center justify-center font-bold text-cyan-400 border border-cyan-500/30">3</div>
                    <div>
                        <h4 className="font-bold text-white text-sm uppercase mb-1">Synthesis</h4>
                        <p className="text-sm opacity-80">We connect these vectors tip-to-tail. As time <span className="font-mono">t</span> progresses from 0 to 2π, every vector rotates at its assigned speed. The tip of the final vector draws your word.</p>
                    </div>
                </div>
            </div>
        </section>

        <section className="bg-gradient-to-br from-white/5 to-transparent p-6 rounded-2xl border border-white/5">
            <h3 className="text-lg font-bold text-emerald-400 mb-6 uppercase tracking-widest flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.818v6.364a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                Video Resources
            </h3>
            <div className="grid grid-cols-1 gap-4">
                <a href="https://www.youtube.com/watch?v=r6sGWTCMz2k" target="_blank" rel="noopener noreferrer" className="flex items-center gap-4 group p-4 bg-black/40 hover:bg-white/5 rounded-xl border border-white/5 hover:border-cyan-500/30 transition-all">
                   <div className="shrink-0 w-12 h-12 bg-[#FF0000] rounded-lg flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform">
                       <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z"/></svg>
                   </div>
                   <div className="flex-1 min-w-0">
                       <h4 className="font-bold text-white text-sm group-hover:text-cyan-400 transition-colors truncate">But what is a Fourier series?</h4>
                       <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mt-1">3Blue1Brown</p>
                   </div>
                   <svg className="w-5 h-5 text-slate-600 group-hover:text-cyan-400 group-hover:translate-x-1 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                </a>
                
                <a href="https://www.youtube.com/watch?v=MY4luNgGfms" target="_blank" rel="noopener noreferrer" className="flex items-center gap-4 group p-4 bg-black/40 hover:bg-white/5 rounded-xl border border-white/5 hover:border-cyan-500/30 transition-all">
                   <div className="shrink-0 w-12 h-12 bg-[#FF0000] rounded-lg flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform">
                       <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z"/></svg>
                   </div>
                   <div className="flex-1 min-w-0">
                       <h4 className="font-bold text-white text-sm group-hover:text-cyan-400 transition-colors truncate">Coding Challenge #130: Fourier Series</h4>
                       <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mt-1">The Coding Train</p>
                   </div>
                   <svg className="w-5 h-5 text-slate-600 group-hover:text-cyan-400 group-hover:translate-x-1 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                </a>

                <a href="https://www.youtube.com/watch?v=qS4H6PEcCCA" target="_blank" rel="noopener noreferrer" className="flex items-center gap-4 group p-4 bg-black/40 hover:bg-white/5 rounded-xl border border-white/5 hover:border-cyan-500/30 transition-all">
                   <div className="shrink-0 w-12 h-12 bg-[#FF0000] rounded-lg flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform">
                       <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z"/></svg>
                   </div>
                   <div className="flex-1 min-w-0">
                       <h4 className="font-bold text-white text-sm group-hover:text-cyan-400 transition-colors truncate">Epicycles, complex numbers and Fourier</h4>
                       <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mt-1">Mathologer</p>
                   </div>
                   <svg className="w-5 h-5 text-slate-600 group-hover:text-cyan-400 group-hover:translate-x-1 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                </a>
            </div>
        </section>

        <section className="text-center pt-6 pb-2">
            <p className="text-xs font-black uppercase tracking-[0.3em] text-slate-500">
                Mathematics is the art of patterns
            </p>
        </section>
    </div>
);

export default InfoModal;
