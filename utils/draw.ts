
import { Complex, FourierCoefficient } from '../types';

export const drawArrow = (ctx: CanvasRenderingContext2D, fromX: number, fromY: number, toX: number, toY: number, alpha: number) => {
  // Logic handled in drawEpicycles
};

export const drawPreview = (ctx: CanvasRenderingContext2D, width: number, height: number, text: string, fontFamily: string) => {
  ctx.save();
  ctx.translate(width / 2, height / 2);
  
  const baseFontSize = 200;
  const maxWidth = width * 0.8;
  
  ctx.font = `${baseFontSize}px "${fontFamily}"`;
  let fontSize = baseFontSize;
  const measure = ctx.measureText(text);
  
  if (measure.width > maxWidth) {
      fontSize = baseFontSize * (maxWidth / measure.width);
  }
  
  ctx.font = `${fontSize}px "${fontFamily}"`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  
  ctx.shadowColor = 'rgba(255, 255, 255, 0.5)';
  ctx.shadowBlur = 30;
  ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
  ctx.fillText(text, 0, 0);
  
  ctx.lineWidth = 2;
  ctx.strokeStyle = 'rgba(34, 211, 238, 0.3)';
  ctx.shadowBlur = 0;
  ctx.strokeText(text, 0, 0);
  
  ctx.restore();
};

export const drawValidationOverlay = (
  ctx: CanvasRenderingContext2D, 
  width: number, 
  height: number, 
  path: Complex[],
  letterBreaks: number[] = [],
  penDownPoints: boolean[] = []
) => {
  // This helper is kept for reference but FourierVisualizer now handles its own transforms for better adaptive scaling
  // We apply identity here relative to the transformed context
  
  const colors = ['#f87171', '#fbbf24', '#34d399', '#22d3ee', '#818cf8', '#e879f9'];

  if (path.length > 0) {
      ctx.lineWidth = 3; 
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      
      let colorIdx = 0;
      let startIndex = 0;
      const breaks = letterBreaks.length > 0 ? letterBreaks : [path.length];
      
      for (let i = 0; i < breaks.length; i++) {
          const endIndex = breaks[i];
          const color = colors[colorIdx % colors.length];
          colorIdx++;
          
          ctx.beginPath();
          ctx.strokeStyle = color;
          
          let firstPoint = true;
          for (let j = startIndex; j < endIndex && j < path.length; j++) {
              const p = path[j];
              const isDown = penDownPoints.length > 0 ? penDownPoints[j] : true;
              if (!isDown) { firstPoint = true; continue; }
              if (firstPoint) { ctx.moveTo(p.re, p.im); firstPoint = false; }
              else { ctx.lineTo(p.re, p.im); }
          }
          ctx.stroke();
          startIndex = endIndex;
      }
  }

  if (letterBreaks.length > 0) {
     let startIdx = 0;
     ctx.fillStyle = '#ffffff';
     for(let i=0; i<letterBreaks.length; i++) {
         if (startIdx < path.length) {
             const p = path[startIdx];
             if (penDownPoints.length === 0 || penDownPoints[startIdx]) {
                ctx.beginPath();
                ctx.arc(p.re, p.im, 4, 0, Math.PI * 2);
                ctx.fill();
             }
         }
         startIdx = letterBreaks[i];
     }
  }
};

export const drawFourierApproximation = (
  ctx: CanvasRenderingContext2D, 
  width: number, 
  height: number, 
  coeffs: FourierCoefficient[], 
  numHarmonics: number
) => {
  if (coeffs.length === 0) return;
  // Assumes context is already transformed
  const activeCoeffs = coeffs.slice(0, Math.min(numHarmonics, coeffs.length));
  ctx.beginPath();
  ctx.strokeStyle = 'rgba(34, 211, 238, 0.8)';
  ctx.lineWidth = 2;
  const steps = 1000; 
  const maxT = Math.PI;
  for (let i = 0; i <= steps; i++) {
    const t = (i / steps) * maxT;
    let x = 0, y = 0;
    for (let j = 0; j < activeCoeffs.length; j++) {
       const c = activeCoeffs[j];
       x += c.amp * Math.cos(c.freq * t + c.phase);
       y += c.amp * Math.sin(c.freq * t + c.phase);
    }
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.stroke();
};

export const drawReferenceShadow = (ctx: CanvasRenderingContext2D, targetPath: Complex[], zoom: number) => {
  if (targetPath.length === 0) return;
  ctx.beginPath();
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)'; 
  ctx.lineWidth = 12 / zoom; 
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  ctx.moveTo(targetPath[0].re, targetPath[0].im);
  for(let i=1; i<targetPath.length; i++) { ctx.lineTo(targetPath[i].re, targetPath[i].im); }
  ctx.stroke();
  ctx.beginPath();
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)'; 
  ctx.lineWidth = 1 / zoom;
  ctx.moveTo(targetPath[0].re, targetPath[0].im);
  for(let i=1; i<targetPath.length; i++) { ctx.lineTo(targetPath[i].re, targetPath[i].im); }
  ctx.stroke();
};

