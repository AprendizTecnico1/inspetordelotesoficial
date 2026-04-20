import React, { useState, useRef, useEffect } from 'react';
import { X, Check, ArrowUpRight, Type, Undo, Trash2 } from 'lucide-react';

interface ImageAnnotatorProps {
  imageUrl: string;
  onSave: (annotatedImageUrl: string) => void;
  onCancel: () => void;
}

export const ImageAnnotator = ({ imageUrl, onSave, onCancel }: ImageAnnotatorProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [mode, setMode] = useState<'arrow' | 'number'>('arrow');
  const [numberCounter, setNumberCounter] = useState(1);
  const [annotations, setAnnotations] = useState<any[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const [currentPos, setCurrentPos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      setImage(img);
    };
    img.src = imageUrl;
  }, [imageUrl]);

  useEffect(() => {
    drawCanvas();
  }, [image, annotations, isDrawing, currentPos]);

  const drawCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas || !image) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas dimensions to match image
    canvas.width = image.width;
    canvas.height = image.height;

    // Draw original image
    ctx.drawImage(image, 0, 0);

    // Draw annotations
    annotations.forEach(ann => {
      if (ann.type === 'arrow') {
        drawArrow(ctx, ann.start.x, ann.start.y, ann.end.x, ann.end.y);
      } else if (ann.type === 'number') {
        drawNumber(ctx, ann.pos.x, ann.pos.y, ann.number);
      }
    });

    // Draw current drawing
    if (isDrawing && mode === 'arrow') {
      drawArrow(ctx, startPos.x, startPos.y, currentPos.x, currentPos.y);
    }
  };

  const drawArrow = (ctx: CanvasRenderingContext2D, fromx: number, fromy: number, tox: number, toy: number) => {
    const headlen = 20; // length of head in pixels
    const dx = tox - fromx;
    const dy = toy - fromy;
    const angle = Math.atan2(dy, dx);
    
    ctx.beginPath();
    ctx.moveTo(fromx, fromy);
    ctx.lineTo(tox, toy);
    ctx.lineTo(tox - headlen * Math.cos(angle - Math.PI / 6), toy - headlen * Math.sin(angle - Math.PI / 6));
    ctx.moveTo(tox, toy);
    ctx.lineTo(tox - headlen * Math.cos(angle + Math.PI / 6), toy - headlen * Math.sin(angle + Math.PI / 6));
    ctx.strokeStyle = '#ef4444'; // red-500
    ctx.lineWidth = 5;
    ctx.stroke();
  };

  const drawNumber = (ctx: CanvasRenderingContext2D, x: number, y: number, num: number) => {
    ctx.beginPath();
    ctx.arc(x, y, 20, 0, 2 * Math.PI);
    ctx.fillStyle = '#ef4444';
    ctx.fill();
    ctx.strokeStyle = 'white';
    ctx.lineWidth = 2;
    ctx.stroke();
    
    ctx.fillStyle = 'white';
    ctx.font = 'bold 20px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(num.toString(), x, y);
  };

  const getMousePos = (e: React.PointerEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY
    };
  };

  const handleStart = (e: React.PointerEvent) => {
    // Prevent default to avoid any potential double-handling or scrolling on mobile
    if (e.cancelable) e.preventDefault();
    // Only handle primary button or primary touch (no right clicks)
    if (e.button !== 0 && e.pointerType === 'mouse') return;

    // Optional: capture pointer to keep receiving events even if dragged outside slightly
    (e.target as HTMLElement).setPointerCapture(e.pointerId);

    const pos = getMousePos(e);
    if (mode === 'arrow') {
      setIsDrawing(true);
      setStartPos(pos);
      setCurrentPos(pos);
    } else if (mode === 'number') {
      setAnnotations([...annotations, { type: 'number', pos, number: numberCounter }]);
      setNumberCounter(numberCounter + 1);
    }
  };

  const handleMove = (e: React.PointerEvent) => {
    if (!isDrawing) return;
    if (e.cancelable) e.preventDefault();
    setCurrentPos(getMousePos(e));
  };

  const handleEnd = (e: React.PointerEvent) => {
    if (e.cancelable) e.preventDefault();
    (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    
    if (isDrawing && mode === 'arrow') {
      setIsDrawing(false);
      setAnnotations([...annotations, { type: 'arrow', start: startPos, end: currentPos }]);
    }
  };

  const handleSave = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      onSave(canvas.toDataURL('image/jpeg', 0.8));
    }
  };

  const undo = () => {
    if (annotations.length === 0) return;
    const newAnns = [...annotations];
    const removed = newAnns.pop();
    setAnnotations(newAnns);
    if (removed?.type === 'number') {
      setNumberCounter(Math.max(1, numberCounter - 1));
    }
  };

  const clear = () => {
    setAnnotations([]);
    setNumberCounter(1);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/90 flex flex-col">
      <div className="flex items-center justify-between p-4 bg-zinc-900 border-b border-zinc-800">
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setMode('arrow')}
            className={`p-2 rounded-lg flex items-center gap-2 ${mode === 'arrow' ? 'bg-red-500/20 text-red-500' : 'text-zinc-400 hover:bg-zinc-800'}`}
          >
            <ArrowUpRight size={20} /> <span className="hidden sm:inline">Seta</span>
          </button>
          <button 
            onClick={() => setMode('number')}
            className={`p-2 rounded-lg flex items-center gap-2 ${mode === 'number' ? 'bg-red-500/20 text-red-500' : 'text-zinc-400 hover:bg-zinc-800'}`}
          >
            <Type size={20} /> <span className="hidden sm:inline">Número ({numberCounter})</span>
          </button>
          <div className="w-px h-6 bg-zinc-700 mx-2"></div>
          <button onClick={undo} className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg" title="Desfazer">
            <Undo size={20} />
          </button>
          <button onClick={clear} className="p-2 text-zinc-400 hover:text-red-500 hover:bg-zinc-800 rounded-lg" title="Limpar tudo">
            <Trash2 size={20} />
          </button>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={onCancel} className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg">
            <X size={24} />
          </button>
          <button onClick={handleSave} className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2">
            <Check size={20} /> Salvar
          </button>
        </div>
      </div>
      <div className="flex-1 overflow-auto flex items-center justify-center p-4">
        {image ? (
          <canvas
            ref={canvasRef}
            onPointerDown={handleStart}
            onPointerMove={handleMove}
            onPointerUp={handleEnd}
            onPointerCancel={handleEnd}
            className="max-w-full max-h-full object-contain cursor-crosshair border border-zinc-800 shadow-2xl touch-none"
            style={{ touchAction: 'none' }}
          />
        ) : (
          <div className="text-zinc-500">Carregando imagem...</div>
        )}
      </div>
    </div>
  );
};
