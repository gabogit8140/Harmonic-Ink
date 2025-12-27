
import { Point, Complex } from '../types';
import { interpolatePoints, smoothPath } from './geometry';

export interface Stroke {
    points: Point[];
    color: string;
}

// Extensive Palette for the Color Picker
export const PALETTE = [
    // Monochrome
    '#ffffff', '#cbd5e1', '#94a3b8', '#64748b',
    // Reds & Pinks
    '#f87171', '#ef4444', '#f472b6', '#ec4899', '#fb7185', '#f43f5e',
    // Oranges & Yellows
    '#fbbf24', '#f59e0b', '#fcd34d', '#fb923c', '#f97316',
    // Greens
    '#34d399', '#10b981', '#a3e635', '#84cc16', '#22c55e',
    // Teals & Cyans
    '#22d3ee', '#06b6d4', '#5eead4', '#14b8a6',
    // Blues
    '#60a5fa', '#3b82f6', '#818cf8', '#6366f1',
    // Purples
    '#a78bfa', '#8b5cf6', '#c084fc', '#a855f7', '#e879f9', '#d946ef'
];

/**
 * Generates a parametric Rose Curve (Flower) with multi-colored petals and a leaf
 */
export function generateDefaultFlower(width: number, height: number): Stroke[] {
    const strokes: Stroke[] = [];
    
    const cx = width / 2;
    const cy = height / 2 * 0.9; // Shift up slightly to make room for stem
    const radius = Math.min(width, height) * 0.3;
    const k = 4; // 8 petals
    
    // Hardcoded neon colors for the flower to ensure it looks good regardless of PALETTE order
    const petalColors = ['#22d3ee', '#f472b6', '#fbbf24', '#a78bfa']; 

    // Generate Petals (Split into segments for coloring)
    const totalPetals = 8;
    const segmentAngle = (Math.PI * 2) / totalPetals;
    
    for (let i = 0; i < totalPetals; i++) {
        const startT = i * segmentAngle;
        const endT = (i + 1) * segmentAngle;
        const points: Point[] = [];
        
        // Add overlap for continuity
        const steps = 50;
        for (let j = 0; j <= steps; j++) {
            const theta = startT + (endT - startT) * (j / steps);
            const r = radius * Math.cos(k * theta);
            points.push({
                x: cx + r * Math.cos(theta),
                y: cy + r * Math.sin(theta),
                penDown: true
            });
        }
        
        strokes.push({
            points: points,
            color: petalColors[i % petalColors.length]
        });
    }

    // Stem
    const stemTop = { x: cx, y: cy + radius * 0.5 }; // Connect near bottom petals
    const stemBottom = { x: cx, y: cy + radius * 2.2 };
    const stemPoints: Point[] = [];
    
    // Curved Stem
    for(let i=0; i<=40; i++) {
        const t = i/40;
        const xOffset = Math.sin(t * Math.PI) * 15;
        stemPoints.push({
            x: cx + xOffset,
            y: stemTop.y + (stemBottom.y - stemTop.y) * t,
            penDown: true
        });
    }
    strokes.push({ points: stemPoints, color: '#34d399' }); // Emerald

    // Leaf
    const leafStartIdx = Math.floor(stemPoints.length * 0.6);
    const leafStart = stemPoints[leafStartIdx];
    const leafPoints: Point[] = [];
    
    const leafLen = radius * 0.6;
    for(let i=0; i<=30; i++) {
        const t = i/30;
        const lx = leafStart.x + t * leafLen;
        const ly = leafStart.y - Math.sin(t * Math.PI) * (leafLen * 0.4) - (t * leafLen * 0.2); 
        leafPoints.push({ x: lx, y: ly, penDown: true });
    }
    for(let i=30; i>=0; i--) {
         const t = i/30;
         const lx = leafStart.x + t * leafLen;
         const ly = leafStart.y + Math.sin(t * Math.PI) * (leafLen * 0.4) - (t * leafLen * 0.2);
         leafPoints.push({ x: lx, y: ly, penDown: true });
    }
    
    strokes.push({ points: leafPoints, color: '#34d399' });

    return strokes;
}

/**
 * Converts user drawn strokes into a single continuous path
 * with interpolated "invisible" lines (penDown: false) for the DFT.
 */
export function strokesToPoints(strokes: Stroke[], width: number, height: number): { points: Complex[], letterBreaks: number[], penDown: boolean[], colors: string[] } {
    if (strokes.length === 0) return { points: [], letterBreaks: [], penDown: [], colors: [] };

    const combinedPath: Point[] = [];
    const combinedColors: string[] = [];
    const strokeBreaks: number[] = [];

    for (let i = 0; i < strokes.length; i++) {
        const stroke = strokes[i];
        if (stroke.points.length === 0) continue;

        // Add current stroke
        const smoothedStroke = smoothPath(stroke.points, 1);
        
        smoothedStroke.forEach(p => {
            combinedPath.push(p);
            combinedColors.push(stroke.color);
        });
        
        // If there is a next stroke, create an invisible bridge
        if (i < strokes.length - 1) {
            const nextStroke = strokes[i + 1];
            if (nextStroke.points.length > 0) {
                const start = smoothedStroke[smoothedStroke.length - 1];
                const end = nextStroke.points[0];
                
                const bridge = interpolatePoints(start, end);
                bridge.forEach(p => {
                    p.penDown = false;
                    combinedPath.push(p);
                    // Bridge color sticks to previous
                    combinedColors.push(stroke.color);
                }); 
            }
        }
        
        // Mark the visual end of this stroke/segment
        strokeBreaks.push(combinedPath.length);
    }

    // Centering and Normalizing
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    combinedPath.forEach(p => {
        if(p.x < minX) minX = p.x;
        if(p.x > maxX) maxX = p.x;
        if(p.y < minY) minY = p.y;
        if(p.y > maxY) maxY = p.y;
    });

    const cx = (minX + maxX) / 2;
    const cy = (minY + maxY) / 2;
    
    const targetScale = 1.0; 
    
    const resampledPoints: Complex[] = [];
    const resampledPenDown: boolean[] = [];
    const resampledColors: string[] = [];

    // Resampling logic
    let totalLen = 0;
    const lens = [0];
    for(let i=0; i<combinedPath.length-1; i++){
        const d = Math.sqrt((combinedPath[i+1].x - combinedPath[i].x)**2 + (combinedPath[i+1].y - combinedPath[i].y)**2);
        totalLen += d;
        lens.push(totalLen);
    }

    const pointCount = Math.min(4096, Math.max(1024, Math.floor(totalLen / 2)));
    const finalBreaks: number[] = [];

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
        
        const p1 = combinedPath[idx];
        const p2 = combinedPath[idx+1] || p1;
        
        resampledPoints.push({
            re: (p1.x + (p2.x - p1.x)*segT - cx) * targetScale,
            im: (p1.y + (p2.y - p1.y)*segT - cy) * targetScale
        });
        
        // Sample color from the nearest original point
        resampledColors.push(combinedColors[idx]);
        
        const pd1 = p1.penDown !== false;
        const pd2 = p2.penDown !== false;
        resampledPenDown.push(pd1 && pd2);
    }

    for (let b of strokeBreaks) {
        if (b >= combinedPath.length) b = combinedPath.length - 1;
        const lenAtBreak = lens[Math.min(b, lens.length-1)];
        const ratio = lenAtBreak / totalLen;
        finalBreaks.push(Math.floor(ratio * pointCount));
    }

    return { points: resampledPoints, letterBreaks: finalBreaks, penDown: resampledPenDown, colors: resampledColors };
}