export const drawEpicycles = (ctx: CanvasRenderingContext2D, chain: {x: number, y: number}[], zoom: number) => {
  if (chain.length < 2) return;
  const end = chain[chain.length - 1];
  for (let i = 1; i < chain.length; i++) {
    const prev = chain[i - 1];
    const curr = chain[i];
    const dx = curr.x - prev.x;
    const dy = curr.y - prev.y;
    const radius = Math.sqrt(dx*dx + dy*dy);
    if (radius * zoom > 1.5) {
       const hue = (i * 20) % 360; 
       ctx.beginPath();
       const opacity = Math.min(0.8, 0.4 + (1.0 / (i + 1)) * 0.4);
       ctx.strokeStyle = `hsla(${hue}, 70%, 60%, ${opacity})`;
       ctx.lineWidth = Math.max(1 / zoom, 0.05);
       ctx.arc(prev.x, prev.y, radius, 0, Math.PI * 2);
       ctx.stroke();
       ctx.beginPath();
       ctx.strokeStyle = `hsla(${hue}, 90%, 80%, ${opacity + 0.2})`; 
       ctx.moveTo(prev.x, prev.y);
       ctx.lineTo(curr.x, curr.y);
       ctx.stroke();
       if (zoom > 2) {
         ctx.beginPath();
         ctx.fillStyle = `hsla(${hue}, 100%, 90%, 1)`;
         ctx.arc(prev.x, prev.y, Math.max(1.5/zoom, 0.08), 0, Math.PI*2);
         ctx.fill();
       }
    }
  }
  if (zoom > 5) {
      ctx.beginPath();
      ctx.setLineDash([8 / zoom, 6 / zoom]);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.lineWidth = 1.5 / zoom;
      ctx.moveTo(end.x, end.y); ctx.lineTo(0, end.y);
      ctx.moveTo(end.x, end.y); ctx.lineTo(end.x, 0);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = 'white';
      ctx.beginPath(); ctx.arc(end.x, 0, 3/zoom, 0, Math.PI*2); ctx.fill();
      ctx.beginPath(); ctx.arc(0, end.y, 3/zoom, 0, Math.PI*2); ctx.fill();
  }
};

export const drawTrail = (
  ctx: CanvasRenderingContext2D, 
  path: {x: number, y: number, alpha: number, t?: number, isDown?: boolean}[], 
  zoom: number,
  colorMode: { enabled: boolean, breaks: number[], totalPoints: number, customColors?: string[] } = { enabled: false, breaks: [], totalPoints: 0 }
) => {
  if (path.length <= 1) return;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.lineWidth = 4 / zoom;

  // Mode: Custom Colors (from Drawing)
  if (colorMode.customColors && colorMode.customColors.length > 0 && colorMode.totalPoints > 0) {
      const getColorAt = (t: number) => {
          const progress = Math.max(0, Math.min(1, t / Math.PI));
          const idx = Math.floor(progress * (colorMode.totalPoints - 1));
          return colorMode.customColors![idx] || '#22d3ee';
      };

      let currentStrokeColor = '';
      let firstPoint = true;

      for (let i = 0; i < path.length - 1; i++) {
        const p1 = path[i];
        const p2 = path[i+1];
        
        // Handle Gaps
        if (!p1.isDown || !p2.isDown) {
             if (!firstPoint) {
                 ctx.stroke();
                 ctx.beginPath();
             }
             firstPoint = true;
             continue;
        }

        const color = getColorAt(p1.t || 0);
        
        if (color !== currentStrokeColor || firstPoint) {
            if (!firstPoint) ctx.stroke();
            ctx.beginPath();
            ctx.strokeStyle = color;
            ctx.moveTo(p1.x, p1.y);
            currentStrokeColor = color;
            firstPoint = false;
        }
        ctx.lineTo(p2.x, p2.y);
      }
      if (!firstPoint) ctx.stroke();
      return;
  }

  // Mode: Letter Colors (Text)
  if (colorMode.enabled && colorMode.breaks.length > 0 && colorMode.totalPoints > 0) {
      const colors = ['#f87171', '#fbbf24', '#34d399', '#22d3ee', '#818cf8', '#e879f9'];
      let colorIdx = 0;
      let nextBreakIdx = 0;
      let currentLimitRatio = colorMode.breaks[0] / colorMode.totalPoints;
      
      ctx.beginPath();
      let currentColor = colors[0];
      ctx.strokeStyle = currentColor;
      
      let firstPoint = true;

      for (let i = 0; i < path.length - 1; i++) {
          const p1 = path[i];
          const p2 = path[i+1];

          // Handle Gaps
          if (!p1.isDown || !p2.isDown) {
             if (!firstPoint) {
                 ctx.stroke();
                 ctx.beginPath();
             }
             firstPoint = true;
             continue; 
          }

          const progress = (p1.t || 0) / Math.PI;
          
          if (progress > currentLimitRatio && nextBreakIdx < colorMode.breaks.length) {
              if (!firstPoint) ctx.stroke();
              
              nextBreakIdx++;
              colorIdx++;
              if (nextBreakIdx < colorMode.breaks.length) {
                 currentLimitRatio = colorMode.breaks[nextBreakIdx] / colorMode.totalPoints;
              } else {
                 currentLimitRatio = 1.1;
              }
              
              currentColor = colors[colorIdx % colors.length];
              ctx.beginPath();
              ctx.strokeStyle = currentColor;
              ctx.moveTo(p1.x, p1.y); 
          } else if (firstPoint) {
              ctx.beginPath();
              ctx.strokeStyle = currentColor;
              ctx.moveTo(p1.x, p1.y);
              firstPoint = false;
          }

          ctx.lineTo(p2.x, p2.y);
      }
      if (!firstPoint) ctx.stroke();
  } else {
      // Default Gradient Trail
      if (path.length < 2) return;
      
      let startIndex = 0;
      for (let i = 0; i < path.length - 1; i++) {
          if (!path[i].isDown) {
              if (i > startIndex) {
                 drawSimpleSegment(ctx, path, startIndex, i);
              }
              startIndex = i + 1;
          }
      }
      if (startIndex < path.length - 1) {
          drawSimpleSegment(ctx, path, startIndex, path.length - 1);
      }
  }
};

