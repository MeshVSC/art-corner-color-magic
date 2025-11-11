
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Brush, Eraser, Pipette, PaintBucket, Minus, Square, Circle } from "lucide-react";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { ToolType } from "@/hooks/usePaintCanvas";

interface ToolSelectorProps {
  tool: ToolType;
  setTool: (tool: ToolType) => void;
}

const tools: Array<{ id: ToolType; icon: any; label: string; tooltip: string }> = [
  { id: 'brush', icon: Brush, label: 'Brush', tooltip: 'Brush: draw/color!' },
  { id: 'eraser', icon: Eraser, label: 'Eraser', tooltip: 'Eraser: fix mistakes' },
  { id: 'fill', icon: PaintBucket, label: 'Fill', tooltip: 'Fill: flood fill color' },
  { id: 'eyedropper', icon: Pipette, label: 'Eyedropper', tooltip: 'Eyedropper: pick color from canvas' },
  { id: 'line', icon: Minus, label: 'Line', tooltip: 'Line: draw straight lines' },
  { id: 'rectangle', icon: Square, label: 'Rectangle', tooltip: 'Rectangle: draw rectangles' },
  { id: 'circle', icon: Circle, label: 'Circle', tooltip: 'Circle: draw circles' },
  { id: 'ellipse', icon: Circle, label: 'Ellipse', tooltip: 'Ellipse: draw ellipses' },
];

export const ToolSelector = ({ tool, setTool }: ToolSelectorProps) => (
  <div>
    <Label htmlFor="tool-brush" className="text-sm font-medium mb-3 block">Tools</Label>
    <div className="grid grid-cols-4 gap-2" role="group" aria-labelledby="tool-selector-label">
      {tools.map((toolItem) => {
        const Icon = toolItem.icon;
        return (
          <Tooltip key={toolItem.id}>
            <TooltipTrigger asChild>
              <span>
                <Button
                  id={`tool-${toolItem.id}`}
                  variant={tool === toolItem.id ? 'cartoon' : 'cartoonOutline'}
                  size="cartoon"
                  onClick={() => setTool(toolItem.id)}
                  className="w-12 h-12 rounded-full p-0 flex items-center justify-center"
                  data-testid={`tool-${toolItem.id}`}
                  aria-pressed={tool === toolItem.id}
                  aria-label={toolItem.label}
                >
                  <Icon className="w-5 h-5" />
                </Button>
              </span>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              {toolItem.tooltip}
            </TooltipContent>
          </Tooltip>
        );
      })}
    </div>
  </div>
);
