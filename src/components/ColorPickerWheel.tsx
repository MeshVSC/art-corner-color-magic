import { useState, useEffect, useRef } from "react";
import { Label } from "@/components/ui/label";

interface ColorPickerWheelProps {
  currentColor: string;
  onColorChange: (color: string) => void;
  recentColors: string[];
  onAddRecentColor: (color: string) => void;
}

export const ColorPickerWheel = ({
  currentColor,
  onColorChange,
  recentColors,
  onAddRecentColor
}: ColorPickerWheelProps) => {
  const [hue, setHue] = useState(0);
  const [saturation, setSaturation] = useState(100);
  const [lightness, setLightness] = useState(50);
  const svCanvasRef = useRef<HTMLCanvasElement>(null);
  const hueCanvasRef = useRef<HTMLCanvasElement>(null);

  // Convert hex to HSL
  const hexToHSL = (hex: string) => {
    const r = parseInt(hex.slice(1, 3), 16) / 255;
    const g = parseInt(hex.slice(3, 5), 16) / 255;
    const b = parseInt(hex.slice(5, 7), 16) / 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h = 0, s = 0, l = (max + min) / 2;

    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

      switch (max) {
        case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
        case g: h = ((b - r) / d + 2) / 6; break;
        case b: h = ((r - g) / d + 4) / 6; break;
      }
    }

    return { h: h * 360, s: s * 100, l: l * 100 };
  };

  // Convert HSL to hex
  const hslToHex = (h: number, s: number, l: number) => {
    h = h / 360;
    s = s / 100;
    l = l / 100;

    let r, g, b;

    if (s === 0) {
      r = g = b = l;
    } else {
      const hue2rgb = (p: number, q: number, t: number) => {
        if (t < 0) t += 1;
        if (t > 1) t -= 1;
        if (t < 1/6) return p + (q - p) * 6 * t;
        if (t < 1/2) return q;
        if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
        return p;
      };

      const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      const p = 2 * l - q;

      r = hue2rgb(p, q, h + 1/3);
      g = hue2rgb(p, q, h);
      b = hue2rgb(p, q, h - 1/3);
    }

    const toHex = (x: number) => {
      const hex = Math.round(x * 255).toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    };

    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
  };

  // Initialize from current color
  useEffect(() => {
    const hsl = hexToHSL(currentColor);
    setHue(hsl.h);
    setSaturation(hsl.s);
    setLightness(hsl.l);
  }, [currentColor]);

  // Draw hue bar
  useEffect(() => {
    const canvas = hueCanvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    for (let i = 0; i < width; i++) {
      const hueValue = (i / width) * 360;
      ctx.fillStyle = `hsl(${hueValue}, 100%, 50%)`;
      ctx.fillRect(i, 0, 1, height);
    }
  }, []);

  // Draw saturation/lightness square
  useEffect(() => {
    const canvas = svCanvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    // Create gradient for saturation (left to right) and lightness (top to bottom)
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const s = (x / width) * 100;
        const l = 100 - (y / height) * 100;
        ctx.fillStyle = `hsl(${hue}, ${s}%, ${l}%)`;
        ctx.fillRect(x, y, 1, 1);
      }
    }
  }, [hue]);

  const handleHueClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = hueCanvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const newHue = (x / rect.width) * 360;
    setHue(newHue);

    const newColor = hslToHex(newHue, saturation, lightness);
    onColorChange(newColor);
    onAddRecentColor(newColor);
  };

  const handleSVClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = svCanvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const newSaturation = (x / rect.width) * 100;
    const newLightness = 100 - (y / rect.height) * 100;

    setSaturation(newSaturation);
    setLightness(newLightness);

    const newColor = hslToHex(hue, newSaturation, newLightness);
    onColorChange(newColor);
    onAddRecentColor(newColor);
  };

  return (
    <div className="p-3 space-y-3">
      <Label className="text-sm font-medium block">Color Picker</Label>

      {/* Current color preview */}
      <div className="flex items-center gap-2">
        <div
          className="w-12 h-12 rounded-lg border-2 border-[#2A2320]"
          style={{ backgroundColor: currentColor }}
        />
        <div className="flex-1">
          <div className="text-xs font-mono text-muted-foreground">{currentColor.toUpperCase()}</div>
        </div>
      </div>

      {/* Saturation/Lightness square */}
      <div className="relative">
        <canvas
          ref={svCanvasRef}
          width={200}
          height={200}
          onClick={handleSVClick}
          className="w-full h-48 rounded-lg cursor-crosshair border-2 border-[#2A2320]"
          style={{ touchAction: 'none' }}
        />
        {/* Indicator */}
        <div
          className="absolute w-4 h-4 border-2 border-white rounded-full pointer-events-none shadow-lg"
          style={{
            left: `${saturation}%`,
            top: `${100 - lightness}%`,
            transform: 'translate(-50%, -50%)'
          }}
        />
      </div>

      {/* Hue bar */}
      <div className="relative">
        <canvas
          ref={hueCanvasRef}
          width={200}
          height={20}
          onClick={handleHueClick}
          className="w-full h-5 rounded cursor-pointer border-2 border-[#2A2320]"
        />
        {/* Hue indicator */}
        <div
          className="absolute w-1 h-7 bg-white border border-[#2A2320] pointer-events-none shadow-lg"
          style={{
            left: `${(hue / 360) * 100}%`,
            top: '50%',
            transform: 'translate(-50%, -50%)'
          }}
        />
      </div>

      {/* Recent colors */}
      {recentColors.length > 0 && (
        <div>
          <Label className="text-xs font-medium block mb-2">Recent Colors</Label>
          <div className="grid grid-cols-8 gap-1">
            {recentColors.slice(0, 16).map((color, index) => (
              <button
                key={index}
                className="w-6 h-6 rounded border-2 border-[#2A2320] hover:scale-110 transition-transform"
                style={{ backgroundColor: color }}
                onClick={() => {
                  onColorChange(color);
                  const hsl = hexToHSL(color);
                  setHue(hsl.h);
                  setSaturation(hsl.s);
                  setLightness(hsl.l);
                }}
                aria-label={`Select color ${color}`}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
