import React, { useRef, useState, useEffect } from 'react';

interface ScratchpadModalProps {
  isOpen: boolean;
  onClose: () => void;
  subjectCode: string;
}

// Module-level caches to preserve student calculations across modal toggles
const scratchpadDrawingCache: Record<string, string> = {};
const scratchpadNotesCache: Record<string, string> = {};

export const ScratchpadModal: React.FC<ScratchpadModalProps> = ({ isOpen, onClose, subjectCode }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [mode, setMode] = useState<'pen' | 'eraser'>('pen');
  const [color, setColor] = useState('#00288e');
  const [lineWidth, setLineWidth] = useState(3);
  const [notes, setNotes] = useState(() => scratchpadNotesCache[subjectCode] || '');

  useEffect(() => {
    if (!isOpen) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas dimensions based on client rect without wiping if already set
    const rect = canvas.getBoundingClientRect();
    const newWidth = rect.width * 2;
    const newHeight = rect.height * 2;

    if (canvas.width !== newWidth || canvas.height !== newHeight) {
      canvas.width = newWidth;
      canvas.height = newHeight;
    }

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.scale(2, 2);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // Restore cached drawing if available
    const cachedData = scratchpadDrawingCache[subjectCode];
    if (cachedData) {
      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, 0, 0, rect.width, rect.height);
      };
      img.src = cachedData;
    }
  }, [isOpen, subjectCode]);

  if (!isOpen) return null;

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    const x = clientX - rect.left;
    const y = clientY - rect.top;

    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    const x = clientX - rect.left;
    const y = clientY - rect.top;

    if (mode === 'eraser') {
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = lineWidth * 3;
    } else {
      ctx.strokeStyle = color;
      ctx.lineWidth = lineWidth;
    }

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
    const canvas = canvasRef.current;
    if (canvas) {
      try {
        scratchpadDrawingCache[subjectCode] = canvas.toDataURL();
      } catch {}
    }
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    delete scratchpadDrawingCache[subjectCode];
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-[#c4c5d5]/60 overflow-hidden flex flex-col h-[85vh] animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="bg-[#131b2e] text-white px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[20px] text-[#85f8c4]">draw</span>
            <div>
              <h3 className="text-sm font-bold flex items-center gap-2">
                Digital Calculation Scratchpad
                <span className="text-[10px] bg-white/20 text-white px-1.5 py-0.5 rounded font-mono">
                  {subjectCode}
                </span>
              </h3>
              <p className="text-[11px] text-slate-300">Rough work space • Auto-cleared on submission</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-white/10 text-white transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        {/* Toolbar */}
        <div className="px-3 py-2 bg-[#f2f3ff] border-b border-[#c4c5d5]/50 flex items-center justify-between flex-wrap gap-2 text-xs">
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setMode('pen')}
              className={`px-2.5 py-1 rounded-lg font-medium flex items-center gap-1 transition-colors ${
                mode === 'pen' ? 'bg-[#00288e] text-white' : 'bg-white text-[#444653] hover:bg-slate-100'
              }`}
            >
              <span className="material-symbols-outlined text-[15px]">edit</span>
              <span>Pen</span>
            </button>
            <button
              onClick={() => setMode('eraser')}
              className={`px-2.5 py-1 rounded-lg font-medium flex items-center gap-1 transition-colors ${
                mode === 'eraser' ? 'bg-[#00288e] text-white' : 'bg-white text-[#444653] hover:bg-slate-100'
              }`}
            >
              <span className="material-symbols-outlined text-[15px]">ink_eraser</span>
              <span>Eraser</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              {['#00288e', '#059669', '#dc2626', '#131b2e'].map((c) => (
                <button
                  key={c}
                  onClick={() => {
                    setColor(c);
                    setMode('pen');
                  }}
                  className={`w-5 h-5 rounded-full border-2 transition-transform ${
                    color === c && mode === 'pen' ? 'scale-125 border-slate-900 ring-2 ring-blue-300' : 'border-white'
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>

            <button
              onClick={clearCanvas}
              className="px-2.5 py-1 rounded-lg border border-[#c4c5d5] bg-white text-[#ba1a1a] hover:bg-red-50 text-[11px] font-semibold flex items-center gap-1 transition-colors"
            >
              <span className="material-symbols-outlined text-[14px]">delete</span>
              <span>Clear</span>
            </button>
          </div>
        </div>

        {/* Canvas Area */}
        <div className="flex-1 relative bg-white overflow-hidden cursor-crosshair">
          <canvas
            ref={canvasRef}
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
            onTouchStart={startDrawing}
            onTouchMove={draw}
            onTouchEnd={stopDrawing}
            className="w-full h-full touch-none"
          />
          <div className="absolute bottom-2 right-2 text-[10px] text-slate-400 pointer-events-none font-mono">
            Encrypted Workspace Buffer
          </div>
        </div>

        {/* Quick Text Notes Drawer */}
        <div className="p-3 bg-[#faf8ff] border-t border-[#c4c5d5]/50 flex flex-col gap-1.5">
          <label className="text-[11px] font-semibold text-[#444653] flex items-center justify-between">
            <span>Quick Text Memo / Formula Jots:</span>
            <span className="text-[10px] text-slate-400 font-normal">Optional</span>
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Type quick formula notes (e.g. DAG relaxation order: u in TopoSort -> relax(u, v))..."
            rows={2}
            className="w-full text-xs p-2 rounded-lg border border-[#c4c5d5] bg-white focus:ring-1 focus:ring-[#00288e] resize-none outline-none font-mono"
          />
        </div>

        {/* Footer */}
        <div className="p-2.5 bg-white border-t border-[#c4c5d5]/40 flex justify-end">
          <button
            onClick={onClose}
            className="py-1.5 px-4 rounded-xl bg-[#00288e] text-white text-xs font-semibold hover:bg-[#1e40af] transition-colors"
          >
            Done / Return to Exam
          </button>
        </div>
      </div>
    </div>
  );
};
