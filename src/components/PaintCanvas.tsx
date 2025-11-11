
import { Card } from "@/components/ui/card";
import { ToolType } from "@/hooks/usePaintCanvas";

interface PaintCanvasProps {
  canvasRef: React.RefObject<HTMLCanvasElement>;
  onMouseDown: (e: React.MouseEvent<HTMLCanvasElement>) => void;
  onMouseMove: (e: React.MouseEvent<HTMLCanvasElement>) => void;
  onMouseUp: () => void;
  onMouseLeave: () => void;
  tool?: ToolType;
}

const getCursor = (tool: ToolType | undefined): string => {
  switch (tool) {
    case 'brush':
    case 'eraser':
      return 'crosshair';
    case 'fill':
      return 'pointer';
    case 'eyedropper':
      return 'crosshair';
    case 'line':
    case 'rectangle':
    case 'circle':
    case 'ellipse':
      return 'crosshair';
    default:
      return 'crosshair';
  }
};

export const PaintCanvas = ({
  canvasRef,
  onMouseDown,
  onMouseMove,
  onMouseUp,
  onMouseLeave,
  tool
}: PaintCanvasProps) => {
  const handleTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const touch = e.touches[0];
    const mouseEvent = new MouseEvent('mousedown', {
      clientX: touch.clientX,
      clientY: touch.clientY
    });
    onMouseDown(mouseEvent as any);
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const touch = e.touches[0];
    const mouseEvent = new MouseEvent('mousemove', {
      clientX: touch.clientX,
      clientY: touch.clientY
    });
    onMouseMove(mouseEvent as any);
  };

  const handleTouchEnd = (e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    onMouseUp();
  };

  const cursor = getCursor(tool);

  return (
    <div className="w-full h-full flex items-center justify-center">
      <canvas
        ref={canvasRef}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseLeave}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        className="rounded-2xl touch-none"
        style={{
          width: '80vw',
          height: '80vw',
          maxWidth: '90vh',
          maxHeight: '90vh',
          border: '4px solid #2A2320',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
          cursor
        }}
      />
    </div>
  );
};
