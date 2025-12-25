
import { Complex, FourierCoefficient } from '../types';

export const drawArrow = (ctx: CanvasRenderingContext2D, fromX: number, fromY: number, toX: number, toY: number, alpha: number) => {
  // NO-OP or simplified line to prevent clutter.
  // We now use drawEpicycles' internal logic for the "spokes".
};

export const drawPreview = (ctx: CanvasRenderingContext2D, width: number, height: number, text: string, fontFamily: string) => {
  ctx.save();
  ctx.translate(width / 2, height / 2);
  
  // Standardized sizing logic to match textToPoints
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
  
  // Glow effect
  ctx.shadowColor = 'rgba(255, 255, 255, 0.5)';
  ctx.shadowBlur = 30;
  ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
  ctx.fillText(text, 0, 0);
  
  // Subtle outline
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
  letterBreaks: number[] = []
) => {
  ctx.save();
  ctx.translate(width / 2, height / 2);

  // Debug Colors
  const colors = ['#f87171', '#fbbf24', '#34d399', '#22d3ee', '#818cf8', '#e879f9'];

  if (path.length > 0) {
      let currentBreakIdx = 0;
      
      // Draw segment by segment to color them differently
      // This is slightly less efficient but fine for validation
      ctx.lineWidth = 3;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      
      let startIndex = 0;
      
      // If no breaks provided, treat as one segment
      const breaks = letterBreaks.length > 0 ? letterBreaks : [path.length];
      
      for (let i = 0; i < breaks.length; i++) {
          const endIndex = breaks[i];
          const color = colors[i % colors.length];
          
          ctx.beginPath();
          ctx.strokeStyle = color;
          
          if (startIndex < path.length) {
              ctx.moveTo(path[startIndex].re, path[startIndex].im);
              
              for (let j = startIndex + 1; j <= endIndex && j < path.length; j++) {
                  ctx.lineTo(path[j].re, path[j].im);
              }
              ctx.stroke();
          }
          startIndex = endIndex;
      }
  }

  // Draw start points of letters to explicitly show separation
  if (letterBreaks.length > 0) {
     let startIdx = 0;
     ctx.fillStyle = '#ffffff';
     for(let i=0; i<letterBreaks.length; i++) {
         if (startIdx < path.length) {
             const p = path[startIdx];
             ctx.beginPath();
             ctx.arc(p.re, p.im, 4, 0, Math.PI * 2);
             ctx.fill();
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
  ctx.strokeStyle = 'rgba(34, 211, 238, 0.8)'; // Cyan, visible
  ctx.lineWidth = 2;
  ctx.shadowColor = 'rgba(34, 211, 238, 0.5)';
  ctx.shadowBlur = 10;
  
  const steps = 1000; 
  // Signal is mirrored (A->B->A), we only draw A->B (0 to PI)
  const maxT = Math.PI;

  for (let i = 0; i <= steps; i++) {
    const t = (i / steps) * maxT;
    let x = 0;
    let y = 0;
    for (let j = 0; j < activeCoeffs.length; j++) {
       const c = activeCoeffs[j];
       x += c.amp * Math.cos(c.freq * t + c.phase);
       y += c.amp * Math.sin(c.freq * t + c.phase);
    }
    
    if (i === 0) {
      ctx.moveTo(x, y);
    } else {
      ctx.lineTo(x, y);
    }
  }
  ctx.stroke();
  ctx.shadowBlur = 0;
  ctx.restore();
};

export const drawReferenceShadow = (ctx: CanvasRenderingContext2D, targetPath: Complex[], zoom: number) => {
  if (targetPath.length === 0) return;

  ctx.beginPath();
  // Faint, ghost-like appearance
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)'; 
  ctx.lineWidth = 12 / zoom; 
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  
  // Draw the target path segments
  ctx.moveTo(targetPath[0].re, targetPath[0].im);
  for(let i=1; i<targetPath.length; i++) {
      ctx.lineTo(targetPath[i].re, targetPath[i].im);
  }
  ctx.stroke();

  // Thinner detail line
  ctx.beginPath();
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)'; 
  ctx.lineWidth = 1 / zoom;
  
  ctx.moveTo(targetPath[0].re, targetPath[0].im);
  for(let i=1; i<targetPath.length; i++) {
      ctx.lineTo(targetPath[i].re, targetPath[i].im);
  }
  ctx.stroke();
};

export const drawEpicycles = (ctx: CanvasRenderingContext2D, chain: {x: number, y: number}[], zoom: number) => {
  // If chain is empty, nothing to draw
  if (chain.length < 2) return;

  const end = chain[chain.length - 1];

  // Draw the mechanical arm structure
  for (let i = 1; i < chain.length; i++) {
    const prev = chain[i - 1];
    const curr = chain[i];
    const dx = curr.x - prev.x;
    const dy = curr.y - prev.y;
    const radius = Math.sqrt(dx*dx + dy*dy);
    
    // Threshold calculation: 
    // Smallest visible circle radius in screen pixels = 1.0
    // So if radius * zoom < 1.0, skip.
    if (radius * zoom > 1.5) {
       
       // Spectrum Coloring: Cycle through hue to distinguish harmonics
       // Use a faster cycle for high frequency variety
       const hue = (i * 20) % 360; 

       // 1. Draw the Circle (Path of the vector tip)
       ctx.beginPath();
       // Increased Opacity for Visibility as requested
       // Decay slightly for very high harmonics to prevent white-out, but keep base higher
       const opacity = Math.min(0.8, 0.4 + (1.0 / (i + 1)) * 0.4);
       
       ctx.strokeStyle = `hsla(${hue}, 70%, 60%, ${opacity})`;
       // Thicker lines relative to zoom, but clamp max thickness
       ctx.lineWidth = Math.max(1 / zoom, 0.05);
       
       ctx.arc(prev.x, prev.y, radius, 0, Math.PI * 2);
       ctx.stroke();

       // 2. Draw the "Spoke" (The Vector Arm)
       // This replaces the arrow. It's a line from Center -> Tip.
       ctx.beginPath();
       // Spoke is slightly brighter
       ctx.strokeStyle = `hsla(${hue}, 90%, 80%, ${opacity + 0.2})`; 
       ctx.moveTo(prev.x, prev.y);
       ctx.lineTo(curr.x, curr.y);
       ctx.stroke();

       // 3. Draw a Pivot Dot (The Joint)
       // Only if zoom is sufficient
       if (zoom > 2) {
         ctx.beginPath();
         ctx.fillStyle = `hsla(${hue}, 100%, 90%, 1)`;
         ctx.arc(prev.x, prev.y, Math.max(1.5/zoom, 0.08), 0, Math.PI*2);
         ctx.fill();
       }
    }
  }

  // --- Graphical Decomposition: Projections ---
  // Show the X and Y components of the final tip relative to the center (0,0)
  // This helps visualization "working together" to form the coordinate
  if (zoom > 5) {
      ctx.beginPath();
      // Dashed lines
      ctx.setLineDash([8 / zoom, 6 / zoom]);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.lineWidth = 1.5 / zoom;
      
      // Horizontal projection to Y-axis (x=0)
      ctx.moveTo(end.x, end.y);
      ctx.lineTo(0, end.y);
      
      // Vertical projection to X-axis (y=0)
      ctx.moveTo(end.x, end.y);
      ctx.lineTo(end.x, 0);
      
      ctx.stroke();
      
      // Reset dash
      ctx.setLineDash([]);
      
      // Draw Axes markers on the axes themselves if visible?
      // Just drawing the intersection points is cleaner
      ctx.fillStyle = 'white';
      
      // X-axis intersection
      ctx.beginPath();
      ctx.arc(end.x, 0, 3/zoom, 0, Math.PI*2);
      ctx.fill();

      // Y-axis intersection
      ctx.beginPath();
      ctx.arc(0, end.y, 3/zoom, 0, Math.PI*2);
      ctx.fill();
  }
};

export const drawTrail = (
  ctx: CanvasRenderingContext2D, 
  path: {x: number, y: number, alpha: number, t?: number}[], 
  zoom: number,
  colorMode: { enabled: boolean, breaks: number[], totalPoints: number } = { enabled: false, breaks: [], totalPoints: 0 }
) => {
  if (path.length <= 1) return;

  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  
  if (colorMode.enabled && colorMode.totalPoints > 0) {
      // --- LETTER COLORING MODE ---
      // Instead of a gradient, we color based on which letter segment the point belongs to.
      // We process the path and switch colors whenever the letter index changes.
      
      const letterColors = ['#22d3ee', '#f472b6', '#34d399', '#fbbf24', '#a78bfa', '#fb7185', '#60a5fa'];
      ctx.lineWidth = 4 / zoom;

      let currentLetterIdx = -1;
      let batchStartIdx = 0;

      const getLetterIdx = (t: number) => {
          const progress = t / Math.PI; // 0 to 1 assuming 0->PI range
          const estimatedIdx = Math.floor(progress * colorMode.totalPoints);
          let idx = 0;
          for (let k = 0; k < colorMode.breaks.length; k++) {
              if (estimatedIdx >= colorMode.breaks[k]) {
                  idx = k + 1;
              }
          }
          return idx;
      };

      for (let i = 0; i < path.length; i++) {
          const p = path[i];
          if (typeof p.t !== 'number') continue;
          
          const idx = getLetterIdx(p.t);
          
          if (idx !== currentLetterIdx) {
              // Draw the accumulated batch for the previous color
              if (currentLetterIdx !== -1 && i > batchStartIdx) {
                  ctx.beginPath();
                  ctx.strokeStyle = letterColors[currentLetterIdx % letterColors.length];
                  const startP = path[batchStartIdx];
                  ctx.moveTo(startP.x, startP.y);
                  for (let j = batchStartIdx + 1; j < i; j++) {
                      ctx.lineTo(path[j].x, path[j].y);
                  }
                  // Extend to current point to close gap
                  ctx.lineTo(p.x, p.y);
                  ctx.stroke();
              }
              currentLetterIdx = idx;
              batchStartIdx = i; // Overlap slightly? Just start from current.
          }
      }

      // Draw remaining batch
      if (batchStartIdx < path.length) {
          ctx.beginPath();
          ctx.strokeStyle = letterColors[currentLetterIdx % letterColors.length];
          const startP = path[batchStartIdx];
          ctx.moveTo(startP.x, startP.y);
          for (let j = batchStartIdx + 1; j < path.length; j++) {
              ctx.lineTo(path[j].x, path[j].y);
          }
          ctx.stroke();
      }

      // Tip
      if (path.length > 0) {
          const tip = path[path.length-1];
          ctx.fillStyle = 'white';
          ctx.beginPath();
          ctx.arc(tip.x, tip.y, 2.5 / zoom, 0, Math.PI*2);
          ctx.fill();
      }

  } else {
      // --- FRESH INK GRADIENT MODE (Original) ---
      
      // Separation of "Fresh Ink" vs "Old Ink"
      const freshCount = 60; // Number of points to consider "fresh"
      const historicLength = Math.max(0, path.length - freshCount);
      
      // 1. Draw Historic Path (Cool Cyan)
      if (historicLength > 1) {
          ctx.lineWidth = 4 / zoom;
          
          ctx.beginPath();
          ctx.strokeStyle = '#22d3ee'; // Cyan-400 equivalent
          
          const start = path[0];
          ctx.moveTo(start.x, start.y);
          
          for (let i = 1; i < historicLength; i++) {
              const p = path[i];
              ctx.lineTo(p.x, p.y);
          }
          ctx.stroke();
      }
      
      // 2. Draw Fresh Ink (Hot Gradient: Cyan -> Magenta -> White)
      const startFresh = Math.max(1, historicLength);
      
      for (let i = startFresh; i < path.length; i++) {
          const p1 = path[i-1];
          const p2 = path[i];
          
          // Calculate freshness factor (0 = old/cyan, 1 = tip/white)
          const t = (i - startFresh) / (path.length - startFresh);
          
          let r, g, b;
          if (t < 0.5) {
              // Cyan (34, 211, 238) to Magenta (236, 72, 153)
              const localT = t * 2;
              r = 34 + (236 - 34) * localT;
              g = 211 + (72 - 211) * localT;
              b = 238 + (153 - 238) * localT;
          } else {
              // Magenta (236, 72, 153) to White (255, 255, 255)
              const localT = (t - 0.5) * 2;
              r = 236 + (255 - 236) * localT;
              g = 72 + (255 - 72) * localT;
              b = 153 + (255 - 153) * localT;
          }
          
          ctx.beginPath();
          ctx.strokeStyle = `rgb(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)})`;
          
          // Tip slightly thicker for emphasis
          const tipWidth = (4 + 1.5 * t) / zoom;
          ctx.lineWidth = tipWidth;
          
          ctx.moveTo(p1.x, p1.y);
          ctx.lineTo(p2.x, p2.y);
          ctx.stroke();
      }
      
      // Add a glowing ball at the very tip
      if (path.length > 0) {
          const tip = path[path.length-1];
          ctx.shadowBlur = 15 / zoom;
          ctx.shadowColor = 'white';
          ctx.fillStyle = 'white';
          ctx.beginPath();
          ctx.arc(tip.x, tip.y, 2.5 / zoom, 0, Math.PI*2);
          ctx.fill();
          ctx.shadowBlur = 0;
      }
  }
};
