
import { useRef } from 'react';

export const useVisualizerCamera = () => {
    const cameraRef = useRef({ zoom: 0.9, x: 0, y: 0 });
    const cameraTimeRef = useRef(0);

    const updateCamera = (
        shouldRun: boolean,
        penX: number,
        penY: number,
        isComplete: boolean,
        numHarmonics: number
    ) => {
        let targetZoom = 0.9;
        let targetCamX = 0;
        let targetCamY = 0;
        const lerpSpeed = 0.08; 

        if (shouldRun) {
           cameraTimeRef.current += 0.01;
           const normalizedOsc = (Math.sin(cameraTimeRef.current * 0.8) + 1) / 2;
           // Higher power for sharper zoom peaks
           const zoomCurve = Math.pow(normalizedOsc, 4.0); 
           // Calculate max zoom based on complexity
           const maxZoomCeiling = Math.min(350, 60 + numHarmonics * 0.4); 
           
           targetZoom = 0.8 + (maxZoomCeiling - 0.8) * zoomCurve;
           targetCamX = penX; 
           targetCamY = penY;
        } else if (isComplete) {
           targetZoom = 0.9; 
           targetCamX = 0; 
           targetCamY = 0;
        }

        // Smooth interpolation
        cameraRef.current.zoom += (targetZoom - cameraRef.current.zoom) * lerpSpeed;
        cameraRef.current.x += (targetCamX - cameraRef.current.x) * lerpSpeed;
        cameraRef.current.y += (targetCamY - cameraRef.current.y) * lerpSpeed;
        
        return cameraRef.current;
    };

    const resetCamera = () => {
        cameraRef.current = { zoom: 0.9, x: 0, y: 0 };
        cameraTimeRef.current = 0;
    };

    return { cameraRef, updateCamera, resetCamera };
};
