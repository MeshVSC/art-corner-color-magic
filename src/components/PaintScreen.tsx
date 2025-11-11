import { useState, useEffect } from "react";
import { PaintHeader } from "./PaintHeader";
import { LeftSidebar } from "./LeftSidebar";
import { RightSidebar } from "./RightSidebar";
import { PaintCanvas } from "./PaintCanvas";
import { usePaintHistory } from "@/hooks/usePaintHistory";
import { useLayers } from "@/hooks/useLayers";
import { usePaintCanvas, ToolType, BrushType } from "@/hooks/usePaintCanvas";
import { FloatingDecor } from "./FloatingDecor";

interface PaintScreenProps {
  imageUrl: string;
  onBack: () => void;
  onStartOver: () => void;
}

// Floating decorations for the paint screen
const paintDecoConfigs = [
  {
    shape: "heart",
    color: "#EF7B24",
    style: {
      left: "5vw",
      top: "12vh",
      animationDelay: "0.5s",
      animationDuration: "10s",
    },
    size: 20,
  },
  {
    shape: "star",
    color: "#F7BB48",
    style: {
      right: "8vw",
      top: "8vh",
      animationDelay: "1.2s",
      animationDuration: "12s"
    },
    size: 18,
  },
  {
    shape: "sparkle",
    color: "#51C7B0",
    style: {
      left: "15vw",
      bottom: "15vh",
      animationDelay: "2.0s",
      animationDuration: "8s"
    },
    size: 16,
  },
  {
    shape: "heart",
    color: "#F76B6B",
    style: {
      right: "12vw",
      bottom: "20vh",
      animationDelay: "0.8s",
      animationDuration: "11s"
    },
    size: 22,
  },
  {
    shape: "sparkle",
    color: "#FFF7E7",
    style: {
      left: "50vw",
      top: "5vh",
      animationDelay: "1.8s",
      animationDuration: "9s"
    },
    size: 14,
  },
];

