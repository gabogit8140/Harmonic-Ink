
import { Point } from '../../types';
import { interpolatePoints } from '../geometry';

export function getConnectedComponents(pixels: Point[]): Point[][] {
    const pixelSet = new Map<string, Point>();
    pixels.forEach(p => pixelSet.set(`${p.x},${p.y}`, p));

    const components: Point[][] = [];
    const visited = new Set<string>();

    for (const p of pixels) {
        const key = `${p.x},${p.y}`;
        if (visited.has(key)) continue;

        const component: Point[] = [];
        const queue: Point[] = [p];
        visited.add(key);
        component.push(p);

        while(queue.length > 0) {
            const curr = queue.shift()!;
            // Search radius 2 (5x5 kernel) to bridge small gaps (1-2 pixels) from thinning artifacts
            for (let dy = -2; dy <= 2; dy++) {
                for (let dx = -2; dx <= 2; dx++) {
                    if (dx === 0 && dy === 0) continue;
                    const nx = curr.x + dx;
                    const ny = curr.y + dy;
                    const nKey = `${nx},${ny}`;
                    
                    if (pixelSet.has(nKey) && !visited.has(nKey)) {
                        visited.add(nKey);
                        const np = pixelSet.get(nKey)!;
                        component.push(np);
                        queue.push(np);
                    }
                }
            }
        }
        components.push(component);
    }
    return components;
}

export function traceComponent(pixels: Point[], startPoint?: Point): Point[] {
    if (pixels.length === 0) return [];
    
    // Determine start point
    let currIdx = 0;
    if (startPoint) {
        let minD = Infinity;
        let bestStartIdx = 0;
        for(let i=0; i<pixels.length; i++) {
            const d = (pixels[i].x - startPoint.x)**2 + (pixels[i].y - startPoint.y)**2;
            if (d < minD) {
                minD = d;
                bestStartIdx = i;
            }
        }
        currIdx = bestStartIdx;
    } else {
        // Default start: Left-most, Top-most
        let minX = Infinity;
        let best = 0;
        for(let i=0; i<pixels.length; i++){
            if (pixels[i].x < minX) {
                minX = pixels[i].x;
                best = i;
            }
        }
        currIdx = best;
    }

    const visited = new Set<number>();
    const path: Point[] = [pixels[currIdx]];
    visited.add(currIdx);
    
    // Allow generous steps for extensive backtracking
    const maxSteps = pixels.length * 100; 
    let steps = 0;
    
    // Connectivity threshold squared. Radius 2 implies max dist sq = 8.
    // We use 16 (4px) to be robust against diagonal gaps.
    const neighborThreshold = 16;

    // Backtracking walk
    while(visited.size < pixels.length && steps < maxSteps) {
        steps++;
        const currentTip = path[path.length - 1];
        
        // 1. Look for immediate unvisited neighbors (continuous stroke)
        let bestIdx = -1;
        let minD = Infinity;

        for(let i=0; i<pixels.length; i++) {
            if(visited.has(i)) continue;
            
            const dx = pixels[i].x - currentTip.x;
            const dy = pixels[i].y - currentTip.y;
            const d = dx*dx + dy*dy;
            
            if (d <= neighborThreshold) {
                 if (d < minD) {
                     minD = d;
                     bestIdx = i;
                 }
            }
        }

        if (bestIdx !== -1) {
            // Found connected neighbor
            visited.add(bestIdx);
            path.push(pixels[bestIdx]);
        } else {
            // 2. Dead end. Try Backtracking.
            // Find the most recent point in path that has an unvisited neighbor.
            let backtrackPathIndex = -1;
            let branchNeighborIdx = -1;
            
            for (let i = path.length - 2; i >= 0; i--) {
                const p = path[i];
                let found = false;
                for (let j = 0; j < pixels.length; j++) {
                    if (visited.has(j)) continue;
                    const dx = pixels[j].x - p.x;
                    const dy = pixels[j].y - p.y;
                    const d = dx*dx + dy*dy;
                    if (d <= neighborThreshold) {
                        backtrackPathIndex = i;
                        branchNeighborIdx = j;
                        found = true;
                        break;
                    }
                }
                if (found) break;
            }

            if (backtrackPathIndex !== -1) {
                // Retrace: Append points from current tip back to the branch point
                for (let k = path.length - 2; k >= backtrackPathIndex; k--) {
                    path.push(path[k]);
                }
                
                // Add the new neighbor
                visited.add(branchNeighborIdx);
                path.push(pixels[branchNeighborIdx]);
            } else {
                // 3. Smart Jump with Retracing
                // If the skeleton is fragmented, we must jump.
                // To avoid ugly diagonal lines across the letter, we look for the 
                // closest pair of points between the ENTIRE existing path and the REMAINING unvisited pixels.
                // We then retrace along the path to that launch point and jump.

                let bestUnvisitedIdx = -1;
                let bestPathIdx = -1;
                let minJumpDist = Infinity;

                const unvisitedIndices: number[] = [];
                for(let i=0; i<pixels.length; i++) {
                    if(!visited.has(i)) unvisitedIndices.push(i);
                }

                if (unvisitedIndices.length === 0) break;

                for (const uIdx of unvisitedIndices) {
                    const pUnvisited = pixels[uIdx];
                    // Search backwards from tip to find closest launch point
                    // Limiting search could optimize, but accuracy is preferred here.
                    for (let i = path.length - 1; i >= 0; i--) {
                        const pPath = path[i];
                        const d = (pUnvisited.x - pPath.x)**2 + (pUnvisited.y - pPath.y)**2;
                        if (d < minJumpDist) {
                            minJumpDist = d;
                            bestUnvisitedIdx = uIdx;
                            bestPathIdx = i;
                        }
                    }
                }
                
                if (bestUnvisitedIdx !== -1) {
                    // Retrace from tip to bestPathIdx
                    for (let k = path.length - 2; k >= bestPathIdx; k--) {
                        path.push(path[k]);
                    }
                    
                    // Bridge
                    const bridge = interpolatePoints(path[path.length-1], pixels[bestUnvisitedIdx]);
                    for(let b=0; b<bridge.length; b++) path.push(bridge[b]);
                    
                    visited.add(bestUnvisitedIdx);
                    path.push(pixels[bestUnvisitedIdx]);
                } else {
                    break;
                }
            }
        }
    }
    return path;
}
