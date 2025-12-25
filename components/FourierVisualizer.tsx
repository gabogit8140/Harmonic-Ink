
import React, { useRef, useEffect, useState } from 'react';
import { FourierCoefficient, Complex } from '../types';
import { drawPreview, drawValidationOverlay, drawReferenceShadow, drawEpicycles, drawTrail, drawFourierApproximation } from '../utils/draw';
import { calculateFourierPoint } from '../utils/fourier';
import VisualizerControls from './controls/VisualizerControls';
import ExportModal, { ExportSettings } from './modals/ExportModal';

interface FourierVisualizerProps {
  text: string;
  fontFamily: string;
  mode: 'preview' | 'validating' | 'tracing';
  coefficients: FourierCoefficient[];
  targetPath: Complex[]; 
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
}

const FourierVisualizer: React.FC<FourierVisualizerProps> = ({ 
  text,
  fontFamily,
  mode,
  coefficients, 
  targetPath,
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
  onConfirmValidation
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pathRef = useRef<{x: number, y: number, alpha: number, t: number}[]>([]);
  const timeRef = useRef<number>(0);
  const cameraTimeRef = useRef<number>(0); 
  const cameraRef = useRef({ zoom: 1, x: 0, y: 0 });
  const requestRef = useRef<number>(0);
  
  // Recording Refs
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  
  const [statusText, setStatusText] = useState('Ready');
  const [showReference, setShowReference] = useState(false);
  const [showOriginal, setShowOriginal] = useState(true);
  const [colorByLetter, setColorByLetter] = useState(true);
  
  // Export State
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [canvasSize, setCanvasSize] = useState({ width: 1200, height: 675 });
  const [exportSettings, setExportSettings] = useState<ExportSettings | null>(null);

  useEffect(() => {
    pathRef.current = [];
    timeRef.current = 0;
    cameraTimeRef.current = 0;
    cameraRef.current = { zoom: 0.9, x: 0, y: 0 };
    setStatusText('Ready to Trace');
  }, [coefficients, resetTrigger]);

  const draw = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear Screen
    ctx.fillStyle = '#020617';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // --- PREVIEW MODE ---
    if (mode === 'preview') {
        setStatusText('Preview Mode');
        drawPreview(ctx, canvas.width, canvas.height, text, fontFamily);
        requestRef.current = requestAnimationFrame(draw);
        return;
    }

    // --- VALIDATION MODE ---
    if (mode === 'validating') {
        setStatusText('Path Validation');
        if (showOriginal) {
           drawPreview(ctx, canvas.width, canvas.height, text, fontFamily);
        }
        drawValidationOverlay(ctx, canvas.width, canvas.height, targetPath, letterBreaks);
        drawFourierApproximation(ctx, canvas.width, canvas.height, coefficients, numHarmonics);
        requestRef.current = requestAnimationFrame(draw);
        return;
    }

    // --- TRACING MODE ---
    const activeCoeffs = coefficients.slice(0, Math.min(numHarmonics, coefficients.length));
    
    let penX = 0;
    let penY = 0;
    let currentChain: {x: number, y: number}[] = [];

    const maxTime = Math.PI;

    if (!isPaused && !isExporting) {
        setStatusText('Synthesizing...');
    } else if (isExporting) {
        setStatusText('Recording Video...');
    } else {
        if (timeRef.current >= maxTime - 0.001) setStatusText('Trace Complete');
        else if (timeRef.current < 0.01) setStatusText('Ready to Trace');
        else setStatusText('Paused');
    }

    // Logic: If Exporting, force unpaused logic, otherwise respect isPaused
    const shouldRun = (activeCoeffs.length > 0) && (!isPaused || isExporting);

    if (shouldRun) {
      const baseDt = (2 * Math.PI) / (coefficients.length || 2048);
      
      const zoomFactor = Math.max(0.015, 1 / (Math.max(1, cameraRef.current.zoom) * 0.2));
      // During export, we might want a consistent speed, but respecting user speed is usually better UX
      const effectiveSpeed = speed * zoomFactor;

      const totalFrameDt = baseDt * effectiveSpeed;
      const subSteps = Math.max(1, Math.ceil(effectiveSpeed * 12)); 
      const stepDt = totalFrameDt / subSteps;

      for (let s = 0; s < subSteps; s++) {
        if (timeRef.current >= maxTime) {
            timeRef.current = maxTime;
            
            // Handle Export Completion
            if (isExporting) {
                stopRecording();
            } else {
                setIsPaused(true);
            }
            break; 
        }

        timeRef.current += stepDt;
        
        const result = calculateFourierPoint(activeCoeffs, timeRef.current);
        const sx = result.x;
        const sy = result.y;
        
        if (s === subSteps - 1) {
            currentChain = result.chain;
            penX = sx;
            penY = sy;
        }

        pathRef.current.push({ x: sx, y: sy, alpha: 1.0, t: timeRef.current });
      }

      if (pathRef.current.length > 150000) pathRef.current = pathRef.current.slice(-150000);
      
    } else {
        const result = calculateFourierPoint(activeCoeffs, timeRef.current);
        penX = result.x;
        penY = result.y;
        currentChain = result.chain;
    }

    // --- Camera Logic ---
    let targetZoom = 0.9;
    let targetCamX = 0;
    let targetCamY = 0;
    const lerpSpeed = 0.08; 

    // Override camera during export if preferred, or keep cinematic
    if (shouldRun) {
       cameraTimeRef.current += 0.01;
       const oscFreq = 0.8; 
       const rawOsc = Math.sin(cameraTimeRef.current * oscFreq);
       const normalizedOsc = (rawOsc + 1) / 2;
       
       // Cubic easing for sharper zoom-in
       const zoomCurve = Math.pow(normalizedOsc, 4.0); 
       
       // Dynamic Zoom Ceiling based on Complexity (numHarmonics)
       // Minimum high zoom is 60x, scales up with complexity to show tiny circles
       const maxZoomCeiling = Math.min(350, 60 + numHarmonics * 0.4); 
       const ultraDeepZoom = maxZoomCeiling;
       
       const wideShot = 0.8;
       targetZoom = wideShot + (ultraDeepZoom - wideShot) * zoomCurve;
       targetCamX = penX;
       targetCamY = penY;
    } else if (timeRef.current >= maxTime - 0.001) {
       targetZoom = 0.9;
       targetCamX = 0;
       targetCamY = 0;
    }

    cameraRef.current.zoom += (targetZoom - cameraRef.current.zoom) * lerpSpeed;
    cameraRef.current.x += (targetCamX - cameraRef.current.x) * lerpSpeed;
    cameraRef.current.y += (targetCamY - cameraRef.current.y) * lerpSpeed;

    ctx.save();
    ctx.translate(canvas.width / 2, canvas.height / 2);
    // Adjust scale based on resolution relative to base design (1200w)
    // This ensures elements don't look tiny on 4K or huge on 720p
    const resolutionScale = canvas.width / 1200; 
    ctx.scale(resolutionScale, resolutionScale);
    
    ctx.scale(cameraRef.current.zoom, cameraRef.current.zoom);
    ctx.translate(-cameraRef.current.x, -cameraRef.current.y);

    if (showReference) {
        drawReferenceShadow(ctx, targetPath, cameraRef.current.zoom);
    }

    if (showCircles && activeCoeffs.length > 0) {
        drawEpicycles(ctx, currentChain, cameraRef.current.zoom);
    }

    drawTrail(
      ctx, 
      pathRef.current, 
      cameraRef.current.zoom, 
      {
        enabled: colorByLetter,
        breaks: letterBreaks,
        totalPoints: targetPath.length
      }
    );

    // Pen tip
    ctx.beginPath();
    ctx.fillStyle = '#ffffff';
    ctx.shadowBlur = 15 / cameraRef.current.zoom;
    ctx.shadowColor = '#fff';
    ctx.arc(penX, penY, 2 / cameraRef.current.zoom, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    ctx.restore();
    requestRef.current = requestAnimationFrame(draw);
  };

  useEffect(() => {
    requestRef.current = requestAnimationFrame(draw);
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [coefficients, targetPath, letterBreaks, numHarmonics, speed, isPaused, isExporting, showCircles, trailPersistence, mode, text, fontFamily, showReference, showOriginal, colorByLetter, canvasSize]);

  // --- Export Logic ---

  const startExport = (settings: ExportSettings) => {
    setIsExportModalOpen(false);
    setExportSettings(settings);
    
    // 1. Pause Animation & Resize Canvas
    setIsPaused(true);
    setCanvasSize({ width: settings.width, height: settings.height });
    
    // 2. Wait for resize to take effect (next tick)
    setTimeout(() => {
        if (!canvasRef.current) return;
        
        // 3. Setup Recorder
        const stream = canvasRef.current.captureStream(settings.fps);
        const options: MediaRecorderOptions = {
            mimeType: settings.mimeType,
            videoBitsPerSecond: 8000000 // 8 Mbps for good quality
        };

        try {
            const recorder = new MediaRecorder(stream, options);
            recordedChunksRef.current = [];
            
            recorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    recordedChunksRef.current.push(event.data);
                }
            };

            recorder.onstop = () => {
                const blob = new Blob(recordedChunksRef.current, { type: settings.mimeType });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                // Determine extension
                const ext = settings.mimeType.includes('mp4') ? 'mp4' : 'webm';
                a.download = `harmonic-ink-${text.replace(/\s+/g, '-')}.${ext}`;
                a.click();
                URL.revokeObjectURL(url);
                
                // Cleanup
                setCanvasSize({ width: 1200, height: 675 }); // Reset to default
                setIsExporting(false);
                setExportSettings(null);
                // Pause at the end
                setIsPaused(true);
            };

            mediaRecorderRef.current = recorder;
            recorder.start();
            
            // 4. Reset & Start Animation Loop
            timeRef.current = 0;
            pathRef.current = [];
            cameraTimeRef.current = 0;
            setIsExporting(true); // Loops animation in `draw` without `isPaused` check

        } catch (e) {
            console.error("Export failed:", e);
            alert("Export failed: " + (e as any).message);
            setCanvasSize({ width: 1200, height: 675 });
        }
    }, 500);
  };

  const stopRecording = () => {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
          mediaRecorderRef.current.stop();
      }
  };

  const handlePlayToggle = () => {
     if (mode === 'validating') {
         onConfirmValidation();
         return;
     }
     if (mode !== 'tracing' || isExporting) return;
     const maxTime = Math.PI;
     
     if (timeRef.current >= maxTime - 0.001) {
        timeRef.current = 0;
        pathRef.current = [];
        cameraTimeRef.current = 0;
        setIsPaused(false);
     } else {
        setIsPaused(!isPaused);
     }
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
     />
  );

  if (mode === 'preview') {
      return (
        <div className="flex flex-col gap-6">
            <div className="relative w-full aspect-square md:aspect-video bg-[#020617] rounded-[3rem] border-2 border-white/5 overflow-hidden shadow-2xl group flex items-center justify-center">
                <canvas
                    ref={canvasRef}
                    width={1200}
                    height={675}
                    className="w-full h-full object-contain"
                />
            </div>
        </div>
      );
  }

  return (
    <div className="flex flex-col gap-6 w-full group">
      {renderControls()}

      <div className="relative w-full aspect-square md:aspect-video bg-[#020617] rounded-[3rem] border-2 border-white/5 overflow-hidden shadow-2xl">
        <canvas
          ref={canvasRef}
          width={canvasSize.width}
          height={canvasSize.height}
          className="w-full h-full object-contain"
        />
        
        {/* Indicators */}
        <div className="absolute top-8 left-8 flex flex-col gap-2 pointer-events-none z-10">
          <div className="px-4 py-2 bg-black/40 border border-white/10 rounded-full flex items-center gap-2 backdrop-blur-xl">
            <div className={`w-2.5 h-2.5 rounded-full ${isExporting ? 'bg-red-500 animate-pulse' : (!isPaused ? 'bg-emerald-400 animate-pulse' : (statusText === 'Trace Complete' ? 'bg-amber-400' : 'bg-cyan-400'))} shadow-[0_0_8px_currentColor]`}></div>
            <span className="text-[10px] font-mono text-white uppercase tracking-widest font-black">
              {statusText}
            </span>
          </div>
        </div>
      </div>

      <ExportModal 
        isOpen={isExportModalOpen} 
        onClose={() => setIsExportModalOpen(false)}
        onExport={startExport}
      />
    </div>
  );
};

export default FourierVisualizer;
