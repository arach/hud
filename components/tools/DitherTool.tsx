import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Upload, RotateCcw, Download } from 'lucide-react';

export interface DitherSettings {
  pixelSize: number;
  palette: 'grayscale' | 'gameboy' | 'cga' | 'sepia' | 'cyber' | 'custom';
  algorithm: 'ordered' | 'floyd-steinberg' | 'atkinson' | 'none';
  contrast: number;
  brightness: number;
}

interface DitherToolProps {
  settings?: Partial<DitherSettings>;
  onSettingsChange?: (settings: DitherSettings) => void;
}

const PALETTES: Record<string, number[][]> = {
  grayscale: [[0,0,0], [85,85,85], [170,170,170], [255,255,255]],
  gameboy: [[15,56,15], [48,98,48], [139,172,15], [155,188,15]],
  cga: [[0,0,0], [0,170,170], [170,0,170], [170,170,170]],
  sepia: [[44,33,21], [87,66,42], [140,112,84], [201,178,149]],
  cyber: [[13,2,33], [87,0,127], [255,0,110], [0,255,198]],
};

const BAYER_4X4 = [
  [0, 8, 2, 10],
  [12, 4, 14, 6],
  [3, 11, 1, 9],
  [15, 7, 13, 5]
].map(row => row.map(v => (v / 16) - 0.5));

const DEFAULT_IMAGE = 'data:image/svg+xml,' + encodeURIComponent(`
  <svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300">
    <defs>
      <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style="stop-color:#1a1a2e"/>
        <stop offset="100%" style="stop-color:#16213e"/>
      </linearGradient>
      <linearGradient id="accent" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" style="stop-color:#0f3460"/>
        <stop offset="100%" style="stop-color:#e94560"/>
      </linearGradient>
    </defs>
    <rect width="400" height="300" fill="url(#bg)"/>
    <circle cx="300" cy="80" r="60" fill="#e94560" opacity="0.8"/>
    <circle cx="280" cy="100" r="40" fill="#0f3460" opacity="0.9"/>
    <rect x="40" y="180" width="150" height="80" rx="8" fill="url(#accent)" opacity="0.7"/>
    <rect x="60" y="200" width="80" height="8" rx="4" fill="#fff" opacity="0.5"/>
    <rect x="60" y="220" width="60" height="8" rx="4" fill="#fff" opacity="0.3"/>
    <polygon points="250,150 320,220 180,220" fill="#e94560" opacity="0.6"/>
    <text x="200" y="280" text-anchor="middle" fill="#fff" opacity="0.4" font-family="monospace" font-size="12">DROP IMAGE OR USE DEFAULT</text>
  </svg>
`);

