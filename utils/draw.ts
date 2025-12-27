
// @google/genai used in other files but this utility handles canvas drawing.
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
  ctx.save();
  ctx.translate(width / 2, height / 2);

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

  ctx.restore();
};

export const drawFourierApproximation = (
  ctx: CanvasRenderingContext2D, 
  width: number, 
  height: number, 
  coeffs: FourierCoefficient[], 
  numHarmonics: number
) => {
  if (coeffs.length === 0) return;
  ctx.save();
  ctx.translate(width / 2, height / 2);
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
  ctx.restore();
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
  colorMode: { enabled: boolean, breaks: number[], totalPoints: number } = { enabled: false, breaks: [], totalPoints: 0 }
) => {
  if (path.length <= 1) return;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  if (colorMode.enabled && colorMode.totalPoints > 0) {
      const letterColors = ['#22d3ee', '#f472b6', '#34d399', '#fbbf24', '#a78bfa', '#fb7185', '#60a5fa'];
      ctx.lineWidth = 4 / zoom;
      const getLetterIdx = (t: number) => {
          const progress = t / Math.PI; 
          const estimatedIdx = Math.floor(progress * colorMode.totalPoints);
          let idx = 0;
          for (let k = 0; k < colorMode.breaks.length; k++) { if (estimatedIdx >= colorMode.breaks[k]) { idx = k + 1; } }
          return idx;
      };
      ctx.beginPath();
      let currentLetterIdx = -1;
      let firstPoint = true;
      for (let i = 0; i < path.length; i++) {
          const p = path[i];
          if (typeof p.t !== 'number') continue;
          if (p.isDown === false) { if (!firstPoint) { ctx.stroke(); firstPoint = true; ctx.beginPath(); } continue; }
          const idx = getLetterIdx(p.t);
          if (idx !== currentLetterIdx) {
             ctx.stroke();
             currentLetterIdx = idx;
             ctx.beginPath();
             ctx.strokeStyle = letterColors[currentLetterIdx % letterColors.length];
             ctx.moveTo(p.x, p.y);
             firstPoint = false;
          } else {
             if (firstPoint) {
                 currentLetterIdx = idx;
                 ctx.beginPath();
                 ctx.strokeStyle = letterColors[currentLetterIdx % letterColors.length];
                 ctx.moveTo(p.x, p.y);
                 firstPoint = false;
             } else { ctx.lineTo(p.x, p.y); }
          }
      }
      ctx.stroke();
      if (path.length > 0) {
          const tip = path[path.length-1];
          if (tip.isDown !== false) {
              ctx.fillStyle = 'white';
              ctx.beginPath();
              ctx.arc(tip.x, tip.y, 2.5 / zoom, 0, Math.PI*2);
              ctx.fill();
          }
      }
  } else {
      const freshCount = 60;
      const historicLength = Math.max(0, path.length - freshCount);
      if (historicLength > 1) {
          ctx.lineWidth = 4 / zoom;
          ctx.beginPath();
          ctx.strokeStyle = '#22d3ee'; 
          let first = true;
          for (let i = 0; i < historicLength; i++) {
              const p = path[i];
              if (p.isDown === false) { first = true; continue; }
              if (first) { ctx.moveTo(p.x, p.y); first = false; }
              else { ctx.lineTo(p.x, p.y); }
          }
          ctx.stroke();
      }
      const startFresh = Math.max(0, historicLength - 1);
      for (let i = startFresh + 1; i < path.length; i++) {
          const p1 = path[i-1]; const p2 = path[i];
          if (p1.isDown === false || p2.isDown === false) continue;
          const t = (i - startFresh) / (path.length - startFresh);
          let r, g, b;
          if (t < 0.5) {
              const localT = t * 2;
              r = 34 + (236 - 34) * localT; g = 211 + (72 - 211) * localT; b = 238 + (153 - 238) * localT;
          } else {
              const localT = (t - 0.5) * 2;
              r = 236 + (255 - 236) * localT; g = 72 + (255 - 72) * localT; b = 153 + (255 - 153) * localT;
          }
          ctx.beginPath();
          ctx.strokeStyle = `rgb(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)})`;
          ctx.lineWidth = (4 + 1.5 * t) / zoom;
          ctx.moveTo(p1.x, p1.y); ctx.lineTo(p2.x, p2.y); ctx.stroke();
      }
      if (path.length > 0) {
          const tip = path[path.length-1];
          if (tip.isDown !== false) {
            ctx.shadowBlur = 15 / zoom; ctx.shadowColor = 'white';
            ctx.fillStyle = 'white'; ctx.beginPath(); ctx.arc(tip.x, tip.y, 2.5 / zoom, 0, Math.PI*2); ctx.fill();
            ctx.shadowBlur = 0;
          }
      }
  }
};

/**
 * Expanded High-fidelity HUD overlay for video export.
 * Now features a multi-row grid of vectors (Harmonic Matrix).
 */
