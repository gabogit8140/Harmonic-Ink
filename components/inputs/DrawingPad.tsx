
import React, { useRef, useEffect, useState, forwardRef, useImperativeHandle } from 'react';
import { Point } from '../../types';
import { generateDefaultFlower, Stroke, PALETTE } from '../../utils/drawing';

export interface DrawingPadHandle {
    getStrokes: () => Stroke[];
}

interface DrawingPadProps {
    onInteract: () => void;
    onGenerate?: () => void;
    isGenerating?: boolean;
}

const DrawingPad = forwardRef<DrawingPadHandle, DrawingPadProps>(({ onInteract, onGenerate, isGenerating }, ref) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [isDrawing, setIsDrawing] = useState(false);
    
    const [strokes, setStrokes] = useState<Stroke[]>([]);
    const [currentPoints, setCurrentPoints] = useState<Point[]>([]);
    const [selectedColor, setSelectedColor] = useState(PALETTE[20]); // Default to a nice blue/teal
    
    const userHasDrawn = useRef(false); // Track if user has modified the canvas
    const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });
    const [isColorPickerOpen, setIsColorPickerOpen] = useState(false);

    useImperativeHandle(ref, () => ({
        getStrokes: () => [
            ...strokes, 
            ...(currentPoints.length > 0 ? [{ points: currentPoints, color: selectedColor }] : [])
        ]
    }));

    // Handle Resize & Canvas Resolution
    useEffect(() => {
        if (!containerRef.current) return;

        const updateSize = () => {
            if (containerRef.current) {
                const { offsetWidth, offsetHeight } = containerRef.current;
                
                if (offsetWidth > 0 && offsetHeight > 0) {
                    // Update state if dimensions change
                    setCanvasSize(prev => {
                        if (prev.width !== offsetWidth || prev.height !== offsetHeight) {
                            if (canvasRef.current) {
                                canvasRef.current.width = offsetWidth;
                                canvasRef.current.height = offsetHeight;
                            }
                            return { width: offsetWidth, height: offsetHeight };
                        }
                        return prev;
                    });
                }
            }
        };

        const resizeObserver = new ResizeObserver(() => {
            requestAnimationFrame(updateSize);
        });

        resizeObserver.observe(containerRef.current);
        // Initial call
        updateSize();

        return () => resizeObserver.disconnect();
    }, []);

    // Initialize/Update Default Flower
    // We update the flower whenever the canvas resizes IF the user hasn't drawn anything yet.
    // This ensures it fits the container even during/after animations.
    useEffect(() => {
        if (canvasSize.width > 50 && canvasSize.height > 50 && !userHasDrawn.current) {
            const defaultFlower = generateDefaultFlower(canvasSize.width, canvasSize.height);
            setStrokes(defaultFlower);
        }
    }, [canvasSize]);

    // Draw Loop
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const render = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            ctx.lineWidth = 3;

            // Draw historic strokes
            strokes.forEach((stroke) => {
                if (stroke.points.length < 2) return;
                ctx.beginPath();
                ctx.strokeStyle = stroke.color;
                ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
                for (let j = 1; j < stroke.points.length; j++) {
                    ctx.lineTo(stroke.points[j].x, stroke.points[j].y);
                }
                ctx.stroke();
            });

            // Draw current stroke
            if (currentPoints.length > 1) {
                ctx.beginPath();
                ctx.strokeStyle = selectedColor;
                ctx.shadowColor = selectedColor;
                ctx.shadowBlur = 10;
                ctx.moveTo(currentPoints[0].x, currentPoints[0].y);
                for (let j = 1; j < currentPoints.length; j++) {
                    ctx.lineTo(currentPoints[j].x, currentPoints[j].y);
                }
                ctx.stroke();
                ctx.shadowBlur = 0;
            }
        };

        requestAnimationFrame(render);
        
    }, [strokes, currentPoints, selectedColor, canvasSize]);

    // Input Handlers
    const getPos = (e: React.PointerEvent) => {
        if (!canvasRef.current) return { x: 0, y: 0 };
        const rect = canvasRef.current.getBoundingClientRect();
        return {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
        };
    };

    const handleDown = (e: React.PointerEvent) => {
        e.preventDefault(); 
        if (e.button !== 0) return;
        
        // Mark that user has interacted, so we stop auto-regenerating the flower
        userHasDrawn.current = true;
        
        setIsDrawing(true);
        setIsColorPickerOpen(false); // Close picker on draw
        const pos = getPos(e);
        setCurrentPoints([{ x: pos.x, y: pos.y, penDown: true }]);
        onInteract();
    };

    const handleMove = (e: React.PointerEvent) => {
        if (!isDrawing) return;
        e.preventDefault();
        const pos = getPos(e);
        setCurrentPoints(prev => [...prev, { x: pos.x, y: pos.y, penDown: true }]);
    };

    const handleUp = () => {
        if (!isDrawing) return;
        setIsDrawing(false);
        if (currentPoints.length > 1) {
            setStrokes(prev => [...prev, { points: currentPoints, color: selectedColor }]);
        }
        setCurrentPoints([]);
    };

    const handleUndo = () => {
        userHasDrawn.current = true; // Undo implies manual control
        setStrokes(prev => prev.slice(0, -1));
    };

    const handleClear = () => {
        userHasDrawn.current = true; // Clear implies manual control
        setStrokes([]);
        setCurrentPoints([]);
    };

    return (
        <div className="w-full flex flex-col gap-4">
            <div 
                ref={containerRef}
                className="relative w-full h-64 md:h-80 bg-slate-900/50 rounded-2xl border border-white/10 overflow-hidden touch-none cursor-crosshair hover:border-cyan-500/30 transition-colors shadow-inner"
            >
                <canvas
                    ref={canvasRef}
                    onPointerDown={handleDown}
                    onPointerMove={handleMove}
                    onPointerUp={handleUp}
                    onPointerLeave={handleUp}
                    className="absolute inset-0 w-full h-full block"
                />
                
                {strokes.length === 0 && currentPoints.length === 0 && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20">
                        <span className="text-sm font-black uppercase tracking-widest text-slate-500">Draw Something</span>
                    </div>
                )}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-y-3 gap-x-2 px-1 relative">
                
                {/* Left Group: Color & Stroke Count */}
                <div className="flex items-center gap-4">
                    {/* Color Picker Button & Popover */}
                    <div className="relative">
                        <button
                            onClick={() => setIsColorPickerOpen(!isColorPickerOpen)}
                            className="flex items-center gap-3 px-3 py-2 bg-black/40 rounded-full border border-white/10 hover:border-white/30 transition-colors group min-w-[110px]"
                        >
                            <div 
                                className="w-4 h-4 rounded-full ring-1 ring-white/20 shadow-sm"
                                style={{ backgroundColor: selectedColor, boxShadow: `0 0 8px ${selectedColor}66` }}
                            />
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest group-hover:text-white mr-auto">
                                Color
                            </span>
                            <svg className={`w-3 h-3 text-slate-500 transition-transform ${isColorPickerOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                        </button>

                        {/* Popover */}
                        {isColorPickerOpen && (
                            <div className="absolute top-full left-0 mt-3 p-3 bg-slate-900 border border-white/10 rounded-2xl shadow-2xl z-50 w-64 backdrop-blur-xl">
                                <div className="grid grid-cols-6 gap-2">
                                    {PALETTE.map((color, i) => (
                                        <button
                                            key={`${color}-${i}`}
                                            onClick={() => {
                                                setSelectedColor(color);
                                                setIsColorPickerOpen(false);
                                            }}
                                            className={`w-8 h-8 rounded-full transition-transform hover:scale-110 focus:outline-none ${selectedColor === color ? 'ring-2 ring-white scale-110' : ''}`}
                                            style={{ backgroundColor: color }}
                                            title={color}
                                        />
                                    ))}
                                </div>
                                <div className="absolute -top-1.5 left-6 w-3 h-3 bg-slate-900 border-t border-l border-white/10 transform rotate-45"></div>
                            </div>
                        )}
                    </div>
                    
                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] whitespace-nowrap hidden sm:inline-block">
                        {strokes.length} Strokes
                    </span>
                </div>

                {/* Right Group: Actions */}
                <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap justify-end flex-1 sm:flex-none">
                    <button 
                        onClick={handleUndo}
                        disabled={strokes.length === 0}
                        className="px-3 py-2 bg-white/5 hover:bg-white/10 disabled:opacity-30 text-slate-300 rounded-lg text-[10px] font-black uppercase tracking-widest transition-colors flex items-center gap-1.5"
                    >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" /></svg>
                        Undo
                    </button>
                    <button 
                        onClick={handleClear}
                        disabled={strokes.length === 0}
                        className="px-3 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 disabled:opacity-30 rounded-lg text-[10px] font-black uppercase tracking-widest transition-colors flex items-center gap-1.5"
                    >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        Clear
                    </button>
                    
                    {onGenerate && (
                        <button
                            onClick={onGenerate}
                            disabled={isGenerating || strokes.length === 0}
                            className="ml-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 px-5 py-2 rounded-lg font-bold text-[10px] uppercase tracking-widest transition-all shadow-lg shadow-emerald-900/20 disabled:opacity-50 disabled:shadow-none whitespace-nowrap flex items-center gap-2"
                        >
                            {isGenerating ? (
                                <svg className="animate-spin h-3 w-3" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                            ) : 'Generate Path'}
                        </button>
                    )}
                </div>
            </div>
            
            {/* Backdrop to close picker on outside click */}
            {isColorPickerOpen && (
                <div 
                    className="fixed inset-0 z-40 bg-transparent" 
                    onClick={() => setIsColorPickerOpen(false)}
                />
            )}
        </div>
    );
});

DrawingPad.displayName = 'DrawingPad';

export default DrawingPad;
