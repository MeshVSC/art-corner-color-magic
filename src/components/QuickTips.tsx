
import { Label } from "@/components/ui/label";

export const QuickTips = () => (
  <div className="p-3">
    <Label className="text-xs font-medium block mb-1">💡 Quick Tips</Label>
    <div className="text-xs text-muted-foreground space-y-1" role="list">
      <div role="listitem">• Ctrl+Z to undo, Ctrl+Y to redo</div>
      <div role="listitem">• Use eyedropper to pick colors</div>
      <div role="listitem">• Fill tool floods connected areas</div>
      <div role="listitem">• Shape tools: drag to create</div>
      <div role="listitem">• Smoothing helps steady your hand</div>
      <div role="listitem">• Try different brush types!</div>
      <div role="listitem">• Zoom in for detailed work</div>
    </div>
  </div>
);

