
import React, { useState, useEffect, useMemo } from 'react';
import { useFourier } from '../hooks/useFourier';
import FourierVisualizer from './FourierVisualizer';
import Header from './layout/Header';
import Footer from './layout/Footer';

const FONTS = [
  { name: 'Aguafina Script', label: 'Signature' },
  { name: 'Meow Script', label: 'Playful' },
  { name: 'Mrs Saint Delafield', label: 'Vintage' },
  { name: 'Parisienne', label: 'Classic' },
  { name: 'Great Vibes', label: 'Elegant' },
  { name: 'Allura', label: 'Flowing' },
  { name: 'Petit Formal Script', label: 'Formal' },
  { name: 'Pinyon Script', label: 'Aristocrat' },
  { name: 'Rouge Script', label: 'Chic' },
  { name: 'Herr Von Muellerhoff', label: 'Scribe' },
];

const App: React.FC = () => {
  const [text, setText] = useState('My text');
  const [selectedFont, setSelectedFont] = useState(FONTS[0].name);
  const [mode, setMode] = useState<'preview' | 'validating' | 'tracing'>('preview');

  const [numHarmonics, setNumHarmonics] = useState(200); 
  const [speed, setSpeed] = useState(0.8);
  const [trailPersistence, setTrailPersistence] = useState(0.98); 
  const [isPaused, setIsPaused] = useState(true);
  const [showCircles, setShowCircles] = useState(true);
  const [resetTrigger, setResetTrigger] = useState(0);

  const { coefficients, targetPoints, penDownPoints, letterBreaks, isComputing, compute, reset, optimalHarmonics, energyFidelity } = useFourier();

  useEffect(() => {
    setMode('preview');
    reset();
  }, [text, selectedFont, reset]);

  useEffect(() => {
      if (optimalHarmonics > 0) {
          setNumHarmonics(Math.min(500, optimalHarmonics));
      }
  }, [optimalHarmonics]);

  const handleCompute = async () => {
    const success = await compute(text, selectedFont);
    if (success) {
      setMode('validating');
    }
  };

  const handleConfirmValidation = () => {
      setResetTrigger(prev => prev + 1);
      setIsPaused(false);
      setMode('tracing');
  };

  const handleRestart = () => {
    setResetTrigger(prev => prev + 1);
    setIsPaused(false);
  };

  // Real-time calculation of Perceptual Fidelity
  const currentFidelity = useMemo(() => {
    if (energyFidelity.length === 0) return 0;
    const index = Math.min(numHarmonics - 1, energyFidelity.length - 1);
    return energyFidelity[index] || 0;
  }, [numHarmonics, energyFidelity]);

  return (
    <div className="min-h-screen bg-[#020617] p-4 md:p-8 flex flex-col items-center max-w-7xl mx-auto space-y-8">
      <Header 
        text={text}
        onTextChange={setText}
        selectedFont={selectedFont}
        onFontChange={setSelectedFont}
        fonts={FONTS}
        mode={mode}
        onModeChange={setMode}
        isComputing={isComputing}
        onCompute={handleCompute}
        onConfirmValidation={handleConfirmValidation}
      />

      <main className="w-full flex flex-col gap-8 flex-1 z-0">
        <div className="relative w-full">
          <FourierVisualizer 
            text={text}
            fontFamily={selectedFont}
            mode={mode}
            coefficients={coefficients} 
            targetPath={targetPoints}
            penDownPoints={penDownPoints}
            letterBreaks={letterBreaks}
            numHarmonics={numHarmonics}
            setNumHarmonics={setNumHarmonics}
            speed={speed}
            setSpeed={setSpeed}
            isPaused={isPaused}
            setIsPaused={setIsPaused}
            showCircles={showCircles}
            setShowCircles={setShowCircles}
            trailPersistence={trailPersistence}
            resetTrigger={resetTrigger}
            handleRestart={handleRestart}
            onConfirmValidation={handleConfirmValidation}
            fidelity={currentFidelity}
          />
          
          <div className="mt-6 px-4 py-4 md:px-8 md:py-3 bg-white/[0.02] rounded-3xl border border-white/5 text-[9px] text-slate-500 font-mono flex flex-col md:flex-row justify-between md:justify-center items-center gap-4 md:gap-12 uppercase tracking-[0.2em] backdrop-blur-sm text-center">
            <span className="flex items-center gap-2">
              <span className={`w-1.5 h-1.5 rounded-full ${!isPaused ? 'bg-cyan-400 animate-pulse' : 'bg-amber-400'}`}></span>
              Status: <span className="text-white font-bold">{mode.toUpperCase()}</span>
            </span>
            <div className="flex gap-8 md:gap-12 items-center">
              <span className="text-emerald-400 font-black px-2 py-0.5 border border-emerald-400/20 rounded-md bg-emerald-400/5">
                Perceptual Fidelity: {(currentFidelity * 100).toFixed(2)}%
              </span>
              <span className="text-cyan-400 font-bold">Vectors: {numHarmonics}</span>
              <span style={{ fontFamily: selectedFont, textTransform: 'none' }} className="text-sm tracking-normal text-white/40">
                Font: {selectedFont}
              </span>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default App;
