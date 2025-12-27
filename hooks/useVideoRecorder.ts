
import React, { useState, useRef } from 'react';

export interface ExportSettings {
  width: number;
  height: number;
  mimeType: string;
  fps: number;
}

export const useVideoRecorder = (
    text: string, 
    canvasRef: React.RefObject<HTMLCanvasElement | null>,
    onExportStart: (settings: ExportSettings) => void,
    onExportEnd: () => void
) => {
    const [isExporting, setIsExporting] = useState(false);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const recordedChunksRef = useRef<Blob[]>([]);

    const startRecording = (settings: ExportSettings) => {
        onExportStart(settings);
        
        // Timeout to allow state updates (canvas resize) to take effect before capturing stream
        setTimeout(() => {
            if (!canvasRef.current) return;
            
            const stream = canvasRef.current.captureStream(settings.fps);
            const recorder = new MediaRecorder(stream, { 
                mimeType: settings.mimeType, 
                videoBitsPerSecond: 12000000 
            });
            
            recordedChunksRef.current = [];
            
            recorder.ondataavailable = (event) => { 
                if (event.data.size > 0) recordedChunksRef.current.push(event.data); 
            };
            
            recorder.onstop = () => {
                const blob = new Blob(recordedChunksRef.current, { type: settings.mimeType });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a'); 
                a.href = url;
                const ext = settings.mimeType.includes('mp4') ? 'mp4' : 'webm';
                a.download = `harmonic-ink-${text.replace(/\s+/g, '-')}.${ext}`;
                a.click(); 
                URL.revokeObjectURL(url);
                
                setIsExporting(false);
                onExportEnd();
            };
            
            mediaRecorderRef.current = recorder;
            recorder.start();
            setIsExporting(true); 
        }, 500);
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current?.state === 'recording') {
            mediaRecorderRef.current.stop();
        }
    };

    return { isExporting, startRecording, stopRecording };
};
