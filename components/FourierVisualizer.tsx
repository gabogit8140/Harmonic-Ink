
import React, { useRef, useEffect, useState } from 'react';
import { FourierCoefficient, Complex } from '../types';
import { drawPreview, drawValidationOverlay, drawReferenceShadow, drawEpicycles, drawTrail, drawFourierApproximation, drawClockHUD } from '../utils/draw';
import { calculateFourierPoint } from '../utils/fourier';
import VisualizerControls from './controls/VisualizerControls';
import ExportModal from './modals/ExportModal';
import EpicycleList from './visualizer/EpicycleList';
import { useVisualizerCamera } from '../hooks/useVisualizerCamera';
import { useVideoRecorder } from '../hooks/useVideoRecorder';

interface FourierVisualizerProps {
  text: string;
  fontFamily: string;
  mode: 'preview' | 'validating' | 'tracing';
  coefficients: FourierCoefficient[];
  targetPath: Complex[]; 
  penDownPoints?: boolean[];
  letterBreaks?: number[];
  numHarmonics: number;
  setNumHarmonics: (val: number) => void;
  speed: number;
  setSpeed: (val: number) => void;
  isPaused: boolean;
  setIsPaused: (val: boolean) => void;
  showCircles: boolean;
  setShowCircles: (val: boolean) => void;
  trailPersistence: number; 
  resetTrigger?: number; 
  handleRestart: () => void;
  onConfirmValidation: () => void;
  fidelity?: number;
}

