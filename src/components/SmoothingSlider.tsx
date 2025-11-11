import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";

interface SmoothingSliderProps {
  smoothing: number;
  setSmoothing: (value: number) => void;
}

export const SmoothingSlider = ({ smoothing, setSmoothing }: SmoothingSliderProps) => (
  <div>
    <Label htmlFor="smoothing-slider" className="text-sm font-medium mb-3 block">
      Smoothing: {smoothing}
    </Label>
    <Slider
      id="smoothing-slider"
      min={0}
      max={10}
      step={1}
      value={[smoothing]}
      onValueChange={(vals) => setSmoothing(vals[0])}
      className="w-full"
      aria-label="Brush smoothing level"
    />
  </div>
);