const DitherTool: React.FC<DitherToolProps> = ({
  settings: externalSettings,
  onSettingsChange
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const originalImageRef = useRef<HTMLImageElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  const [settings, setSettings] = useState<DitherSettings>({
    pixelSize: 4,
    palette: 'grayscale',
    algorithm: 'ordered',
    contrast: 1,
    brightness: 0,
    ...externalSettings
  });

  // Sync external settings
  useEffect(() => {
    if (externalSettings) {
      setSettings(prev => ({ ...prev, ...externalSettings }));
    }
  }, [externalSettings]);

  const findClosestColor = useCallback((r: number, g: number, b: number, palette: number[][]) => {
    let minDist = Infinity;
    let closest = palette[0];
    for (const color of palette) {
      const dist = Math.pow(r - color[0], 2) + Math.pow(g - color[1], 2) + Math.pow(b - color[2], 2);
      if (dist < minDist) {
        minDist = dist;
        closest = color;
      }
    }
    return closest;
  }, []);

  const applyDither = useCallback(() => {
    const canvas = canvasRef.current;
    const img = originalImageRef.current;
    if (!canvas || !img) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { pixelSize, palette, algorithm, contrast, brightness } = settings;
    const pal = PALETTES[palette] || PALETTES.grayscale;

    // Calculate dimensions
    const w = Math.floor(canvas.width / pixelSize);
    const h = Math.floor(canvas.height / pixelSize);

    // Create temp canvas for sampling
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = w;
    tempCanvas.height = h;
    const tempCtx = tempCanvas.getContext('2d');
    if (!tempCtx) return;

    // Draw scaled down image
    tempCtx.drawImage(img, 0, 0, w, h);
    const imageData = tempCtx.getImageData(0, 0, w, h);
    const data = imageData.data;

    // Apply brightness and contrast
    for (let i = 0; i < data.length; i += 4) {
      for (let c = 0; c < 3; c++) {
        let val = data[i + c];
        val = (val - 128) * contrast + 128 + brightness * 255;
        data[i + c] = Math.max(0, Math.min(255, val));
      }
    }

    // Apply dithering
    if (algorithm === 'ordered') {
      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          const i = (y * w + x) * 4;
          const threshold = BAYER_4X4[y % 4][x % 4] * 64;
          const r = Math.max(0, Math.min(255, data[i] + threshold));
          const g = Math.max(0, Math.min(255, data[i + 1] + threshold));
          const b = Math.max(0, Math.min(255, data[i + 2] + threshold));
          const [nr, ng, nb] = findClosestColor(r, g, b, pal);
          data[i] = nr;
          data[i + 1] = ng;
          data[i + 2] = nb;
        }
      }
    } else if (algorithm === 'floyd-steinberg' || algorithm === 'atkinson') {
      const diffusion = algorithm === 'atkinson'
        ? [[1, 0, 1/8], [2, 0, 1/8], [-1, 1, 1/8], [0, 1, 1/8], [1, 1, 1/8], [0, 2, 1/8]]
        : [[1, 0, 7/16], [-1, 1, 3/16], [0, 1, 5/16], [1, 1, 1/16]];

      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          const i = (y * w + x) * 4;
          const oldR = data[i], oldG = data[i + 1], oldB = data[i + 2];
          const [newR, newG, newB] = findClosestColor(oldR, oldG, oldB, pal);
          data[i] = newR;
          data[i + 1] = newG;
          data[i + 2] = newB;

          const errR = oldR - newR, errG = oldG - newG, errB = oldB - newB;
          for (const [dx, dy, factor] of diffusion) {
            const nx = x + dx, ny = y + dy;
            if (nx >= 0 && nx < w && ny < h) {
              const ni = (ny * w + nx) * 4;
              data[ni] = Math.max(0, Math.min(255, data[ni] + errR * factor));
              data[ni + 1] = Math.max(0, Math.min(255, data[ni + 1] + errG * factor));
              data[ni + 2] = Math.max(0, Math.min(255, data[ni + 2] + errB * factor));
            }
          }
        }
      }
    } else {
      // No dithering, just quantize
      for (let i = 0; i < data.length; i += 4) {
        const [r, g, b] = findClosestColor(data[i], data[i + 1], data[i + 2], pal);
        data[i] = r;
        data[i + 1] = g;
        data[i + 2] = b;
      }
    }

    tempCtx.putImageData(imageData, 0, 0);

    // Draw pixelated result to main canvas
    ctx.imageSmoothingEnabled = false;
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(tempCanvas, 0, 0, w, h, 0, 0, canvas.width, canvas.height);
  }, [settings, findClosestColor]);

  const loadImage = useCallback((src: string) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      originalImageRef.current = img;
      const canvas = canvasRef.current;
      if (canvas) {
        // Maintain aspect ratio within canvas bounds
        const maxW = canvas.parentElement?.clientWidth || 400;
        const maxH = canvas.parentElement?.clientHeight || 300;
        const scale = Math.min(maxW / img.width, maxH / img.height, 1);
        canvas.width = Math.floor(img.width * scale);
        canvas.height = Math.floor(img.height * scale);
      }
      setImageLoaded(true);
      applyDither();
    };
    img.src = src;
  }, [applyDither]);

  // Load default image on mount
  useEffect(() => {
    loadImage(DEFAULT_IMAGE);
  }, []);

  // Re-apply dither when settings change
  useEffect(() => {
    if (imageLoaded) {
      applyDither();
    }
  }, [settings, imageLoaded, applyDither]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        if (ev.target?.result) {
          loadImage(ev.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  }, [loadImage]);

  const handleReset = () => {
    setSettings({
      pixelSize: 4,
      palette: 'grayscale',
      algorithm: 'ordered',
      contrast: 1,
      brightness: 0
    });
  };

  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = 'dithered.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  return (
    <div className="h-full flex flex-col bg-[#0a0a0a]">
      {/* Canvas Area */}
      <div
        className={`flex-1 flex items-center justify-center p-4 relative ${isDragging ? 'bg-emerald-900/20' : ''}`}
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
      >
        <canvas
          ref={canvasRef}
          className="max-w-full max-h-full border border-neutral-800 rounded"
          style={{ imageRendering: 'pixelated' }}
        />
        {isDragging && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50 pointer-events-none">
            <div className="text-emerald-400 flex items-center gap-2">
              <Upload size={24} />
              <span>Drop image here</span>
            </div>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="shrink-0 border-t border-neutral-800 bg-neutral-900/50 p-3">
        <div className="flex items-center gap-4 text-[10px]">
          <div className="flex items-center gap-2">
            <span className="text-neutral-500 uppercase">Pixels</span>
            <span className="text-neutral-300 w-6">{settings.pixelSize}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-neutral-500 uppercase">Palette</span>
            <span className="text-neutral-300 capitalize">{settings.palette}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-neutral-500 uppercase">Algorithm</span>
            <span className="text-neutral-300 capitalize">{settings.algorithm}</span>
          </div>
          <div className="flex-1" />
          <button
            onClick={handleReset}
            className="p-1.5 hover:bg-white/10 rounded text-neutral-500 hover:text-white transition-colors"
            title="Reset settings"
          >
            <RotateCcw size={12} />
          </button>
          <button
            onClick={handleDownload}
            className="p-1.5 hover:bg-white/10 rounded text-neutral-500 hover:text-white transition-colors"
            title="Download image"
          >
            <Download size={12} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default DitherTool;
