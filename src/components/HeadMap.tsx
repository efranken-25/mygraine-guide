import { cn } from "@/lib/utils";

export type HeadArea = {
  id: string;
  label: string;
  sublabel?: string;
};

export const HEAD_AREAS: HeadArea[] = [
  { id: "frontal", label: "Frontal", sublabel: "Forehead" },
  { id: "left-temporal", label: "Left Temporal", sublabel: "Left temple" },
  { id: "right-temporal", label: "Right Temporal", sublabel: "Right temple" },
  { id: "left-orbital", label: "Left Orbital", sublabel: "Left eye" },
  { id: "right-orbital", label: "Right Orbital", sublabel: "Right eye" },
  { id: "vertex", label: "Vertex", sublabel: "Top of head" },
  { id: "occipital", label: "Occipital", sublabel: "Back of head" },
  { id: "neck", label: "Neck / Cervical", sublabel: "Neck & upper spine" },
  { id: "bilateral", label: "Bilateral", sublabel: "Both sides" },
  { id: "full", label: "Whole Head", sublabel: "Diffuse / all over" },
];

// SVG clickable region definitions
// viewBox: 0 0 200 280
type Region = {
  id: string;
  path?: string;
  circle?: { cx: number; cy: number; r: number };
  ellipse?: { cx: number; cy: number; rx: number; ry: number };
  textX: number;
  textY: number;
  shortLabel: string;
};

const REGIONS: Region[] = [
  // Frontal (forehead strip)
  {
    id: "frontal",
    path: "M 68 52 Q 100 36 132 52 L 128 78 Q 100 68 72 78 Z",
    textX: 100,
    textY: 62,
    shortLabel: "Frontal",
  },
  // Vertex (top of head)
  {
    id: "vertex",
    path: "M 68 52 Q 100 36 132 52 Q 118 30 100 24 Q 82 30 68 52 Z",
    textX: 100,
    textY: 40,
    shortLabel: "Vertex",
  },
  // Left temporal
  {
    id: "left-temporal",
    path: "M 55 78 L 42 70 Q 36 90 38 118 L 55 118 Z",
    textX: 42,
    textY: 97,
    shortLabel: "L. Temp",
  },
  // Right temporal
  {
    id: "right-temporal",
    path: "M 145 78 L 158 70 Q 164 90 162 118 L 145 118 Z",
    textX: 158,
    textY: 97,
    shortLabel: "R. Temp",
  },
  // Left orbital (left eye area)
  {
    id: "left-orbital",
    ellipse: { cx: 80, cy: 96, rx: 14, ry: 10 },
    textX: 80,
    textY: 96,
    shortLabel: "L. Eye",
  },
  // Right orbital (right eye area)
  {
    id: "right-orbital",
    ellipse: { cx: 120, cy: 96, rx: 14, ry: 10 },
    textX: 120,
    textY: 96,
    shortLabel: "R. Eye",
  },
  // Occipital (back of head) - shown as lower rear skull
  {
    id: "occipital",
    path: "M 60 150 Q 100 170 140 150 L 138 135 Q 100 148 62 135 Z",
    textX: 100,
    textY: 153,
    shortLabel: "Occipital",
  },
  // Face / center (nose-chin zone, clickable as "bilateral" midface not used — repurposed for bilateral below)
  // Bilateral — wide band across both temples joining
  {
    id: "bilateral",
    path: "M 42 70 L 158 70 L 158 80 L 42 80 Z",
    textX: 100,
    textY: 76,
    shortLabel: "Bilateral",
  },
  // Neck
  {
    id: "neck",
    path: "M 82 172 L 118 172 L 122 210 Q 100 218 78 210 Z",
    textX: 100,
    textY: 194,
    shortLabel: "Neck",
  },
  // Full head (large background click zone — rendered last so it's lowest z)
  {
    id: "full",
    path: "M 100 24 Q 150 24 162 70 Q 172 118 160 150 Q 148 172 118 172 L 82 172 Q 52 172 40 150 Q 28 118 38 70 Q 50 24 100 24 Z",
    textX: 100,
    textY: 118,
    shortLabel: "Whole Head",
  },
];

// Single-select props
type SingleProps = { value: string; onChange: (v: string) => void; multi?: false };
// Multi-select props
type MultiProps = { value: string[]; onChange: (v: string[]) => void; multi: true };

type Props = SingleProps | MultiProps;

