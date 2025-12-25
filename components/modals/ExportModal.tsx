
import React, { useState, useEffect } from 'react';

export interface ExportSettings {
  width: number;
  height: number;
  mimeType: string;
  fps: number;
}

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExport: (settings: ExportSettings) => void;
}

const RESOLUTIONS = [
  { label: 'HD (720p)', width: 1280, height: 720 },
  { label: 'Full HD (1080p)', width: 1920, height: 1080 },
  { label: '4K (2160p)', width: 3840, height: 2160 },
];

const FRAMERATES = [30, 60];

const ExportModal: React.FC<ExportModalProps> = ({ isOpen, onClose, onExport }) => {
  const [selectedResIdx, setSelectedResIdx] = useState(1);
  const [selectedFps, setSelectedFps] = useState(60);
  const [selectedFormat, setSelectedFormat] = useState('');
  const [supportedFormats, setSupportedFormats] = useState<{label: string, value: string}[]>([]);

  useEffect(() => {
    // Detect supported formats
    const types = [
      { label: 'WebM (VP9) - High Quality', value: 'video/webm;codecs=vp9' },
      { label: 'WebM (VP8)', value: 'video/webm;codecs=vp8' },
      { label: 'MP4 (H.264)', value: 'video/mp4;codecs=avc1.42E01E' }, // Common for Safari
      { label: 'MP4 (Standard)', value: 'video/mp4' },
    ];

    const supported = types.filter(t => MediaRecorder.isTypeSupported(t.value));
    
    // Fallback if generic webm works but specific codecs don't
    if (supported.length === 0 && MediaRecorder.isTypeSupported('video/webm')) {
        supported.push({ label: 'WebM (Standard)', value: 'video/webm' });
    }

    setSupportedFormats(supported);
    if (supported.length > 0) setSelectedFormat(supported[0].value);
  }, []);

  if (!isOpen) return null;

  const handleExportClick = () => {
    const res = RESOLUTIONS[selectedResIdx];
    onExport({
      width: res.width,
      height: res.height,
      mimeType: selectedFormat,
      fps: selectedFps
    });
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-slate-950 border border-white/20 rounded-3xl p-6 md:p-8 max-w-md w-full shadow-2xl relative overflow-hidden ring-1 ring-white/10 z-50">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyan-500 to-emerald-500"></div>
        
        <h2 className="text-2xl font-black text-white uppercase tracking-tighter mb-6">Export Video</h2>
        
        <div className="space-y-6">
          {/* Resolution */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Quality / Resolution</label>
            <div className="grid grid-cols-1 gap-2">
              {RESOLUTIONS.map((res, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedResIdx(idx)}
                  className={`px-4 py-3 rounded-xl text-left border transition-all flex justify-between items-center ${
                    selectedResIdx === idx 
                      ? 'bg-cyan-500/20 border-cyan-500 text-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.2)]' 
                      : 'bg-slate-900 border-white/5 text-slate-400 hover:bg-slate-800'
                  }`}
                >
                  <span className="font-bold text-sm">{res.label}</span>
                  <span className="text-xs font-mono opacity-50">{res.width}x{res.height}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Format */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Format</label>
            <select 
                value={selectedFormat}
                onChange={(e) => setSelectedFormat(e.target.value)}
                className="w-full bg-slate-900 border border-white/10 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-cyan-500 appearance-none"
            >
                {supportedFormats.map(f => (
                    <option key={f.value} value={f.value} className="bg-slate-950">{f.label}</option>
                ))}
            </select>
          </div>

          {/* FPS */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Frame Rate</label>
            <div className="flex gap-2">
                {FRAMERATES.map(fps => (
                    <button
                        key={fps}
                        onClick={() => setSelectedFps(fps)}
                        className={`flex-1 py-2 rounded-xl text-xs font-black uppercase tracking-widest border ${
                            selectedFps === fps 
                            ? 'bg-white text-slate-950 border-white' 
                            : 'bg-transparent text-slate-500 border-white/10 hover:border-white/30'
                        }`}
                    >
                        {fps} FPS
                    </button>
                ))}
            </div>
          </div>
        </div>

        <div className="flex gap-3 mt-8">
          <button 
            onClick={onClose}
            className="flex-1 px-4 py-3 rounded-xl font-bold text-xs uppercase tracking-widest text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
          >
            Cancel
          </button>
          <button 
            onClick={handleExportClick}
            className="flex-1 px-4 py-3 rounded-xl font-bold text-xs uppercase tracking-widest bg-gradient-to-r from-cyan-500 to-emerald-500 text-slate-950 hover:opacity-90 transition-opacity shadow-lg shadow-cyan-500/20"
          >
            Start Export
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExportModal;
