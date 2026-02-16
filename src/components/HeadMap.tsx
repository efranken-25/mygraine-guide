import { cn } from "@/lib/utils";

const areas = [
  { id: "front", label: "Front", position: "top-0 left-1/2 -translate-x-1/2" },
  { id: "left", label: "Left", position: "top-1/2 left-0 -translate-y-1/2" },
  { id: "right", label: "Right", position: "top-1/2 right-0 -translate-y-1/2" },
  { id: "back", label: "Back", position: "bottom-0 left-1/2 -translate-x-1/2" },
  { id: "full", label: "Full", position: "top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" },
] as const;

type AreaId = (typeof areas)[number]["id"];

export default function HeadMap({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex flex-col items-center gap-3">
      <p className="text-sm font-medium text-muted-foreground">Affected area</p>
      <div className="relative h-40 w-40">
        {/* Head silhouette circle */}
        <div className="absolute inset-2 rounded-full border-2 border-border bg-muted/30" />
        {areas.map(({ id, label, position }) => (
          <button
            key={id}
            type="button"
            onClick={() => onChange(id)}
            className={cn(
              "absolute z-10 rounded-full px-2 py-1 text-xs font-medium transition-all",
              value === id
                ? "bg-primary text-primary-foreground shadow-md scale-110"
                : "bg-card border border-border text-muted-foreground hover:bg-muted"
            ,position)}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}