const FourierVisualizer: React.FC<FourierVisualizerProps> = ({ 
  text,
  fontFamily,
  mode,
  coefficients, 
  targetPath,
  penDownPoints = [],
  letterBreaks = [],
  numHarmonics, 
  setNumHarmonics,
  speed,
  setSpeed,
  isPaused,
  setIsPaused,
  showCircles,
  setShowCircles,
  trailPersistence = 0.98,
  resetTrigger = 0,
  handleRestart,
  onConfirmValidation,
  fidelity = 1.0
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pathRef = useRef<{x: number, y: number, alpha: number, t: number, isDown: boolean}[]>([]);
  const timeRef = useRef<number>(0);
  const requestRef = useRef<number>(0);
  
  const [uiTime, setUiTime] = useState(0);
  const [statusText, setStatusText] = useState('Ready');
  const [showReference, setShowReference] = useState(false);
  const [showOriginal, setShowOriginal] = useState(false);
  const [colorByLetter, setColorByLetter] = useState(true);
  const [showHUD, setShowHUD] = useState(true);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [canvasSize, setCanvasSize] = useState({ width: 1200, height: 675 });

  // Modular Hooks
  const { cameraRef, updateCamera, resetCamera } = useVisualizerCamera();
  const { isExporting, startRecording, stopRecording } = useVideoRecorder(text, canvasRef, 
    (settings) => { // On Start
        setIsExportModalOpen(false);
        setIsPaused(true);
        setCanvasSize({ width: settings.width, height: settings.height });
        resetState();
    }, 
    () => { // On End
        setCanvasSize({ width: 1200, height: 675 });
        setIsPaused(true);
    }
  );

  const resetState = () => {
    pathRef.current = [];
    timeRef.current = 0;
    setUiTime(0);
    resetCamera();
    setStatusText('Ready to Trace');
  };

  useEffect(() => {
    resetState();
  }, [coefficients, resetTrigger]);

  const draw = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#020617';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    if (mode === 'preview') {
        setStatusText('Preview Mode');
        drawPreview(ctx, canvas.width, canvas.height, text, fontFamily);
        requestRef.current = requestAnimationFrame(draw);
        return;
    }

    if (mode === 'validating') {
        setStatusText('Path Validation');
        if (showOriginal) { drawPreview(ctx, canvas.width, canvas.height, text, fontFamily); }
        drawValidationOverlay(ctx, canvas.width, canvas.height, targetPath, letterBreaks, penDownPoints);
        drawFourierApproximation(ctx, canvas.width, canvas.height, coefficients, numHarmonics);
        requestRef.current = requestAnimationFrame(draw);
        return;
    }

    const activeCoeffs = coefficients.slice(0, Math.min(numHarmonics, coefficients.length));
    let penX = 0, penY = 0;
    let currentChain: {x: number, y: number}[] = [];
    const maxTime = Math.PI;

    if (!isPaused && !isExporting) setStatusText('Synthesizing...');
    else if (isExporting) setStatusText('Recording Video...');
    else {
        if (timeRef.current >= maxTime - 0.001) setStatusText('Trace Complete');
        else if (timeRef.current < 0.01) setStatusText('Ready to Trace');
        else setStatusText('Paused');
    }

    const shouldRun = (activeCoeffs.length > 0) && (!isPaused || isExporting);

    if (shouldRun) {
      const baseDt = (2 * Math.PI) / (coefficients.length || 2048);
      const zoomFactor = Math.max(0.015, 1 / (Math.max(1, cameraRef.current.zoom) * 0.2));
      const effectiveSpeed = speed * zoomFactor;
      const totalFrameDt = baseDt * effectiveSpeed;
      const subSteps = Math.max(1, Math.ceil(effectiveSpeed * 12)); 
      const stepDt = totalFrameDt / subSteps;

      for (let s = 0; s < subSteps; s++) {
        if (timeRef.current >= maxTime) {
            timeRef.current = maxTime;
            if (isExporting) stopRecording(); else setIsPaused(true);
            break; 
        }
        timeRef.current += stepDt;
        const result = calculateFourierPoint(activeCoeffs, timeRef.current);
        let isDown = true;
        if (penDownPoints.length > 0) {
             const progress = Math.min(1, Math.max(0, timeRef.current / Math.PI));
             const idx = Math.floor(progress * (penDownPoints.length - 1));
             isDown = penDownPoints[idx];
        }
        if (s === subSteps - 1) { currentChain = result.chain; penX = result.x; penY = result.y; }
        pathRef.current.push({ x: result.x, y: result.y, alpha: 1.0, t: timeRef.current, isDown });
      }
      if (pathRef.current.length > 150000) pathRef.current = pathRef.current.slice(-150000);
      setUiTime(timeRef.current);
    } else {
        const result = calculateFourierPoint(activeCoeffs, timeRef.current);
        penX = result.x; penY = result.y;
        currentChain = result.chain;
        setUiTime(timeRef.current);
    }

    // Camera Logic Delegated to Hook
    updateCamera(
        shouldRun, 
        penX, 
        penY, 
        timeRef.current >= maxTime - 0.001,
        numHarmonics
    );

    ctx.save();
    ctx.translate(canvas.width / 2, canvas.height / 2);
    const resolutionScale = canvas.width / 1200; 
    ctx.scale(resolutionScale, resolutionScale);
    ctx.scale(cameraRef.current.zoom, cameraRef.current.zoom);
    ctx.translate(-cameraRef.current.x, -cameraRef.current.y);

    if (showReference) drawReferenceShadow(ctx, targetPath, cameraRef.current.zoom);
    if (showCircles && activeCoeffs.length > 0) drawEpicycles(ctx, currentChain, cameraRef.current.zoom);

    drawTrail(ctx, pathRef.current, cameraRef.current.zoom, {
        enabled: colorByLetter,
        breaks: letterBreaks,
        totalPoints: targetPath.length
    });

    ctx.beginPath();
    ctx.fillStyle = '#ffffff';
    ctx.shadowBlur = 15 / cameraRef.current.zoom; ctx.shadowColor = '#fff';
    ctx.arc(penX, penY, 2 / cameraRef.current.zoom, 0, Math.PI * 2);
    ctx.fill(); ctx.shadowBlur = 0;
    ctx.restore();

    // Render Cinematic HUD on top of everything if enabled or exporting
    if (showHUD || isExporting) {
        drawClockHUD(ctx, canvas.width, canvas.height, coefficients, timeRef.current, numHarmonics, cameraRef.current.zoom, fidelity);
    }

    requestRef.current = requestAnimationFrame(draw);
  };

  useEffect(() => {
    requestRef.current = requestAnimationFrame(draw);
    return () => { if (requestRef.current) cancelAnimationFrame(requestRef.current); };
  }, [coefficients, targetPath, letterBreaks, numHarmonics, speed, isPaused, isExporting, showCircles, trailPersistence, mode, text, fontFamily, showReference, showOriginal, colorByLetter, canvasSize, penDownPoints, showHUD, fidelity]);

  const handlePlayToggle = () => {
     if (mode === 'validating') { onConfirmValidation(); return; }
     if (mode !== 'tracing' || isExporting) return;
     if (timeRef.current >= Math.PI - 0.001) {
        resetState();
        setIsPaused(false);
     } else { setIsPaused(!isPaused); }
  };

  const renderControls = () => (
     <VisualizerControls 
       mode={mode}
       isPaused={isPaused}
       onTogglePlay={handlePlayToggle}
       numHarmonics={numHarmonics}
       onHarmonicsChange={setNumHarmonics}
       maxHarmonics={coefficients.length || 2048}
       speed={speed}
       onSpeedChange={setSpeed}
       showCircles={showCircles}
       onToggleCircles={() => setShowCircles(!showCircles)}
       showReference={mode === 'validating' ? showOriginal : showReference}
       onToggleReference={() => mode === 'validating' ? setShowOriginal(!showOriginal) : setShowReference(!showReference)}
       onRestart={handleRestart}
       colorByLetter={colorByLetter}
       onToggleColorByLetter={() => setColorByLetter(!colorByLetter)}
       onExportClick={mode === 'tracing' ? () => setIsExportModalOpen(true) : undefined}
       showClocks={showHUD}
       onToggleClocks={() => setShowHUD(!showHUD)}
       fidelity={fidelity}
     />
  );

  if (mode === 'preview') {
      return (
        <div className="flex flex-col gap-6">
            <div className="relative w-full aspect-square md:aspect-video bg-[#020617] rounded-[3rem] border-2 border-white/5 overflow-hidden shadow-2xl flex items-center justify-center">
                <canvas ref={canvasRef} width={1200} height={675} className="w-full h-full object-contain" />
            </div>
        </div>
      );
  }

  return (
    <div className="flex flex-col gap-6 w-full">
      {renderControls()}
      <div className="flex flex-col lg:flex-row gap-6 w-full h-auto min-h-[500px]">
        <div className="relative flex-1 aspect-square md:aspect-video bg-[#020617] rounded-[3rem] border-2 border-white/5 overflow-hidden shadow-2xl">
          <canvas ref={canvasRef} width={canvasSize.width} height={canvasSize.height} className="w-full h-full object-contain" />
          <div className="absolute top-8 left-8 flex flex-col gap-2 pointer-events-none z-10">
            <div className="px-4 py-2 bg-black/40 border border-white/10 rounded-full flex items-center gap-2 backdrop-blur-xl">
              <div className={`w-2.5 h-2.5 rounded-full ${isExporting ? 'bg-red-500 animate-pulse' : (!isPaused ? 'bg-emerald-400 animate-pulse' : (statusText === 'Trace Complete' ? 'bg-amber-400' : 'bg-cyan-400'))} shadow-[0_0_8px_currentColor]`}></div>
              <span className="text-[10px] font-mono text-white uppercase tracking-widest font-black">{statusText}</span>
            </div>
          </div>
        </div>
        {!showHUD && mode === 'tracing' && (
          <div className="w-full lg:w-[320px] shrink-0">
             <EpicycleList coefficients={coefficients.slice(0, numHarmonics)} t={uiTime} />
          </div>
        )}
      </div>
      <ExportModal isOpen={isExportModalOpen} onClose={() => setIsExportModalOpen(false)} onExport={startRecording} />
    </div>
  );
};

export default FourierVisualizer;
