
import { FourierCoefficient, Complex } from '../types';
import { drawPreview, drawFourierApproximation, drawReferenceShadow, drawEpicycles, drawTrail, drawClockHUD } from './draw';

interface RenderContext {
    ctx: CanvasRenderingContext2D;
    width: number;
    height: number;
}

interface Bounds {
    minX: number;
    maxX: number;
    minY: number;
    maxY: number;
    width: number;
    height: number;
}

export const clearCanvas = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    ctx.fillStyle = '#020617';
    ctx.fillRect(0, 0, width, height);
};

export const renderPreviewFrame = (
    { ctx, width, height }: RenderContext,
    text: string,
    fontFamily: string
) => {
    drawPreview(ctx, width, height, text, fontFamily);
};

export const renderValidationFrame = (
    { ctx, width, height }: RenderContext,
    bounds: Bounds,
    targetPath: Complex[],
    letterBreaks: number[],
    penDownPoints: boolean[],
    coefficients: FourierCoefficient[],
    numHarmonics: number,
    showOriginal: boolean,
    text: string,
    fontFamily: string
) => {
    const boundsCX = (bounds.minX + bounds.maxX) / 2;
    const boundsCY = (bounds.minY + bounds.maxY) / 2;
    
    // Fit content
    const padding = 1.2;
    const scaleX = width / (bounds.width * padding);
    const scaleY = height / (bounds.height * padding);
    const baseScale = Math.min(scaleX, scaleY);

    ctx.save();
    ctx.translate(width / 2, height / 2);
    ctx.scale(baseScale, baseScale);
    ctx.translate(-boundsCX, -boundsCY);
    
    // Draw Path (using local logic to match original Visualizer behavior exactly)
    const colors = ['#f87171', '#fbbf24', '#34d399', '#22d3ee', '#818cf8', '#e879f9'];
    if (targetPath.length > 0) {
        ctx.lineWidth = 3 / baseScale;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        let colorIdx = 0;
        let start = 0;
        const breaks = letterBreaks.length > 0 ? letterBreaks : [targetPath.length];
        
        for(const end of breaks) {
            ctx.beginPath();
            ctx.strokeStyle = colors[colorIdx % colors.length];
            colorIdx++;
            let first = true;
            for(let i=start; i<end && i<targetPath.length; i++) {
                 const p = targetPath[i];
                 const isDown = penDownPoints[i] !== false;
                 if(!isDown) { first=true; continue; }
                 if(first) { ctx.moveTo(p.re, p.im); first=false; }
                 else ctx.lineTo(p.re, p.im);
            }
            ctx.stroke();
            start = end;
        }
    }
    
    // Draw Fourier Approximation (faint)
    drawFourierApproximation(ctx, 0, 0, coefficients, numHarmonics); 
    ctx.restore();
    
    if (showOriginal) {
        drawPreview(ctx, width, height, text, fontFamily);
    }
};

export const renderTracingFrame = (
    { ctx, width, height }: RenderContext,
    bounds: Bounds,
    camera: { zoom: number, x: number, y: number },
    targetPath: Complex[],
    showReference: boolean,
    showCircles: boolean,
    isLingering: boolean,
    activeCoeffs: FourierCoefficient[],
    currentChain: {x: number, y: number}[],
    path: any[], // Type for pathRef.current
    letterBreaks: number[],
    pointColors: string[],
    colorByLetter: boolean,
    penX: number,
    penY: number,
    showHUD: boolean,
    isExporting: boolean,
    time: number,
    numHarmonics: number,
    fidelity: number,
    coefficients: FourierCoefficient[] // Full list for HUD
) => {
    const boundsCX = (bounds.minX + bounds.maxX) / 2;
    const boundsCY = (bounds.minY + bounds.maxY) / 2;
    
    const padding = 1.2;
    const scaleX = width / (bounds.width * padding);
    const scaleY = height / (bounds.height * padding);
    const baseScale = Math.min(scaleX, scaleY);

    ctx.save();
    ctx.translate(width / 2, height / 2);
    
    // Apply Adaptive Scale & Camera
    ctx.scale(baseScale, baseScale);
    ctx.scale(camera.zoom, camera.zoom);
    ctx.translate(-boundsCX - camera.x, -boundsCY - camera.y);

    if (showReference) drawReferenceShadow(ctx, targetPath, camera.zoom);
    
    // Draw Epicycles (Vectors) - Hide during Linger
    if (showCircles && activeCoeffs.length > 0 && !isLingering) {
        drawEpicycles(ctx, currentChain, camera.zoom);
    }

    drawTrail(ctx, path, camera.zoom, {
        enabled: colorByLetter,
        breaks: letterBreaks,
        totalPoints: targetPath.length,
        customColors: pointColors 
    });

    // Draw Pen
    ctx.beginPath();
    ctx.fillStyle = '#ffffff';
    ctx.shadowBlur = 15 / camera.zoom; ctx.shadowColor = '#fff';
    ctx.arc(penX, penY, 2 / camera.zoom, 0, Math.PI * 2);
    ctx.fill(); ctx.shadowBlur = 0;
    ctx.restore();

    // Render Cinematic HUD - Hide during Linger
    if ((showHUD || isExporting) && !isLingering) {
        drawClockHUD(ctx, width, height, coefficients, time, numHarmonics, camera.zoom, fidelity);
    }
};