const drawSimpleSegment = (ctx: CanvasRenderingContext2D, path: any[], start: number, end: number) => {
    if (start >= end) return;
    ctx.beginPath();
    const grad = ctx.createLinearGradient(path[start].x, path[start].y, path[end].x, path[end].y);
    grad.addColorStop(0, '#22d3ee');
    grad.addColorStop(1, '#a78bfa');
    ctx.strokeStyle = grad;
    ctx.moveTo(path[start].x, path[start].y);
    for(let i=start+1; i<=end; i++) {
        ctx.lineTo(path[i].x, path[i].y);
    }
    ctx.stroke();
};

export const drawClockHUD = (
    ctx: CanvasRenderingContext2D, 
    width: number, 
    height: number, 
    coeffs: FourierCoefficient[], 
    t: number, 
    numHarmonics: number,
    zoom: number,
    fidelity: number = 0
) => {
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);

    const padding = 40;
    
    ctx.font = '10px "JetBrains Mono", monospace';
    ctx.fillStyle = '#64748b';
    
    // Calculate percentage based on t (0 to PI)
    const percentage = Math.min(100, Math.max(0, (t / Math.PI) * 100));
    ctx.fillText(`COMPLETION: ${percentage.toFixed(1)}%`, padding, padding);

    const isDone = t >= Math.PI - 0.01;
    ctx.fillStyle = isDone ? '#10b981' : '#22d3ee';
    ctx.beginPath();
    ctx.arc(padding + 5, padding + 20, 4, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.font = 'bold 10px "Inter", sans-serif';
    ctx.fillStyle = '#fff';
    ctx.fillText(isDone ? 'COMPLETE' : 'SYNTHESIZING', padding + 15, padding + 23);

    const bottomY = height - padding;
    
    ctx.font = '10px "JetBrains Mono", monospace';
    ctx.fillStyle = '#94a3b8';
    ctx.fillText(`ZOOM: ${zoom.toFixed(2)}x`, padding, bottomY - 35);
    
    if (fidelity > 0) {
        ctx.fillStyle = '#10b981';
        ctx.fillText(`Fidelity: ${(fidelity * 100).toFixed(2)}%`, padding, bottomY - 20);
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(padding, bottomY - 15, 100, 3);
        ctx.fillStyle = '#10b981';
        ctx.fillRect(padding, bottomY - 15, 100 * fidelity, 3);
    }

    ctx.fillStyle = '#22d3ee';
    ctx.font = 'bold 10px "JetBrains Mono", monospace';
    ctx.fillText(`VECTORS: ${numHarmonics}`, padding, bottomY);

    ctx.strokeStyle = 'rgba(255,255,255,0.2)';
    ctx.lineWidth = 2;
    
    ctx.beginPath();
    ctx.moveTo(padding, bottomY + 10);
    ctx.lineTo(padding, bottomY - 50);
    ctx.moveTo(padding, bottomY + 10);
    ctx.lineTo(padding + 100, bottomY + 10);
    
    ctx.setLineDash([4, 4]);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.restore();
};
