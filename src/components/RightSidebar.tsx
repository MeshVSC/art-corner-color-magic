import { BrushTypeSelector } from "./BrushTypeSelector";
import { BrushSizeSlider } from "./BrushSizeSlider";
import { BrushOpacitySlider } from "./BrushOpacitySlider";
import { SmoothingSlider } from "./SmoothingSlider";
import { ZoomControls } from "./ZoomControls";
import { ColorPickerWheel } from "./ColorPickerWheel";
import { HistoryControls } from "./HistoryControls";
import { LayersPanel, Layer } from "./LayersPanel";
import { RasterizeControls } from "./RasterizeControls";
import { QuickTips } from "./QuickTips";
import { ToolType, BrushType } from "@/hooks/usePaintCanvas";
import { Separator } from "@/components/ui/separator";

interface RightSidebarProps {
  tool: ToolType;
  brushType: BrushType;
  setBrushType: (type: BrushType) => void;
  brushSize: number;
  setBrushSize: (size: number) => void;
  brushOpacity: number;
  setBrushOpacity: (opacity: number) => void;
  smoothing: number;
  setSmoothing: (value: number) => void;
  currentColor: string;
  setCurrentColor: (color: string) => void;
  recentColors: string[];
  onAddRecentColor: (color: string) => void;
  zoom: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetView: () => void;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  layers: Layer[];
  activeLayerId: string;
  onAddLayer: () => void;
  onDeleteLayer: (layerId: string) => void;
  onDuplicateLayer: (layerId: string) => void;
  onToggleLayerVisibility: (layerId: string) => void;
  onSelectLayer: (layerId: string) => void;
  onMoveLayer: (layerId: string, direction: 'up' | 'down') => void;
  onRenameLayer: (layerId: string, newName: string) => void;
  onChangeLayerOpacity: (layerId: string, opacity: number) => void;
  onRasterizeAll: () => void;
  onRasterizeVisible: () => void;
  onFlattenImage: () => void;
}

export const RightSidebar = ({
  tool,
  brushType,
  setBrushType,
  brushSize,
  setBrushSize,
  brushOpacity,
  setBrushOpacity,
  smoothing,
  setSmoothing,
  currentColor,
  setCurrentColor,
  recentColors,
  onAddRecentColor,
  zoom,
  onZoomIn,
  onZoomOut,
  onResetView,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  layers,
  activeLayerId,
  onAddLayer,
  onDeleteLayer,
  onDuplicateLayer,
  onToggleLayerVisibility,
  onSelectLayer,
  onMoveLayer,
  onRenameLayer,
  onChangeLayerOpacity,
  onRasterizeAll,
  onRasterizeVisible,
  onFlattenImage
}: RightSidebarProps) => {
  const showBrushControls = tool === 'brush' || tool === 'eraser';
  const showColorControls = tool !== 'eyedropper' && tool !== 'eraser';

  return (
    <div className="h-full overflow-y-auto bg-gradient-to-b from-[#FFF7E7] to-[#FFE8CC] border-l-4 border-[#2A2320]">
      <div className="space-y-4 p-3">
        {/* History Controls */}
        <div className="cozy-card p-2">
          <HistoryControls
            onUndo={onUndo}
            onRedo={onRedo}
            canUndo={canUndo}
            canRedo={canRedo}
          />
        </div>

        <Separator className="bg-[#2A2320] h-[2px]" />

        {/* Brush Controls */}
        {showBrushControls && (
          <>
            <div className="cozy-card p-2 space-y-3">
              <BrushTypeSelector brushType={brushType} setBrushType={setBrushType} />
              <BrushSizeSlider value={brushSize} onChange={setBrushSize} />
              {tool === 'brush' && (
                <BrushOpacitySlider value={brushOpacity} onChange={setBrushOpacity} />
              )}
              {tool === 'brush' && brushType !== 'airbrush' && (
                <SmoothingSlider smoothing={smoothing} setSmoothing={setSmoothing} />
              )}
            </div>
            <Separator className="bg-[#2A2320] h-[2px]" />
          </>
        )}

        {/* Color Picker */}
        {showColorControls && (
          <>
            <div className="cozy-card p-2">
              <ColorPickerWheel
                currentColor={currentColor}
                onColorChange={setCurrentColor}
                recentColors={recentColors}
                onAddRecentColor={onAddRecentColor}
              />
            </div>
            <Separator className="bg-[#2A2320] h-[2px]" />
          </>
        )}

        {/* Zoom Controls */}
        <div className="cozy-card p-2">
          <ZoomControls
            zoom={zoom}
            onZoomIn={onZoomIn}
            onZoomOut={onZoomOut}
            onReset={onResetView}
          />
        </div>

        <Separator className="bg-[#2A2320] h-[2px]" />

        {/* Layers Panel */}
        <div className="cozy-card p-2">
          <LayersPanel
            layers={layers}
            activeLayerId={activeLayerId}
            onAddLayer={onAddLayer}
            onDeleteLayer={onDeleteLayer}
            onDuplicateLayer={onDuplicateLayer}
            onToggleLayerVisibility={onToggleLayerVisibility}
            onSelectLayer={onSelectLayer}
            onMoveLayer={onMoveLayer}
            onRenameLayer={onRenameLayer}
            onChangeLayerOpacity={onChangeLayerOpacity}
          />
        </div>

        <Separator className="bg-[#2A2320] h-[2px]" />

        {/* Rasterize Controls */}
        <div className="cozy-card p-2">
          <RasterizeControls
            onRasterizeAll={onRasterizeAll}
            onRasterizeVisible={onRasterizeVisible}
            onFlattenImage={onFlattenImage}
          />
        </div>

        <Separator className="bg-[#2A2320] h-[2px]" />

        {/* Quick Tips */}
        <div className="cozy-card p-2">
          <QuickTips />
        </div>
      </div>
    </div>
  );
};
