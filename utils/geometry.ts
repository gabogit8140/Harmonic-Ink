
import { Point } from '../types';

export function interpolatePoints(p1: Point, p2: Point): Point[] {
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    const dist = Math.sqrt(dx*dx + dy*dy);
    if (!isFinite(dist)) return [];

    const steps = Math.ceil(dist);
    const points: Point[] = [];
    
    if (steps === 0) return points;

    for (let i = 1; i <= steps; i++) {
        const t = i / steps;
        points.push({
            x: p1.x + dx * t,
            y: p1.y + dy * t
        });
    }
    return points;
}

export function smoothPath(points: Point[], iterations: number = 2): Point[] {
  if (points.length < 3) return points;
  let current = points;
  
  for (let k = 0; k < iterations; k++) {
    const next: Point[] = [current[0]];
    for (let i = 1; i < current.length - 1; i++) {
       const prev = current[i - 1];
       const curr = current[i];
       const nxt = current[i + 1];
       
       // Handle penDown averaging. If any point in the neighborhood is penUp (false), 
       // the result leans towards penUp. Threshold 0.5.
       // However, to keep it simple, if the segment is a transition, we maintain continuity.
       // Let's just pass the middle point's penDown mostly.
       const pDown = curr.penDown !== false; // default true
       
       next.push({
         x: prev.x * 0.25 + curr.x * 0.5 + nxt.x * 0.25,
         y: prev.y * 0.25 + curr.y * 0.5 + nxt.y * 0.25,
         penDown: pDown
       });
    }
    next.push(current[current.length - 1]);
    current = next;
  }
  return current;
}
