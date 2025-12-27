
import { useState, useCallback } from 'react';
import { textToPoints } from '../utils/path';
import { strokesToPoints, Stroke } from '../utils/drawing';
import { dft, sortCoefficients } from '../utils/fourier';
import { FourierCoefficient, Complex, Point } from '../types';

export const useFourier = () => {
  const [coefficients, setCoefficients] = useState<FourierCoefficient[]>([]);
  const [targetPoints, setTargetPoints] = useState<Complex[]>([]);
  const [penDownPoints, setPenDownPoints] = useState<boolean[]>([]);
  const [pointColors, setPointColors] = useState<string[]>([]);
  const [letterBreaks, setLetterBreaks] = useState<number[]>([]);
  const [isComputing, setIsComputing] = useState(false);
  const [optimalHarmonics, setOptimalHarmonics] = useState(0);
  const [energyFidelity, setEnergyFidelity] = useState<number[]>([]);

  // Helper to process points after generation
  const processPointsToCoeffs = useCallback((points: Complex[], penDown: boolean[], breaks: number[], colors?: string[]) => {
      if (points.length === 0) return false;

      setTargetPoints(points);
      setPenDownPoints(penDown);
      setLetterBreaks(breaks);
      setPointColors(colors || []);
      
      // Mirror the path to create a seamless loop for DFT (A -> B -> A)
      const reversed = [...points].reverse();
      const closedPoints = [...points, ...reversed];

      const coeffs = dft(closedPoints);
      const sorted = sortCoefficients(coeffs);

      // Fidelity Calculation (Linear Amplitude)
      let totalShapeAmplitude = 0;
      for (const c of sorted) {
          if (c.freq !== 0) {
              totalShapeAmplitude += c.amp;
          }
      }

      let currentShapeAmplitude = 0;
      let optimal = 200;
      let foundOptimal = false;
      const targetFidelity = 0.90;
      const fidelities: number[] = [];

      for (let i = 0; i < sorted.length; i++) {
          if (sorted[i].freq !== 0) {
              currentShapeAmplitude += sorted[i].amp;
          }
          
          const ratio = totalShapeAmplitude > 0 ? (currentShapeAmplitude / totalShapeAmplitude) : 1;
          fidelities.push(ratio);
          
          if (!foundOptimal && ratio >= targetFidelity) {
              optimal = i + 1;
              foundOptimal = true;
          }
      }

      if (!foundOptimal) optimal = Math.min(sorted.length, 150);

      setCoefficients(sorted);
      setOptimalHarmonics(Math.min(500, optimal));
      setEnergyFidelity(fidelities);
      return true;
  }, []);

  const compute = useCallback(async (text: string, font: string): Promise<boolean> => {
    if (!text.trim()) return false;
    setIsComputing(true);
    
    try {
      const result = await textToPoints(text, 1200, 675, font);
      // For text, we don't have explicit point colors, defaulting to empty will use the "Letter Color" mode in visualizer
      return processPointsToCoeffs(result.points, result.penDown, result.letterBreaks);
    } catch (err) {
      console.error("Compute Error:", err);
    } finally {
      setIsComputing(false);
    }
    return false;
  }, [processPointsToCoeffs]);

  const computeFromStrokes = useCallback((strokes: Stroke[]): boolean => {
      setIsComputing(true);
      try {
          const result = strokesToPoints(strokes, 1200, 675);
          return processPointsToCoeffs(result.points, result.penDown, result.letterBreaks, result.colors);
      } catch (err) {
          console.error("Compute Drawing Error:", err);
      } finally {
          setIsComputing(false);
      }
      return false;
  }, [processPointsToCoeffs]);

  const reset = useCallback(() => {
    setCoefficients([]);
    setTargetPoints([]);
    setPenDownPoints([]);
    setLetterBreaks([]);
    setPointColors([]);
    setOptimalHarmonics(0);
    setEnergyFidelity([]);
  }, []);

  return { 
    coefficients, 
    targetPoints,
    penDownPoints,
    letterBreaks,
    pointColors,
    isComputing, 
    compute,
    computeFromStrokes,
    reset,
    optimalHarmonics,
    energyFidelity
  };
};
