
/**
 * Zhang-Suen Thinning Algorithm
 * Thins a binary image to a 1-pixel wide skeleton.
 */
export function thin(pixels: Uint8Array, w: number, h: number): Uint8Array {
  const p = pixels;
  let diff = true;
  
  const get = (x: number, y: number) => (x >= 0 && x < w && y >= 0 && y < h) ? p[y * w + x] : 0;
  const set = (x: number, y: number, v: number) => p[y * w + x] = v;

  while (diff) {
     diff = false;
     const markers: {x: number, y: number}[] = [];

     // Pass 1
     for (let y = 1; y < h - 1; y++) {
        for (let x = 1; x < w - 1; x++) {
           if (p[y * w + x] === 0) continue;
           
           const P2 = get(x, y-1);
           const P3 = get(x+1, y-1);
           const P4 = get(x+1, y);
           const P5 = get(x+1, y+1);
           const P6 = get(x, y+1);
           const P7 = get(x-1, y+1);
           const P8 = get(x-1, y);
           const P9 = get(x-1, y-1);

           const A = (P2 === 0 && P3 === 1 ? 1 : 0) + 
                     (P3 === 0 && P4 === 1 ? 1 : 0) + 
                     (P4 === 0 && P5 === 1 ? 1 : 0) + 
                     (P5 === 0 && P6 === 1 ? 1 : 0) + 
                     (P6 === 0 && P7 === 1 ? 1 : 0) + 
                     (P7 === 0 && P8 === 1 ? 1 : 0) + 
                     (P8 === 0 && P9 === 1 ? 1 : 0) + 
                     (P9 === 0 && P2 === 1 ? 1 : 0);
           
           const B = P2 + P3 + P4 + P5 + P6 + P7 + P8 + P9;
           
           const m1 = P2 * P4 * P6;
           const m2 = P4 * P6 * P8;

           if (A === 1 && (B >= 2 && B <= 6) && m1 === 0 && m2 === 0) {
              markers.push({x,y});
           }
        }
     }
     
     if (markers.length > 0) {
        diff = true;
        markers.forEach(m => set(m.x, m.y, 0));
     }

     // Pass 2
     const markers2: {x: number, y: number}[] = [];
     for (let y = 1; y < h - 1; y++) {
        for (let x = 1; x < w - 1; x++) {
           if (p[y * w + x] === 0) continue;
           
           const P2 = get(x, y-1);
           const P3 = get(x+1, y-1);
           const P4 = get(x+1, y);
           const P5 = get(x+1, y+1);
           const P6 = get(x, y+1);
           const P7 = get(x-1, y+1);
           const P8 = get(x-1, y);
           const P9 = get(x-1, y-1);

           const A = (P2 === 0 && P3 === 1 ? 1 : 0) + 
                     (P3 === 0 && P4 === 1 ? 1 : 0) + 
                     (P4 === 0 && P5 === 1 ? 1 : 0) + 
                     (P5 === 0 && P6 === 1 ? 1 : 0) + 
                     (P6 === 0 && P7 === 1 ? 1 : 0) + 
                     (P7 === 0 && P8 === 1 ? 1 : 0) + 
                     (P8 === 0 && P9 === 1 ? 1 : 0) + 
                     (P9 === 0 && P2 === 1 ? 1 : 0);
           
           const B = P2 + P3 + P4 + P5 + P6 + P7 + P8 + P9;
           
           const m1 = P2 * P4 * P8;
           const m2 = P2 * P6 * P8;

           if (A === 1 && (B >= 2 && B <= 6) && m1 === 0 && m2 === 0) {
              markers2.push({x,y});
           }
        }
     }
     
     if (markers2.length > 0) {
        diff = true;
        markers2.forEach(m => set(m.x, m.y, 0));
     }
  }
  return p;
}
