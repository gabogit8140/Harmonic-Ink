
import { useState, useCallback } from 'react';
import { textToPoints } from '../utils/path';
import { dft, sortCoefficients } from '../utils/fourier';
import { FourierCoefficient, Complex } from '../types';

export const useFourier = () => {
  const [coefficients, setCoefficients] = useState<FourierCoefficient[]>([]);
  const [targetPoints, setTargetPoints] = useState<Complex[]>([]);
  const [letterBreaks, setLetterBreaks] = useState<number[]>([]);
  const [isComputing, setIsComputing] = useState(false);
  const [optimalHarmonics, setOptimalHarmonics] = useState(0);

  const compute = useCallback(async (text: string, font: string): Promise<boolean> => {
    if (!text.trim()) return false;
    setIsComputing(true);
    
    try {
      const result = await textToPoints(text, 1200, 675, font);
      const points = result.points;
      
      if (points.length > 0) {
        setTargetPoints(points);
        setLetterBreaks(result.letterBreaks);
        
        // Mirror the path to create a seamless loop for DFT (A -> B -> A)
        // This effectively removes the discontinuity between Start and End,
        // eliminating Gibbs phenomenon (ringing/wild oscillations).
        const reversed = [...points].reverse();
        const closedPoints = [...points, ...reversed];

        const coeffs = dft(closedPoints);
        const sorted = sortCoefficients(coeffs);

        // Calculate optimal harmonics:
        // Find the number of coefficients needed to retain 99.9% of the signal energy.
        // This provides the best balance: removing high-frequency noise/overhead while keeping visual fidelity.
        let totalEnergy = 0;
        for (const c of sorted) {
            totalEnergy += c.amp * c.amp;
        }

        let currentEnergy = 0;
        let optimal = sorted.length;
        const threshold = 0.999 * totalEnergy;

        for (let i = 0; i < sorted.length; i++) {
            currentEnergy += sorted[i].amp * sorted[i].amp;
            if (currentEnergy >= threshold) {
                optimal = i + 1;
                break;
            }
        }

        setCoefficients(sorted);
        setOptimalHarmonics(optimal);
        return true;
      }
    } catch (err) {
      console.error("Compute Error:", err);
    } finally {
      setIsComputing(false);
    }
    return false;
  }, []);

  const reset = useCallback(() => {
    setCoefficients([]);
    setTargetPoints([]);
    setLetterBreaks([]);
    setOptimalHarmonics(0);
  }, []);

  return { 
    coefficients, 
    targetPoints,
    letterBreaks,
    isComputing, 
    compute,
    reset,
    optimalHarmonics
  };
};