export default function HeadMap(props: Props) {
  const isSelected = (id: string) =>
    props.multi ? props.value.includes(id) : props.value === id;

  const handleClick = (id: string) => {
    if (props.multi) {
      const cur = props.value as string[];
      if (id === "full") {
        // Toggle "full" clears others or sets just full
        props.onChange(cur.includes("full") ? [] : ["full"]);
      } else {
        const without = cur.filter((x) => x !== "full" && x !== id);
        props.onChange(cur.includes(id) ? without : [...without, id]);
      }
    } else {
      (props.onChange as (v: string) => void)(id);
    }
  };

  const fillFor = (id: string) => {
    if (id === "full") {
      return isSelected("full")
        ? "hsl(var(--primary) / 0.25)"
        : "hsl(var(--muted) / 0.3)";
    }
    return isSelected(id)
      ? "hsl(var(--primary) / 0.7)"
      : "hsl(var(--muted) / 0.15)";
  };

  const strokeFor = (id: string) =>
    isSelected(id) ? "hsl(var(--primary))" : "hsl(var(--border))";

  const textFillFor = (id: string) =>
    isSelected(id) ? "hsl(var(--primary-foreground))" : "hsl(var(--muted-foreground))";

  const selectedAreas = HEAD_AREAS.filter((a) => isSelected(a.id));

  return (
    <div className="flex flex-col items-center gap-3">
      <p className="text-sm font-medium text-muted-foreground">
        {props.multi ? "Tap to select affected areas" : "Tap to select affected area"}
      </p>

      <svg
        viewBox="0 0 200 240"
        className="w-56 h-56 select-none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Full head background first (lowest layer) */}
        {REGIONS.filter((r) => r.id === "full").map((region) => (
          <g
            key={region.id}
            onClick={() => handleClick(region.id)}
            className="cursor-pointer"
            style={{ transition: "opacity 0.15s" }}
          >
            {region.path && (
              <path
                d={region.path}
                fill={fillFor(region.id)}
                stroke={strokeFor(region.id)}
                strokeWidth={isSelected(region.id) ? 2 : 1.5}
              />
            )}
          </g>
        ))}

        {/* Outer ear hints */}
        <ellipse cx="38" cy="108" rx="6" ry="12" fill="hsl(var(--muted)/0.4)" stroke="hsl(var(--border))" strokeWidth="1" />
        <ellipse cx="162" cy="108" rx="6" ry="12" fill="hsl(var(--muted)/0.4)" stroke="hsl(var(--border))" strokeWidth="1" />

        {/* Nose hint */}
        <path d="M 97 118 Q 93 132 96 136 Q 100 138 104 136 Q 107 132 103 118" fill="none" stroke="hsl(var(--border))" strokeWidth="1" />

        {/* Mouth hint */}
        <path d="M 88 145 Q 100 152 112 145" fill="none" stroke="hsl(var(--border))" strokeWidth="1" strokeLinecap="round" />

        {/* Eye socket hints (decorative) */}
        <ellipse cx="80" cy="96" rx="12" ry="7" fill="hsl(var(--background))" stroke="hsl(var(--border))" strokeWidth="0.8" />
        <ellipse cx="120" cy="96" rx="12" ry="7" fill="hsl(var(--background))" stroke="hsl(var(--border))" strokeWidth="0.8" />

        {/* Clickable regions (excluding full) */}
        {REGIONS.filter((r) => r.id !== "full").map((region) => (
          <g
            key={region.id}
            onClick={() => handleClick(region.id)}
            className="cursor-pointer"
          >
            {region.path && (
              <path
                d={region.path}
                fill={fillFor(region.id)}
                stroke={strokeFor(region.id)}
                strokeWidth={isSelected(region.id) ? 2 : 1}
                style={{ transition: "fill 0.15s, stroke 0.15s" }}
              />
            )}
            {region.ellipse && (
              <ellipse
                cx={region.ellipse.cx}
                cy={region.ellipse.cy}
                rx={region.ellipse.rx}
                ry={region.ellipse.ry}
                fill={fillFor(region.id)}
                stroke={strokeFor(region.id)}
                strokeWidth={isSelected(region.id) ? 2 : 1}
                style={{ transition: "fill 0.15s, stroke 0.15s" }}
              />
            )}
            {/* Label text */}
            <text
              x={region.textX}
              y={region.textY}
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize={region.id === "neck" ? "7" : "6"}
              fontWeight={isSelected(region.id) ? "700" : "400"}
              fill={textFillFor(region.id)}
              style={{ pointerEvents: "none", transition: "fill 0.15s" }}
            >
              {region.shortLabel}
            </text>
          </g>
        ))}

        {/* "Whole Head" label inside when selected */}
        {isSelected("full") && (
          <text
            x="100"
            y="118"
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize="7"
            fontWeight="700"
            fill="hsl(var(--primary))"
            style={{ pointerEvents: "none" }}
          >
            Whole Head
          </text>
        )}
      </svg>

      {/* Selected area label */}
      <div className="flex flex-col items-center gap-0.5">
        {selectedAreas.length > 0 ? (
          <span className="text-sm font-semibold text-foreground">
            {selectedAreas.map((a) => a.label).join(", ")}
          </span>
        ) : (
          <span className="text-xs text-muted-foreground">No area selected</span>
        )}
      </div>

      {/* Quick-pick chips for all areas */}
      <div className="flex flex-wrap justify-center gap-1.5 max-w-xs">
        {HEAD_AREAS.map((area) => (
          <button
            key={area.id}
            type="button"
            onClick={() => handleClick(area.id)}
            className={cn(
              "rounded-full px-2.5 py-1 text-xs font-medium border transition-all",
              isSelected(area.id)
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-background border-border text-muted-foreground hover:bg-muted"
            )}
          >
            {area.label}
          </button>
        ))}
      </div>
    </div>
  );
}
