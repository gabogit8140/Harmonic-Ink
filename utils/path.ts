
import { Complex, Point } from '../types';
import { thin } from './algorithms/thinning';
import { getConnectedComponents, traceComponent } from './algorithms/tracing';
import { interpolatePoints, smoothPath } from './geometry';

// --- Letter Processing ---

/**
 * Extracts a continuous path for a single character.
 */
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
    
    // Draw centered
    ctx.fillText(char, w/2, h/2);
    
    // Basic Thinning Setup
    const imgData = ctx.getImageData(0,0,w,h);
    const binary = new Uint8Array(w*h);
    for(let i=0; i<binary.length; i++) {
        binary[i] = imgData.data[i*4+3] > 128 ? 1 : 0;
    }
    
    // Thin
    const skel = thin(binary, w, h);
    
    // Extract Points
    const points: Point[] = [];
    for(let y=0; y<h; y++){
        for(let x=0; x<w; x++){
            if(skel[y*w+x]===1) points.push({x,y});
        }
    }
    
    if (points.length === 0) return [];
    
    // Components - Group connected pixels
    const comps = getConnectedComponents(points);
    if (comps.length === 0) return [];

    // --- Smart Component Chaining Strategy ---
    // Treat the letter as a graph of components.
    // 1. Start with the component containing the left-most pixel.
    // 2. Trace it.
    // 3. To move to the next component, find the closest pair of points between
    //    the *entire* path traced so far and *any* pixel in the remaining components.
    // 4. Retrace the path to that launch point, then jump.
    
    let currentCompIdx = -1;
    let minX = Infinity;
    
    // Find left-most component start
    for(let i=0; i<comps.length; i++) {
        for(let p of comps[i]) {
            if (p.x < minX) {
                minX = p.x;
                currentCompIdx = i;
            }
        }
    }
    if (currentCompIdx === -1) currentCompIdx = 0;

    const finalLetterPath: Point[] = [];
    const visitedComps = new Set<number>();
    
    // Initial Trace
    const pathPart = traceComponent(comps[currentCompIdx]);
    finalLetterPath.push(...pathPart);
    visitedComps.add(currentCompIdx);
    
    // Loop until all components visited
    while (visitedComps.size < comps.length) {
        let bestCompIdx = -1;
        let bestPathIdx = -1;
        let bestStartPixelIdx = -1; 
        let minGlobalDist = Infinity;
        
        // Iterate all unvisited components
        for(let cIdx=0; cIdx<comps.length; cIdx++) {
            if(visitedComps.has(cIdx)) continue;
            
            const compPixels = comps[cIdx];
            // Find closest connection
            for(let pIdx=0; pIdx<compPixels.length; pIdx++) {
                const pComp = compPixels[pIdx];
                // Check against existing path (searching backwards is usually better for recent strokes)
                for(let pathI=finalLetterPath.length-1; pathI>=0; pathI--) {
                     const pPath = finalLetterPath[pathI];
                     const d = (pComp.x - pPath.x)**2 + (pComp.y - pPath.y)**2;
                     
                     if (d < minGlobalDist) {
                         minGlobalDist = d;
                         bestCompIdx = cIdx;
                         bestPathIdx = pathI;
                         bestStartPixelIdx = pIdx;
                         
                         // Optimization: If we found a very close point, stop searching this component
                         if (d < 4) break; 
                     }
                }
            }
        }
        
        if (bestCompIdx !== -1) {
            // 1. Retrace finalLetterPath to bestPathIdx
            for(let k=finalLetterPath.length-2; k>=bestPathIdx; k--) {
                finalLetterPath.push(finalLetterPath[k]);
            }
            
            const targetPixel = comps[bestCompIdx][bestStartPixelIdx];
            
            // 2. Bridge
            const bridge = interpolatePoints(finalLetterPath[finalLetterPath.length-1], targetPixel);
            finalLetterPath.push(...bridge);
            
            // 3. Trace new component starting at best entry pixel
            const newPart = traceComponent(comps[bestCompIdx], targetPixel);
            finalLetterPath.push(...newPart);
            
            visitedComps.add(bestCompIdx);
        } else {
            // Should not happen if comps.length > visited.size, but safe break
            break; 
        }
    }
    
    return finalLetterPath.map(p => ({
        x: p.x - w/2,
        y: p.y - h/2
    }));
}

// --- Main Export ---

