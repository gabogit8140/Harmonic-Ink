
import { Complex, Point } from '../types';
import { thin } from './algorithms/thinning';
import { getConnectedComponents, traceComponent } from './algorithms/tracing';
import { interpolatePoints, smoothPath } from './geometry';

// --- Letter Processing ---

function getLetterPath(char: string, font: string, fontSize: number): Point[] {
    const w = Math.ceil(fontSize * 1.5);
    const h = Math.ceil(fontSize * 2.0);
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return [];

    ctx.font = `${fontSize}px "${font}"`;
    ctx.fillStyle = 'white';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    ctx.fillText(char, w/2, h/2);
    
    const imgData = ctx.getImageData(0,0,w,h);
    const binary = new Uint8Array(w*h);
    for(let i=0; i<binary.length; i++) {
        binary[i] = imgData.data[i*4+3] > 128 ? 1 : 0;
    }
    
    const skel = thin(binary, w, h);
    
    const points: Point[] = [];
    for(let y=0; y<h; y++){
        for(let x=0; x<w; x++){
            if(skel[y*w+x]===1) points.push({x,y, penDown: true});
        }
    }
    
    if (points.length === 0) return [];
    
    const comps = getConnectedComponents(points);
    if (comps.length === 0) return [];

    // Order components: Accessories first, Main (Right-most) last
    const compStats = comps.map((c, idx) => {
        let maxX = -Infinity;
        c.forEach(p => { if (p.x > maxX) maxX = p.x; });
        return { idx, maxX };
    });

    compStats.sort((a, b) => a.maxX - b.maxX);
    const orderedComps = compStats.map(s => comps[s.idx]);
    
    const finalLetterPath: Point[] = [];
    const centerY = h/2;

    for (let i = 0; i < orderedComps.length; i++) {
        const comp = orderedComps[i];
        
        // Start point hint
        // For main component (last), start at Left-most.
        // traceComponent will automatically find the best Backbone from Left->Right.
        // So we just provide the Left-most pixel as a hint for Start.
        
        let startPixel = comp[0];
        let minX = Infinity;
        for (const p of comp) {
            if (p.x < minX) {
                minX = p.x;
                startPixel = p;
            }
        }

        const pathPart = traceComponent(comp, startPixel);
        
        // Invisible Jump from previous component
        if (finalLetterPath.length > 0) {
            const lastP = finalLetterPath[finalLetterPath.length - 1];
            const nextP = pathPart[0];
            const bridge = interpolatePoints(lastP, nextP);
            bridge.forEach(p => p.penDown = false);
            finalLetterPath.push(...bridge);
        }
        
        finalLetterPath.push(...pathPart);
    }
    
    return finalLetterPath.map(p => ({
        x: p.x - w/2,
        y: p.y - h/2,
        penDown: p.penDown
    }));
}

// --- Main Export ---

