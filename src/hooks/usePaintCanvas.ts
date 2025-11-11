
import { useRef, useEffect, useState } from 'react';
import { Layer } from '@/components/LayersPanel';

export type ToolType = 'brush' | 'eraser' | 'fill' | 'eyedropper' | 'line' | 'rectangle' | 'circle' | 'ellipse';
export type BrushType = 'normal' | 'pencil' | 'marker' | 'airbrush';

interface UsePaintCanvasProps {
  imageUrl: string;
  tool: ToolType;
  brushType: BrushType;
  brushSize: number;
  brushOpacity: number;
  currentColor: string;
  smoothing: number;
  onSaveToHistory: (canvas: HTMLCanvasElement) => void;
  onColorPicked?: (color: string) => void;
  activeLayer?: Layer;
  layers: Layer[];
}

interface Point {
  x: number;
  y: number;
}

export const usePaintCanvas = ({
  imageUrl,
  tool,
  brushType,
  brushSize,
  brushOpacity,
  currentColor,
  smoothing,
  onSaveToHistory,
  onColorPicked,
  activeLayer,
  layers
}: UsePaintCanvasProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPoint, setStartPoint] = useState<Point | null>(null);
  const [points, setPoints] = useState<Point[]>([]);
  const previewCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [lastPanPoint, setLastPanPoint] = useState<Point | null>(null);

  // Create preview canvas for shape tools
  useEffect(() => {
    if (!previewCanvasRef.current) {
      previewCanvasRef.current = document.createElement('canvas');
    }
  }, []);

  // Composite all layers onto the main canvas
  const compositeLayersOnCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas || layers.length === 0) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear the main canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw all visible layers in order
    layers.forEach(layer => {
      if (layer.visible) {
        ctx.globalAlpha = layer.opacity / 100;
        ctx.drawImage(layer.canvas, 0, 0);
      }
    });

    ctx.globalAlpha = 1;

    // Draw preview for shape tools
    if (isDrawing && startPoint && (tool === 'line' || tool === 'rectangle' || tool === 'circle' || tool === 'ellipse')) {
      const lastPoint = points[points.length - 1];
      if (lastPoint) {
        drawShapePreview(ctx, startPoint, lastPoint);
      }
    }
  };

  // Update canvas when layers change
  useEffect(() => {
    compositeLayersOnCanvas();
  }, [layers, isDrawing, startPoint, points]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || layers.length === 0) return;

    // Set canvas dimensions based on the first layer
    const firstLayer = layers[0];
    if (firstLayer && firstLayer.canvas) {
      canvas.width = firstLayer.canvas.width;
      canvas.height = firstLayer.canvas.height;
      compositeLayersOnCanvas();
    }
  }, [imageUrl, layers]);

  const getPointerPosition = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    let clientX, clientY;

    if ('touches' in e && e.touches.length > 0) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else if ('clientX' in e) {
      clientX = e.clientX;
      clientY = e.clientY;
    } else {
      return { x: 0, y: 0 };
    }

    const x = ((clientX - rect.left) * (canvas.width / rect.width)) / zoom - pan.x;
    const y = ((clientY - rect.top) * (canvas.height / rect.height)) / zoom - pan.y;

    return { x, y };
  };

  // Flood fill algorithm
  const floodFill = (ctx: CanvasRenderingContext2D, startX: number, startY: number, fillColor: string) => {
    const imageData = ctx.getImageData(0, 0, ctx.canvas.width, ctx.canvas.height);
    const pixels = imageData.data;
    const startPos = (Math.floor(startY) * ctx.canvas.width + Math.floor(startX)) * 4;

    const startR = pixels[startPos];
    const startG = pixels[startPos + 1];
    const startB = pixels[startPos + 2];
    const startA = pixels[startPos + 3];

    // Convert fill color to RGB
    const tempCanvas = document.createElement('canvas');
    const tempCtx = tempCanvas.getContext('2d');
    if (!tempCtx) return;
    tempCtx.fillStyle = fillColor;
    tempCtx.fillRect(0, 0, 1, 1);
    const fillData = tempCtx.getImageData(0, 0, 1, 1).data;
    const fillR = fillData[0];
    const fillG = fillData[1];
    const fillB = fillData[2];
    const fillA = Math.round((brushOpacity / 100) * 255);

    // If the color is the same, no need to fill
    if (startR === fillR && startG === fillG && startB === fillB && startA === fillA) {
      return;
    }

    const pixelStack: [number, number][] = [[Math.floor(startX), Math.floor(startY)]];
    const width = ctx.canvas.width;
    const height = ctx.canvas.height;

    const matchesStartColor = (pos: number) => {
      return pixels[pos] === startR &&
             pixels[pos + 1] === startG &&
             pixels[pos + 2] === startB &&
             pixels[pos + 3] === startA;
    };

    while (pixelStack.length > 0) {
      const [x, y] = pixelStack.pop()!;
      if (x < 0 || x >= width || y < 0 || y >= height) continue;

      let currentPos = (y * width + x) * 4;

      while (y >= 0 && matchesStartColor(currentPos)) {
        currentPos -= width * 4;
      }
      currentPos += width * 4;
      let reachLeft = false;
      let reachRight = false;
      let currentY = Math.floor(currentPos / 4 / width);

      while (currentY < height && matchesStartColor(currentPos)) {
        pixels[currentPos] = fillR;
        pixels[currentPos + 1] = fillG;
        pixels[currentPos + 2] = fillB;
        pixels[currentPos + 3] = fillA;

        const currentX = Math.floor((currentPos / 4) % width);

        if (currentX > 0) {
          if (matchesStartColor(currentPos - 4)) {
            if (!reachLeft) {
              pixelStack.push([currentX - 1, currentY]);
              reachLeft = true;
            }
          } else if (reachLeft) {
            reachLeft = false;
          }
        }

        if (currentX < width - 1) {
          if (matchesStartColor(currentPos + 4)) {
            if (!reachRight) {
              pixelStack.push([currentX + 1, currentY]);
              reachRight = true;
            }
          } else if (reachRight) {
            reachRight = false;
          }
        }

        currentPos += width * 4;
        currentY++;
      }
    }

    ctx.putImageData(imageData, 0, 0);
  };

  // Eyedropper tool
  const pickColor = (ctx: CanvasRenderingContext2D, x: number, y: number) => {
    const imageData = ctx.getImageData(Math.floor(x), Math.floor(y), 1, 1);
    const [r, g, b, a] = imageData.data;
    if (a === 0) return null;
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
  };

  // Apply brush type effects
  const applyBrushType = (ctx: CanvasRenderingContext2D) => {
    switch (brushType) {
      case 'pencil':
        ctx.lineCap = 'square';
        ctx.lineJoin = 'miter';
        ctx.globalAlpha = 1;
        break;
      case 'marker':
        ctx.lineCap = 'square';
        ctx.lineJoin = 'bevel';
        break;
      case 'airbrush':
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        // Airbrush effect achieved through multiple low-opacity circles
        break;
      default: // normal
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        break;
    }
  };

  // Draw with smoothing
  const drawSmooth = (ctx: CanvasRenderingContext2D, points: Point[]) => {
    if (points.length < 2) return;

    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);

    if (smoothing === 0 || points.length < 3) {
      // No smoothing, draw straight lines
      for (let i = 1; i < points.length; i++) {
        ctx.lineTo(points[i].x, points[i].y);
      }
    } else {
      // Apply smoothing using quadratic curves
      for (let i = 1; i < points.length - 1; i++) {
        const xc = (points[i].x + points[i + 1].x) / 2;
        const yc = (points[i].y + points[i + 1].y) / 2;
        ctx.quadraticCurveTo(points[i].x, points[i].y, xc, yc);
      }
      // Draw the last point
      const lastPoint = points[points.length - 1];
      ctx.lineTo(lastPoint.x, lastPoint.y);
    }

    ctx.stroke();
  };

  // Draw airbrush effect
  const drawAirbrush = (ctx: CanvasRenderingContext2D, x: number, y: number) => {
    const density = brushSize / 2;
    const radius = brushSize;

    for (let i = 0; i < density; i++) {
      const angle = Math.random() * Math.PI * 2;
      const distance = Math.random() * radius;
      const px = x + Math.cos(angle) * distance;
      const py = y + Math.sin(angle) * distance;

      ctx.globalAlpha = (brushOpacity / 100) * 0.1;
      ctx.fillStyle = currentColor;
      ctx.fillRect(px, py, 1, 1);
    }
  };

  // Draw shape preview
  const drawShapePreview = (ctx: CanvasRenderingContext2D, start: Point, end: Point) => {
    ctx.save();
    ctx.strokeStyle = currentColor;
    ctx.lineWidth = brushSize;
    ctx.globalAlpha = brushOpacity / 100;
    ctx.setLineDash([5, 5]);
    applyBrushType(ctx);

    ctx.beginPath();

    switch (tool) {
      case 'line':
        ctx.moveTo(start.x, start.y);
        ctx.lineTo(end.x, end.y);
        break;
      case 'rectangle':
        ctx.rect(start.x, start.y, end.x - start.x, end.y - start.y);
        break;
      case 'circle': {
        const radius = Math.sqrt(Math.pow(end.x - start.x, 2) + Math.pow(end.y - start.y, 2));
        ctx.arc(start.x, start.y, radius, 0, Math.PI * 2);
        break;
      }
      case 'ellipse': {
        const radiusX = Math.abs(end.x - start.x);
        const radiusY = Math.abs(end.y - start.y);
        const centerX = start.x + (end.x - start.x) / 2;
        const centerY = start.y + (end.y - start.y) / 2;
        ctx.ellipse(centerX, centerY, radiusX / 2, radiusY / 2, 0, 0, Math.PI * 2);
        break;
      }
    }

    ctx.stroke();
    ctx.restore();
  };

  // Draw final shape on layer
  const drawShape = (ctx: CanvasRenderingContext2D, start: Point, end: Point) => {
    ctx.strokeStyle = currentColor;
    ctx.lineWidth = brushSize;
    ctx.globalAlpha = brushOpacity / 100;
    applyBrushType(ctx);

    ctx.beginPath();

    switch (tool) {
      case 'line':
        ctx.moveTo(start.x, start.y);
        ctx.lineTo(end.x, end.y);
        break;
      case 'rectangle':
        ctx.rect(start.x, start.y, end.x - start.x, end.y - start.y);
        break;
      case 'circle': {
        const radius = Math.sqrt(Math.pow(end.x - start.x, 2) + Math.pow(end.y - start.y, 2));
        ctx.arc(start.x, start.y, radius, 0, Math.PI * 2);
        break;
      }
      case 'ellipse': {
        const radiusX = Math.abs(end.x - start.x);
        const radiusY = Math.abs(end.y - start.y);
        const centerX = start.x + (end.x - start.x) / 2;
        const centerY = start.y + (end.y - start.y) / 2;
        ctx.ellipse(centerX, centerY, radiusX / 2, radiusY / 2, 0, 0, Math.PI * 2);
        break;
      }
    }

    ctx.stroke();
    ctx.globalAlpha = 1;
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    if (!activeLayer) return;

    const point = getPointerPosition(e);

    // Handle eyedropper tool
    if (tool === 'eyedropper') {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      const color = pickColor(ctx, point.x, point.y);
      if (color && onColorPicked) {
        onColorPicked(color);
      }
      return;
    }

    // Handle fill tool
    if (tool === 'fill') {
      const ctx = activeLayer.canvas.getContext('2d');
      if (!ctx) return;
      floodFill(ctx, point.x, point.y, currentColor);
      compositeLayersOnCanvas();
      const canvas = canvasRef.current;
      if (canvas) {
        onSaveToHistory(canvas);
      }
      return;
    }

    setIsDrawing(true);
    setStartPoint(point);
    setPoints([point]);

    // For shape tools, don't start drawing yet (wait for mouse up)
    if (tool !== 'line' && tool !== 'rectangle' && tool !== 'circle' && tool !== 'ellipse') {
      const ctx = activeLayer.canvas.getContext('2d');
      if (!ctx) return;
      ctx.beginPath();
      ctx.moveTo(point.x, point.y);
    }
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !activeLayer) return;

    const point = getPointerPosition(e);
    setPoints(prev => [...prev, point]);

    // For shape tools, just update the preview
    if (tool === 'line' || tool === 'rectangle' || tool === 'circle' || tool === 'ellipse') {
      compositeLayersOnCanvas();
      return;
    }

    const ctx = activeLayer.canvas.getContext('2d');
    if (!ctx) return;

    ctx.lineWidth = brushSize;
    ctx.globalCompositeOperation = tool === 'eraser' ? 'destination-out' : 'source-over';
    ctx.strokeStyle = currentColor;

    if (tool === 'eraser') {
      ctx.globalAlpha = 1;
    } else {
      ctx.globalAlpha = (brushOpacity / 100) * (activeLayer.opacity / 100);
    }

    applyBrushType(ctx);

    if (brushType === 'airbrush') {
      drawAirbrush(ctx, point.x, point.y);
    } else {
      // Use smoothing for regular drawing
      const smoothPoints = points.slice(-Math.max(2, smoothing + 2));
      drawSmooth(ctx, smoothPoints);
      ctx.beginPath();
      ctx.moveTo(point.x, point.y);
    }

    // Update the main canvas
    compositeLayersOnCanvas();
  };

  const stopDrawing = () => {
    if (!isDrawing || !activeLayer) return;

    const ctx = activeLayer.canvas.getContext('2d');
    if (!ctx) return;

    // For shape tools, draw the final shape
    if (startPoint && points.length > 0 && (tool === 'line' || tool === 'rectangle' || tool === 'circle' || tool === 'ellipse')) {
      const endPoint = points[points.length - 1];
      drawShape(ctx, startPoint, endPoint);
    }

    setIsDrawing(false);
    setStartPoint(null);
    setPoints([]);
    ctx.beginPath();

    const canvas = canvasRef.current;
    if (canvas) {
      onSaveToHistory(canvas);
      compositeLayersOnCanvas();
    }
  };

  // Zoom in/out
  const handleZoom = (delta: number) => {
    setZoom(prev => Math.max(0.1, Math.min(5, prev + delta)));
  };

  // Reset zoom and pan
  const resetView = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  return {
    canvasRef,
    startDrawing,
    draw,
    stopDrawing,
    zoom,
    handleZoom,
    resetView,
    pan,
    setPan
  };
};
