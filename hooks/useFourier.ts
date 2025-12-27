
import { useState, useCallback } from 'react';
import { textToPoints } from '../utils/path';
import { dft, sortCoefficients } from '../utils/fourier';
import { FourierCoefficient, Complex } from '../types';

export const useFourier = () => {
  const [coefficients, setCoefficients] = useState<FourierCoefficient[]>([]);
  const [targetPoints, setTargetPoints] = useState<Complex[]>([]);
  const [penDownPoints, setPenDownPoints] = useState<boolean[]>([]);
  const [letterBreaks, setLetterBreaks] = useState<number[]>([]);
  const [isComputing, setIsComputing] = useState(false);
  const [optimalHarmonics, setOptimalHarmonics] = useState(0);
  const [energyFidelity, setEnergyFidelity] = useState<number[]>([]);

  const compute = useCallback(async (text: string, font: string): Promise<boolean> => {
    if (!text.trim()) return false;
    setIsComputing(true);
    
    try {
      const result = await textToPoints(text, 1200, 675, font);
      const points = result.points;
      
      if (points.length > 0) {
        setTargetPoints(points);
        setPenDownPoints(result.penDown);
        setLetterBreaks(result.letterBreaks);
        
        // Mirror the path to create a seamless loop for DFT (A -> B -> A)
        const reversed = [...points].reverse();
        const closedPoints = [...points, ...reversed];

        const coeffs = dft(closedPoints);
        const sorted = sortCoefficients(coeffs);

        // Calculate cumulative amplitude sum for fidelity reporting.
        // We use Linear Amplitude (not squared) to give high-frequency details more weight.
        // We also exclude the DC component (freq 0) from the fidelity ratio 
        // because it only controls centering, not shape definition.
        
        let totalShapeAmplitude = 0;
        for (const c of sorted) {
            if (c.freq !== 0) {
                totalShapeAmplitude += c.amp;
            }
        }

        let currentShapeAmplitude = 0;
        let optimal = 200; // Initial fallback
        let foundOptimal = false;
        const targetFidelity = 0.90; // User requested 90% default
        const fidelities: number[] = [];

        for (let i = 0; i < sorted.length; i++) {
            if (sorted[i].freq !== 0) {
                currentShapeAmplitude += sorted[i].amp;
            }
            
            const ratio = totalShapeAmplitude > 0 ? (currentShapeAmplitude / totalShapeAmplitude) : 1;
            fidelities.push(ratio);
            
            // Auto-detect the first point where we reach 90% fidelity
            if (!foundOptimal && ratio >= targetFidelity) {
                optimal = i + 1;
                foundOptimal = true;
            }
        }

        // If for some reason 90% isn't found (very simple paths), fallback to a reasonable detail level
        if (!foundOptimal) optimal = Math.min(sorted.length, 150);

        setCoefficients(sorted);
        // Ensure the default never exceeds 500 for UI performance
        setOptimalHarmonics(Math.min(500, optimal));
        setEnergyFidelity(fidelities);
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
    setPenDownPoints([]);
    setLetterBreaks([]);
    setOptimalHarmonics(0);
    setEnergyFidelity([]);
  }, []);

  return { 
    coefficients, 
    targetPoints,
    penDownPoints,
    letterBreaks,
    isComputing, 
    compute,
    reset,
    optimalHarmonics,
    energyFidelity
  };
};