export async function textToPoints(text: string, width: number, height: number, fontFamily: string = 'Great Vibes'): Promise<{points: Complex[], letterBreaks: number[]}> {
  try {
    const fontStr = `100px "${fontFamily}"`;
    await document.fonts.load(fontStr);
    await document.fonts.ready;
  } catch (e) { console.warn("Font load failed"); }

  // Processing Scale
  const processScale = 0.5;
  const targetFontSize = 200 * processScale; 
  
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if(!ctx) return {points: [], letterBreaks: []};
  ctx.font = `${targetFontSize}px "${fontFamily}"`;
  
  const letterPaths: Point[][] = [];
  
  // First pass: Generate letter paths and positions
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
          y: p.y
      }));
      
      letterPaths.push(shiftedPath);
  }
  
  // Second pass: Stitch letters
  const combinedPath: Point[] = [];
  const letterBreaks: number[] = [];
  
  for (let i = 0; i < letterPaths.length; i++) {
      const current = letterPaths[i];
      
      if (current.length > 0) {
          // Add current letter path
          for(let p=0; p<current.length; p++) combinedPath.push(current[p]);
      }

      if (i < letterPaths.length - 1) {
          const next = letterPaths[i+1];
          // Determine if we need to jump to next letter
          // Only jump if both current and next have content
          if (current.length > 0 && next.length > 0) {
             
              // Smart Letter Stitching
              // Connect from the "Right-most/Bottom-most" part of the previous letter
              // to the "Left-most/Bottom-most" part of the next letter.
              
              // 1. Find optimal Exit Point (Bottom-Right preference)
              let exitP = current[current.length-1];
              let exitIdx = current.length - 1;
              let maxScore = -Infinity;
              
              for (let k = 0; k < current.length; k++) {
                  const p = current[k];
                  const score = p.x + p.y; // Prefer Bottom-Right
                  if (score > maxScore) { maxScore = score; exitP = p; exitIdx = k; }
              }
              
              // 2. Find optimal Entry Point (Bottom-Left preference)
              let entryP = next[0];
              let entryIdx = 0;
              let maxEntryScore = -Infinity;
              
              for (let k = 0; k < next.length; k++) {
                  const p = next[k];
                  const score = p.y - p.x; // Prefer Bottom-Left
                  if (score > maxEntryScore) { maxEntryScore = score; entryP = p; entryIdx = k; }
              }
              
              // 3. Retrace Previous to Exit Point
              // If the trace didn't end at the exit point, walk backwards along the ink
              if (exitIdx !== current.length - 1) {
                  for (let k = current.length - 2; k >= exitIdx; k--) {
                      combinedPath.push(current[k]);
                  }
              }
              
              // 4. Bridge (Exit -> Entry)
              const bridge = interpolatePoints(exitP, entryP);
              for(let b=0; b<bridge.length; b++) combinedPath.push(bridge[b]);
              
              // 5. Retrace Next from Entry Point to Start
              // If we aren't entering at the start of the next stroke, walk backwards from entry to start
              // This effectively "hides" the travel line inside the next letter's stroke
              if (entryIdx > 0) {
                   for (let k = entryIdx - 1; k >= 0; k--) {
                       combinedPath.push(next[k]);
                   }
              }
          }
      }
      
      // Record the break point (end index of this letter + connection)
      letterBreaks.push(combinedPath.length);
  }
  
  // Center everything
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
  
  const smooth = smoothPath(combinedPath, 3);
  
  if (smooth.length < 2) return { points: [{re:0, im:0}], letterBreaks: [] };
  
  // Calculate total length
  let totalLen = 0;
  const lens = [0];
  for(let i=0; i<smooth.length-1; i++){
      const d = Math.sqrt((smooth[i+1].x - smooth[i].x)**2 + (smooth[i+1].y - smooth[i].y)**2);
      totalLen += d;
      lens.push(totalLen);
  }
  
  // Adaptive point count
  const pointCount = Math.min(4096, Math.max(2048, Math.floor(totalLen)));
  
  // Map letter breaks from original path to resampled path
  // original index -> length -> t -> resampled index
  const resampledBreaks: number[] = [];
  
  for(let i=0; i<pointCount; i++){
      const t = (i / pointCount) * totalLen;
      
      // Interpolate position
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
  }

  // Convert letterBreaks (indices in combinedPath) to resampled indices
  for (let b of letterBreaks) {
      if (b >= combinedPath.length) b = combinedPath.length - 1;
      const lenAtBreak = lens[Math.min(b, lens.length-1)];
      const ratio = lenAtBreak / totalLen;
      resampledBreaks.push(Math.floor(ratio * pointCount));
  }

  return { points: resampledPoints, letterBreaks: resampledBreaks };
}
