
import React, { useRef, useEffect, useState, useMemo } from 'react';
import { FourierCoefficient, Complex } from '../types';
import { calculateFourierPoint } from '../utils/fourier';
import { clearCanvas, renderPreviewFrame, renderTracingFrame, renderValidationFrame } from '../utils/renderers';
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
  pointColors?: string[];
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
  pointColors = [],
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
  const containerRef = useRef<HTMLDivElement>(null);
  const pathRef = useRef<{x: number, y: number, alpha: number, t: number, isDown: boolean}[]>([]);
  const timeRef = useRef<number>(0);
  const requestRef = useRef<number>(0);
  const exportLingerStartTimeRef = useRef<number | null>(null);
  
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
        setIsPaused(true);
    }
  );

  const resetState = () => {
    pathRef.current = [];
    timeRef.current = 0;
    setUiTime(0);
    resetCamera();
    exportLingerStartTimeRef.current = null;
    setStatusText('Ready to Trace');
  };

  useEffect(() => {
    resetState();
  }, [coefficients, resetTrigger]);

  // Compute Content Bounds for Adaptive Scaling
  const bounds = useMemo(() => {
    if (targetPath.length === 0) return { minX: -50, maxX: 50, minY: -50, maxY: 50, width: 100, height: 100 }; 
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    targetPath.forEach(p => {
        if (p.re < minX) minX = p.re;
        if (p.re > maxX) maxX = p.re;
        if (p.im < minY) minY = p.im;
        if (p.im > maxY) maxY = p.im;
    });
    // Ensure bounds have volume
    if (maxX - minX < 1) { maxX += 5; minX -= 5; }
    if (maxY - minY < 1) { maxY += 5; minY -= 5; }
    return { minX, maxX, minY, maxY, width: maxX - minX, height: maxY - minY };
  }, [targetPath]);

  // Responsive Canvas Sizing
  useEffect(() => {
    if (isExporting || !containerRef.current) return;

    const updateSize = () => {
        if (containerRef.current) {
            const { clientWidth, clientHeight } = containerRef.current;
            setCanvasSize(prev => {
                if (Math.abs(prev.width - clientWidth) > 2 || Math.abs(prev.height - clientHeight) > 2) {
                     return { width: clientWidth, height: clientHeight };
                }
                return prev;
            });
        }
    };

    updateSize();
    const observer = new ResizeObserver(updateSize);
    observer.observe(containerRef.current);

    return () => observer.disconnect();
  }, [isExporting, mode]);

  const draw = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (canvas.width !== canvasSize.width || canvas.height !== canvasSize.height) {
        canvas.width = canvasSize.width;
        canvas.height = canvasSize.height;
    }

    clearCanvas(ctx, canvas.width, canvas.height);
    
    if (mode === 'preview') {
        setStatusText('Preview Mode');
        renderPreviewFrame({ ctx, width: canvas.width, height: canvas.height }, text, fontFamily);
        requestRef.current = requestAnimationFrame(draw);
        return;
    }

    if (mode === 'validating') {
        setStatusText('Path Validation');
        renderValidationFrame(
            { ctx, width: canvas.width, height: canvas.height },
            bounds, targetPath, letterBreaks, penDownPoints, coefficients, numHarmonics, showOriginal, text, fontFamily
        );
        requestRef.current = requestAnimationFrame(draw);
        return;
    }

    // Tracing Mode Logic
    const activeCoeffs = coefficients.slice(0, Math.min(numHarmonics, coefficients.length));
    let penX = 0, penY = 0;
    let currentChain: {x: number, y: number}[] = [];
    const maxTime = Math.PI;

    // Check completion and export linger
    const isTraceFinished = timeRef.current >= maxTime - 0.001;
    let isLingering = false;

    if (isExporting && isTraceFinished) {
        if (exportLingerStartTimeRef.current === null) {
            exportLingerStartTimeRef.current = performance.now();
        }
        if (performance.now() - exportLingerStartTimeRef.current > 2000) {
            stopRecording();
            exportLingerStartTimeRef.current = null;
        } else {
            isLingering = true;
        }
    } else if (!isExporting) {
        exportLingerStartTimeRef.current = null;
    }

    // Update Status Text
    if (!isPaused && !isExporting) setStatusText('Synthesizing...');
    else if (isLingering) setStatusText('Finalizing Video...');
    else if (isExporting) setStatusText('Recording Video...');
    else {
        if (isTraceFinished) setStatusText('Trace Complete');
        else if (timeRef.current < 0.01) setStatusText('Ready to Trace');
        else setStatusText('Paused');
    }

    const shouldRun = (activeCoeffs.length > 0) && (!isPaused || (isExporting && !isLingering));

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
            if (!isExporting) setIsPaused(true); 
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

    // Camera Logic
    updateCamera(shouldRun, penX, penY, isTraceFinished, numHarmonics);

    // Render Frame
    renderTracingFrame(
        { ctx, width: canvas.width, height: canvas.height },
        bounds, cameraRef.current, targetPath, showReference, showCircles, isLingering,
        activeCoeffs, currentChain, pathRef.current, letterBreaks, pointColors, colorByLetter,
        penX, penY, showHUD, isExporting, timeRef.current, numHarmonics, fidelity, coefficients
    );

    requestRef.current = requestAnimationFrame(draw);
  };

  useEffect(() => {
    requestRef.current = requestAnimationFrame(draw);
    return () => { if (requestRef.current) cancelAnimationFrame(requestRef.current); };
  }, [coefficients, targetPath, letterBreaks, numHarmonics, speed, isPaused, isExporting, showCircles, trailPersistence, mode, text, fontFamily, showReference, showOriginal, colorByLetter, canvasSize, penDownPoints, pointColors, showHUD, fidelity, bounds]);

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

  return (
    <div className="flex flex-col gap-6 w-full">
      {renderControls()}
      <div ref={containerRef} className="relative w-full aspect-square md:aspect-video bg-[#020617] rounded-[3rem] border-2 border-white/5 overflow-hidden shadow-2xl">
        <canvas ref={canvasRef} width={canvasSize.width} height={canvasSize.height} className="w-full h-full block" />
      </div>
      {mode === 'tracing' && (
        <div className="w-full rounded-[2.5rem] border border-white/5 bg-[#030712]/40 backdrop-blur-xl overflow-hidden p-6 md:p-8">
           <EpicycleList coefficients={coefficients.slice(0, numHarmonics)} t={uiTime} />
        </div>
      )}
      <ExportModal isOpen={isExportModalOpen} onClose={() => setIsExportModalOpen(false)} onExport={startRecording} />
    </div>
  );
};

export default FourierVisualizer;
