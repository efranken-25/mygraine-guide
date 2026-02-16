import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";

export default function SeveritySlider({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const getColor = (v: number) => {
    if (v <= 3) return "text-[hsl(var(--severity-low))]";
    if (v <= 6) return "text-[hsl(var(--severity-mid))]";
    return "text-[hsl(var(--severity-high))]";
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium">Severity</label>
        <span className={cn("text-2xl font-bold tabular-nums font-serif", getColor(value))}>{value}</span>
      </div>
      <Slider
        value={[value]}
        onValueChange={([v]) => onChange(v)}
        min={1}
        max={10}
        step={1}
        className="w-full"
      />
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>Mild</span>
        <span>Moderate</span>
        <span>Severe</span>
      </div>
    </div>
  );
}
