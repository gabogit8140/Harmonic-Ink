
import { Complex, FourierCoefficient } from '../types';

export function dft(x: Complex[]): FourierCoefficient[] {
  const X: FourierCoefficient[] = [];
  const N = x.length;
  
  for (let k = 0; k < N; k++) {
    let re = 0;
    let im = 0;
    for (let n = 0; n < N; n++) {
      const phi = (2 * Math.PI * k * n) / N;
      // standard complex multiplication (x+iy)(cos - isin)
      re += x[n].re * Math.cos(phi) + x[n].im * Math.sin(phi);
      im += -x[n].re * Math.sin(phi) + x[n].im * Math.cos(phi);
    }
    re /= N;
    im /= N;

    // Correct frequency mapping:
    // In a standard DFT, indices k > N/2 represent negative frequencies.
    // For smooth visualization, we must use the 'negative' frequency -1 instead of N-1.
    let freq = k;
    if (freq > N / 2) {
      freq -= N;
    }

    const amp = Math.sqrt(re * re + im * im);
    const phase = Math.atan2(im, re);

    X.push({ re, im, freq, amp, phase });
  }
  return X;
}

/**
 * Sorts coefficients so that larger epicycles are drawn first (better visual effect).
 * We keep frequency 0 (the offset) first, then sort the rest by amplitude.
 */
export function sortCoefficients(coeffs: FourierCoefficient[]): FourierCoefficient[] {
    return [...coeffs].sort((a, b) => b.amp - a.amp);
}

/**
 * Calculates the current point and the epicycle chain for a given time t.
 */
export function calculateFourierPoint(
  coeffs: FourierCoefficient[], 
  t: number
): { x: number, y: number, chain: {x: number, y: number}[] } {
  let x = 0;
  let y = 0;
  const chain: {x: number, y: number}[] = [];
  
  // Chain start
  chain.push({ x: 0, y: 0 });

  for (let i = 0; i < coeffs.length; i++) {
    const c = coeffs[i];
    const valX = c.amp * Math.cos(c.freq * t + c.phase);
    const valY = c.amp * Math.sin(c.freq * t + c.phase);
    x += valX;
    y += valY;
    chain.push({ x, y });
  }
  
  return { x, y, chain };
}
