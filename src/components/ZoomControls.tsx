import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { ZoomIn, ZoomOut, Maximize2 } from "lucide-react";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";

interface ZoomControlsProps {
  zoom: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onReset: () => void;
}

export const ZoomControls = ({ zoom, onZoomIn, onZoomOut, onReset }: ZoomControlsProps) => (
  <div>
    <Label className="text-sm font-medium mb-3 block">
      Zoom: {Math.round(zoom * 100)}%
    </Label>
    <div className="flex gap-2" role="group">
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="cartoonOutline"
            size="cartoon"
            onClick={onZoomOut}
            disabled={zoom <= 0.1}
            className="flex-1"
            aria-label="Zoom out"
          >
            <ZoomOut className="w-4 h-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="bottom">Zoom out</TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="cartoonOutline"
            size="cartoon"
            onClick={onReset}
            className="flex-1"
            aria-label="Reset zoom"
          >
            <Maximize2 className="w-4 h-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="bottom">Reset view</TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="cartoonOutline"
            size="cartoon"
            onClick={onZoomIn}
            disabled={zoom >= 5}
            className="flex-1"
            aria-label="Zoom in"
          >
            <ZoomIn className="w-4 h-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="bottom">Zoom in</TooltipContent>
      </Tooltip>
    </div>
  </div>
);