export const drawClockHUD = (
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    coefficients: FourierCoefficient[],
    t: number,
    numHarmonics: number,
    zoom: number,
    fidelity: number = 0
) => {
    ctx.save();
    
    const uiScale = width / 1200;
    const padding = 40 * uiScale;
    
    // Bottom Bar Background - Deeper and Taller to accommodate more rows
    const rows = 3;
    const cols = 12;
    const barHeight = 220 * uiScale; 
    const gradient = ctx.createLinearGradient(0, height - barHeight, 0, height);
    gradient.addColorStop(0, 'rgba(2, 6, 23, 0)');
    gradient.addColorStop(0.2, 'rgba(2, 6, 23, 0.95)');
    gradient.addColorStop(1, 'rgba(2, 6, 23, 1)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, height - barHeight, width, barHeight);

    // Matrix Layout
    const maxN = rows * cols;
    const activeCoeffs = coefficients.slice(0, Math.min(maxN, numHarmonics));
    const clockSize = 50 * uiScale;
    const hSpacing = (width - padding * 2) / cols;
    const vSpacing = (barHeight - 60 * uiScale) / rows;
    
    const maxAmp = activeCoeffs.length > 0 ? activeCoeffs[0].amp : 1;

    activeCoeffs.forEach((c, i) => {
        const row = Math.floor(i / cols);
        const col = i % cols;
        
        const centerX = padding + hSpacing * col + hSpacing / 2;
        const centerY = (height - barHeight) + 60 * uiScale + vSpacing * row + vSpacing / 2;
        const radius = clockSize * 0.35;
        
        const phase = c.freq * t + c.phase;
        const hue = (i * 20) % 360;
        const color = `hsla(${hue}, 90%, 75%, 1)`;

        // Relative Amp Ring
        const relAmp = c.amp / maxAmp;
        ctx.beginPath();
        ctx.fillStyle = `hsla(${hue}, 90%, 50%, ${0.05 + relAmp * 0.1})`;
        ctx.arc(centerX, centerY, radius * 1.2, 0, Math.PI * 2);
        ctx.fill();

        // Clock Outer Rim
        ctx.beginPath();
        ctx.strokeStyle = `rgba(255, 255, 255, ${0.1 + relAmp * 0.2})`;
        ctx.lineWidth = 1 * uiScale;
        ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
        ctx.stroke();

        // Vector Hand
        ctx.save();
        ctx.shadowBlur = 10 * uiScale * relAmp;
        ctx.shadowColor = color;
        ctx.beginPath();
        ctx.strokeStyle = color;
        ctx.lineWidth = (2 + relAmp * 2) * uiScale;
        ctx.lineCap = 'round';
        ctx.moveTo(centerX, centerY);
        const tipX = centerX + Math.cos(phase) * radius;
        const tipY = centerY + Math.sin(phase) * radius;
        ctx.lineTo(tipX, tipY);
        ctx.stroke();
        ctx.restore();

        // Tiny Labels
        ctx.textAlign = 'center';
        ctx.font = `bold ${8 * uiScale}px monospace`;
        ctx.fillStyle = 'rgba(255,255,255,0.4)';
        ctx.fillText(`H${Math.abs(c.freq)}`, centerX, centerY + radius + 12 * uiScale);
        
        if (relAmp > 0.1) {
            ctx.fillStyle = color;
            ctx.font = `900 ${7 * uiScale}px monospace`;
            ctx.fillText(c.amp.toFixed(0), centerX, centerY - radius - 5 * uiScale);
        }
    });

    // Top Header Status
    const headHeight = 60 * uiScale;
    ctx.fillStyle = 'rgba(2, 6, 23, 0.85)';
    ctx.fillRect(0, 0, width, headHeight);
    
    // Pulsing "REC" or "LIVE" indicator
    const blink = Math.floor(Date.now() / 500) % 2 === 0;
    if (blink) {
        ctx.beginPath();
        ctx.fillStyle = '#ef4444';
        ctx.arc(padding, headHeight / 2, 5 * uiScale, 0, Math.PI * 2);
        ctx.fill();
    }
    
    // Status Text
    ctx.font = `900 ${14 * uiScale}px sans-serif`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#22d3ee';
    ctx.fillText("MATRIX SIGNAL PROCESSING // HIGH FIDELITY SYNTHESIS", padding + 15 * uiScale, headHeight / 2);

    // Metrics readouts
    ctx.textAlign = 'right';
    ctx.font = `bold ${12 * uiScale}px monospace`;
    ctx.fillStyle = 'white';
    ctx.fillText(`NODES: ${numHarmonics} | FIDELITY: ${(fidelity * 100).toFixed(2)}% | ZOOM: ${zoom.toFixed(1)}x`, width - padding, headHeight / 2);

    // Aesthetic grid lines for header
    ctx.strokeStyle = 'rgba(34, 211, 238, 0.2)';
    ctx.lineWidth = 0.5 * uiScale;
    ctx.beginPath();
    ctx.moveTo(0, headHeight); ctx.lineTo(width, headHeight);
    ctx.stroke();

    ctx.restore();
};