export const PaintScreen = ({ imageUrl, onBack, onStartOver }: PaintScreenProps) => {
  const [tool, setTool] = useState<ToolType>('brush');
  const [brushType, setBrushType] = useState<BrushType>('normal');
  const [brushSize, setBrushSize] = useState(5);
  const [brushOpacity, setBrushOpacity] = useState(100);
  const [smoothing, setSmoothing] = useState(3);
  const [currentColor, setCurrentColor] = useState('#FF6B6B');
  const [recentColors, setRecentColors] = useState<string[]>([
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FECA57',
    '#FF9FF3', '#54A0FF', '#5F27CD', '#00D2D3', '#FF9F43'
  ]);

  const { saveToHistory, undo, redo, canUndo, canRedo } = usePaintHistory();

  const {
    layers,
    activeLayerId,
    initializeLayers,
    addLayer,
    deleteLayer,
    duplicateLayer,
    toggleLayerVisibility,
    setActiveLayerId,
    moveLayer,
    renameLayer,
    changeLayerOpacity,
    rasterizeAll,
    rasterizeVisible,
    flattenImage,
    getActiveLayer
  } = useLayers(imageUrl);

  const handleColorPicked = (color: string) => {
    setCurrentColor(color);
    addRecentColor(color);
    setTool('brush'); // Switch back to brush after picking color
  };

  const addRecentColor = (color: string) => {
    setRecentColors(prev => {
      // Remove color if it already exists
      const filtered = prev.filter(c => c.toLowerCase() !== color.toLowerCase());
      // Add to front and limit to 16 colors
      return [color, ...filtered].slice(0, 16);
    });
  };

  const {
    canvasRef,
    startDrawing,
    draw,
    stopDrawing,
    zoom,
    handleZoom,
    resetView
  } = usePaintCanvas({
    imageUrl,
    tool,
    brushType,
    brushSize,
    brushOpacity,
    currentColor,
    smoothing,
    onSaveToHistory: saveToHistory,
    onColorPicked: handleColorPicked,
    activeLayer: getActiveLayer(),
    layers
  });

  // Initialize layers when component mounts
  useEffect(() => {
    initializeLayers();
  }, [initializeLayers]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case 'z':
            e.preventDefault();
            if (e.shiftKey) {
              handleRedo();
            } else {
              handleUndo();
            }
            break;
          case 'y':
            e.preventDefault();
            handleRedo();
            break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [canUndo, canRedo]);

  const handleUndo = () => {
    if (canvasRef.current && canUndo) {
      undo(canvasRef.current);
    }
  };

  const handleRedo = () => {
    if (canvasRef.current && canRedo) {
      redo(canvasRef.current);
    }
  };

  return (
    <div 
      className="min-h-screen p-4 relative overflow-hidden"
    >
      {/* Floating Decorations */}
      <div className="pointer-events-none absolute inset-0 w-full h-full z-10">
        {paintDecoConfigs.map((d, i) => (
          <span
            key={i}
            className="absolute animate-floating-sway"
            style={{
              ...d.style,
              animationDelay: d.style?.animationDelay ?? undefined,
              animationDuration: d.style?.animationDuration ?? undefined
            }}
          >
            <FloatingDecor shape={d.shape as any} color={d.color} size={d.size} />
          </span>
        ))}
      </div>

      <div className="w-full h-screen flex flex-col relative z-20">
        <PaintHeader
          onBack={onBack}
          onStartOver={onStartOver}
          canvasRef={canvasRef}
        />

        <div className="flex flex-1 overflow-hidden">
          {/* Left Sidebar - Tools only */}
          <div className="flex-shrink-0">
            <LeftSidebar
              tool={tool}
              setTool={setTool}
            />
          </div>

          {/* Canvas - centered and takes available space */}
          <div className="flex-1 flex items-center justify-center overflow-hidden">
            <PaintCanvas
              canvasRef={canvasRef}
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
              tool={tool}
            />
          </div>

          {/* Right Sidebar - Controls, colors, layers */}
          <div className="flex-shrink-0 w-80 overflow-hidden">
            <RightSidebar
              tool={tool}
              brushType={brushType}
              setBrushType={setBrushType}
              brushSize={brushSize}
              setBrushSize={setBrushSize}
              brushOpacity={brushOpacity}
              setBrushOpacity={setBrushOpacity}
              smoothing={smoothing}
              setSmoothing={setSmoothing}
              currentColor={currentColor}
              setCurrentColor={setCurrentColor}
              recentColors={recentColors}
              onAddRecentColor={addRecentColor}
              zoom={zoom}
              onZoomIn={() => handleZoom(0.1)}
              onZoomOut={() => handleZoom(-0.1)}
              onResetView={resetView}
              onUndo={handleUndo}
              onRedo={handleRedo}
              canUndo={canUndo}
              canRedo={canRedo}
              layers={layers}
              activeLayerId={activeLayerId}
              onAddLayer={addLayer}
              onDeleteLayer={deleteLayer}
              onDuplicateLayer={duplicateLayer}
              onToggleLayerVisibility={toggleLayerVisibility}
              onSelectLayer={setActiveLayerId}
              onMoveLayer={moveLayer}
              onRenameLayer={renameLayer}
              onChangeLayerOpacity={changeLayerOpacity}
              onRasterizeAll={rasterizeAll}
              onRasterizeVisible={rasterizeVisible}
              onFlattenImage={flattenImage}
            />
          </div>
        </div>
      </div>

      {/* Floating Element Animation Keyframes */}
      <style>{`
      @keyframes floating-sway {
        0%,100% { transform: translateY(0px) rotate(-8deg);}
        24% { transform: translateY(-12px) rotate(8deg);}
        44% { transform: translateY(-16px) rotate(1deg);}
        68% { transform: translateY(-8px) rotate(-10deg);}
        82% { transform: translateY(-3px) rotate(3deg);}
      }
      .animate-floating-sway {
        animation-name: floating-sway;
        animation-iteration-count: infinite;
        animation-direction: alternate;
        animation-timing-function: cubic-bezier(.83,-0.19,.23,1.11);
      }
      `}</style>
    </div>
  );
};
