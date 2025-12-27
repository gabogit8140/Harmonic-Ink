
import { Point } from '../../types';

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
            // Strict 8-connectivity (radius 1)
            for (let dy = -1; dy <= 1; dy++) {
                for (let dx = -1; dx <= 1; dx++) {
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

/**
 * Traces a component by establishing a "Backbone" from the Entry (Left) to Exit (Right) point.
 * Side branches off the backbone are traced using DFS and retraced to maintain continuity.
 * This ensures the path ends at the exit point, facilitating connections to the next letter.
 */
export function traceComponent(pixels: Point[], startPointHint?: Point): Point[] {
    if (pixels.length === 0) return [];

    // 1. Build Adjacency Graph
    const graph = new Map<string, Point[]>();
    const pixelMap = new Map<string, Point>();
    
    pixels.forEach(p => {
        const key = `${p.x},${p.y}`;
        graph.set(key, []);
        pixelMap.set(key, p);
    });
    
    pixels.forEach(p => {
        const key = `${p.x},${p.y}`;
        const neighbors = graph.get(key)!;
        
        for (let dy = -1; dy <= 1; dy++) {
            for (let dx = -1; dx <= 1; dx++) {
                if (dx === 0 && dy === 0) continue;
                const nKey = `${p.x + dx},${p.y + dy}`;
                if (pixelMap.has(nKey)) {
                    neighbors.push(pixelMap.get(nKey)!);
                }
            }
        }
    });

    // 2. Determine Entry (Start) and Exit (End)
    
    // Start: Closest to hint, or Left-most
    let startNode = pixels[0];
    if (startPointHint) {
        let minD = Infinity;
        for (const p of pixels) {
            const d = (p.x - startPointHint.x)**2 + (p.y - startPointHint.y)**2;
            if (d < minD) {
                minD = d;
                startNode = p;
            }
        }
    } else {
        let minX = Infinity;
        for(const p of pixels) {
            if(p.x < minX) {
                minX = p.x;
                startNode = p;
            }
        }
    }

    // End: Right-most (Max X) - heuristic for cursive flow
    let endNode = pixels[0];
    let maxX = -Infinity;
    for(const p of pixels) {
        if (p.x > maxX) {
            maxX = p.x;
            endNode = p;
        }
    }
    
    // Fallback if single pixel or weird vertical shape
    if (startNode === endNode && pixels.length > 1) {
         let maxD = -1;
         for(const p of pixels) {
             const d = (p.x - startNode.x)**2 + (p.y - startNode.y)**2;
             if (d > maxD) {
                 maxD = d;
                 endNode = p;
             }
         }
    }

    // 3. Find Backbone (Shortest Path BFS)
    const backbone = findPathBFS(startNode, endNode, graph);
    
    // Fallback for disjoint graphs (though component should be connected)
    if (!backbone) {
        return traceDFS(startNode, graph, new Set());
    }

    // 4. Traverse Backbone & Branches
    const path: Point[] = [];
    const visited = new Set<string>();
    
    // Pre-mark backbone nodes in visited so branches don't consume the highway ahead of time?
    // Actually no, we want to traverse branches when we reach the junction. 
    // We just need to make sure `traceDFS` doesn't run down the backbone.
    // So we mark the WHOLE backbone as 'visited' in the set passed to traceDFS?
    // No, because traceDFS stops at visited nodes. If we mark future backbone nodes, traceDFS won't go there. Correct.
    backbone.forEach(p => visited.add(`${p.x},${p.y}`));

    for (let i = 0; i < backbone.length; i++) {
        const curr = backbone[i];
        
        // Add step on backbone
        path.push({...curr, penDown: true});
        
        // Look for unvisited neighbors (Branches)
        const neighbors = graph.get(`${curr.x},${curr.y}`) || [];
        
        // Sort neighbors by some heuristic? (e.g. Y) - optional
        
        for (const n of neighbors) {
            const nKey = `${n.x},${n.y}`;
            if (!visited.has(nKey)) {
                // It's a branch. Trace it out and back.
                const branchPath = traceDFS(n, graph, visited);
                path.push(...branchPath);
                // Retrace back to current backbone node to maintain continuity
                path.push({...curr, penDown: true});
            }
        }
    }

    return path;
}

// DFS that traces a subgraph and returns to start (visually)
function traceDFS(start: Point, graph: Map<string, Point[]>, visited: Set<string>): Point[] {
    const path: Point[] = [];
    
    function dfs(u: Point) {
        visited.add(`${u.x},${u.y}`);
        path.push({...u, penDown: true});
        
        const neighbors = graph.get(`${u.x},${u.y}`) || [];
        for (const v of neighbors) {
            if (!visited.has(`${v.x},${v.y}`)) {
                dfs(v);
                // Backtrack step: simulate pen moving back
                path.push({...u, penDown: true});
            }
        }
    }
    
    dfs(start);
    return path;
}

// Simple BFS for shortest path
function findPathBFS(start: Point, end: Point, graph: Map<string, Point[]>): Point[] | null {
    if (start === end) return [start];
    
    const queue: Point[] = [start];
    const parent = new Map<string, Point>();
    const visited = new Set<string>([`${start.x},${start.y}`]);
    
    while(queue.length > 0) {
        const u = queue.shift()!;
        if (u === end) {
            // Reconstruct path
            const path: Point[] = [];
            let curr: Point | undefined = end;
            while(curr) {
                path.unshift(curr);
                curr = parent.get(`${curr.x},${curr.y}`);
            }
            return path;
        }
        
        const neighbors = graph.get(`${u.x},${u.y}`) || [];
        for(const v of neighbors) {
            const key = `${v.x},${v.y}`;
            if(!visited.has(key)) {
                visited.add(key);
                parent.set(key, u);
                queue.push(v);
            }
        }
    }
    return null;
}
