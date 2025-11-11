import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { BrushType } from "@/hooks/usePaintCanvas";
import { Brush, Pencil, Highlighter, Sparkles } from "lucide-react";

interface BrushTypeSelectorProps {
  brushType: BrushType;
  setBrushType: (type: BrushType) => void;
}

const brushTypes: Array<{ id: BrushType; icon: any; label: string; tooltip: string }> = [
  { id: 'normal', icon: Brush, label: 'Normal', tooltip: 'Normal brush: smooth strokes' },
  { id: 'pencil', icon: Pencil, label: 'Pencil', tooltip: 'Pencil: hard edges' },
  { id: 'marker', icon: Highlighter, label: 'Marker', tooltip: 'Marker: bold strokes' },
  { id: 'airbrush', icon: Sparkles, label: 'Airbrush', tooltip: 'Airbrush: soft spray' },
];

export const BrushTypeSelector = ({ brushType, setBrushType }: BrushTypeSelectorProps) => (
  <div>
    <Label className="text-sm font-medium mb-3 block">Brush Type</Label>
    <div className="grid grid-cols-4 gap-2" role="group">
      {brushTypes.map((type) => {
        const Icon = type.icon;
        return (
          <Tooltip key={type.id}>
            <TooltipTrigger asChild>
              <span>
                <Button
                  variant={brushType === type.id ? 'cartoon' : 'cartoonOutline'}
                  size="cartoon"
                  onClick={() => setBrushType(type.id)}
                  className="w-12 h-12 rounded-full p-0 flex items-center justify-center"
                  aria-pressed={brushType === type.id}
                  aria-label={type.label}
                >
                  <Icon className="w-4 h-4" />
                </Button>
              </span>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              {type.tooltip}
            </TooltipContent>
          </Tooltip>
        );
      })}
    </div>
  </div>
);