export async function textToPoints(text: string, width: number, height: number, fontFamily: string = 'Great Vibes'): Promise<{points: Complex[], letterBreaks: number[], penDown: boolean[]}> {
  try {
    const fontStr = `100px "${fontFamily}"`;
    await document.fonts.load(fontStr);
    await document.fonts.ready;
  } catch (e) { console.warn("Font load failed"); }

  const processScale = 0.5;
  const targetFontSize = 200 * processScale; 
  
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if(!ctx) return {points: [], letterBreaks: [], penDown: []};
  ctx.font = `${targetFontSize}px "${fontFamily}"`;
  
  const letterPaths: Point[][] = [];
  
  for (let i = 0; i < text.length; i++) {
      const char = text[i];
      if (char === ' ') {
          letterPaths.push([]); 
          continue;
      }
      
      const startX = ctx.measureText(text.substring(0, i)).width;
      const endX = ctx.measureText(text.substring(0, i+1)).width;
      const charCenterX = startX + (endX - startX) / 2;
      
      const path = getLetterPath(char, fontFamily, targetFontSize);
      
      const shiftedPath = path.map(p => ({
          x: p.x + charCenterX,
          y: p.y,
          penDown: p.penDown
      }));
      
      letterPaths.push(shiftedPath);
  }
  
  const combinedPath: Point[] = [];
  const letterBreaks: number[] = [];

  for (let i = 0; i < letterPaths.length; i++) {
      const current = letterPaths[i];
      
      if (current.length > 0) {
          combinedPath.push(...current);
      }

      // Find next valid letter
      let nextIdx = i + 1;
      while(nextIdx < letterPaths.length && letterPaths[nextIdx].length === 0) {
          nextIdx++;
      }
      
      // Connect to next letter
      if (current.length > 0 && nextIdx < letterPaths.length) {
          const next = letterPaths[nextIdx];
          const hasSpace = (nextIdx - i) > 1; 
          
          // Exit Point is the last point of current letter
          // Our improved traceComponent guarantees this is the logical end of the letter.
          let exitP = current[current.length-1];
          
          // Ensure we are taking a visible point if possible, though backbone ends at exit.
          // Scan back just in case there are invisible artifacts.
          for(let k=current.length-1; k>=0; k--) {
              if (current[k].penDown) {
                  exitP = current[k];
                  break;
              }
          }
          
          const entryP = next[0]; // Start of next letter
          
          const bridge = interpolatePoints(exitP, entryP);
          
          const dx = entryP.x - exitP.x;
          const dy = entryP.y - exitP.y;
          const distSq = dx*dx + dy*dy;
          const largeJumpThreshold = 60 * 60; 
          
          const flowsRight = dx > -10;
          const isVisible = !hasSpace && (distSq < largeJumpThreshold) && flowsRight;
          
          bridge.forEach(p => p.penDown = isVisible);
          combinedPath.push(...bridge);
      }
      
      letterBreaks.push(combinedPath.length);
  }
  
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  combinedPath.forEach(p => {
      if(p.x < minX) minX = p.x;
      if(p.x > maxX) maxX = p.x;
      if(p.y < minY) minY = p.y;
      if(p.y > maxY) maxY = p.y;
  });
  
  const cx = (minX + maxX) / 2;
  const cy = (minY + maxY) / 2;
  const finalScale = 1 / processScale;

  const resampledPoints: Complex[] = [];
  const resampledPenDown: boolean[] = [];
  
  const smooth = smoothPath(combinedPath, 2);
  
  if (smooth.length < 2) return { points: [{re:0, im:0}], letterBreaks: [], penDown: [true] };
  
  let totalLen = 0;
  const lens = [0];
  for(let i=0; i<smooth.length-1; i++){
      const d = Math.sqrt((smooth[i+1].x - smooth[i].x)**2 + (smooth[i+1].y - smooth[i].y)**2);
      totalLen += d;
      lens.push(totalLen);
  }
  
  const pointCount = Math.min(4096, Math.max(2048, Math.floor(totalLen)));
  const resampledBreaks: number[] = [];
  
  for(let i=0; i<pointCount; i++){
      const t = (i / pointCount) * totalLen;
      
      let l=0, r=lens.length-1;
      while(l<r){
          const mid = Math.ceil((l+r)/2);
          if(lens[mid] < t) l=mid;
          else r=mid-1;
      }
      const idx = l;
      const dStart = lens[idx];
      const dEnd = lens[idx+1] || totalLen;
      const segLen = dEnd - dStart;
      const segT = segLen > 0 ? (t - dStart)/segLen : 0;
      
      const p1 = smooth[idx];
      const p2 = smooth[idx+1] || p1;
      
      resampledPoints.push({
          re: (p1.x + (p2.x - p1.x)*segT - cx) * finalScale,
          im: (p1.y + (p2.y - p1.y)*segT - cy) * finalScale
      });
      
      const pd1 = p1.penDown !== false;
      const pd2 = p2.penDown !== false;
      resampledPenDown.push(pd1 && pd2); 
  }

  for (let b of letterBreaks) {
      if (b >= combinedPath.length) b = combinedPath.length - 1;
      const lenAtBreak = lens[Math.min(b, lens.length-1)];
      const ratio = lenAtBreak / totalLen;
      resampledBreaks.push(Math.floor(ratio * pointCount));
  }

  return { points: resampledPoints, letterBreaks: resampledBreaks, penDown: resampledPenDown };
}
