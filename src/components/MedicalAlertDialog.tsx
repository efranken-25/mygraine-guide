import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle, PhoneCall, X } from "lucide-react";
import { UserEntry } from "@/components/LogMigraineForm";

// ─── Criteria ────────────────────────────────────────────────────────────────
// Each rule returns a reason string when triggered, or null when not.

const HIGH_SEVERITY_THRESHOLD = 8;

// Symptoms that individually suggest escalation
const RED_FLAG_SYMPTOMS = new Set([
  "Aura",
  "Vomiting",
  "Dizziness",
  "Severe Head Pain",
]);

// Symptom combinations that together are concerning
const CONCERNING_COMBOS: { symptoms: string[]; reason: string }[] = [
  {
    symptoms: ["Nausea", "Vomiting", "Dizziness"],
    reason: "Nausea, vomiting, and dizziness together can indicate a neurological event.",
  },
  {
    symptoms: ["Aura", "Eye Pain"],
    reason: "Aura combined with eye pain may signal increased intraocular pressure or a vascular issue.",
  },
  {
    symptoms: ["Severe Head Pain", "Vomiting"],
    reason: "Severe head pain with vomiting is a potential warning sign that warrants clinical evaluation.",
  },
  {
    symptoms: ["Aura", "Nausea", "Vomiting"],
    reason: "Complex aura with gastrointestinal symptoms can be a sign of complicated migraine.",
  },
];

export interface AlertResult {
  triggered: boolean;
  reasons: string[];
  level: "urgent" | "warning";
}

export function checkMedicalAlert(entry: UserEntry): AlertResult {
  const reasons: string[] = [];

  // 1. High severity
  if (entry.severity >= HIGH_SEVERITY_THRESHOLD) {
    reasons.push(
      `Severity of ${entry.severity}/10 is considered severe and persistent pain at this level should be evaluated.`
    );
  }

  // 2. Red-flag symptoms
  entry.symptoms.forEach((s) => {
    if (RED_FLAG_SYMPTOMS.has(s)) {
      const msgs: Record<string, string> = {
        Aura: "Aura symptoms (visual disturbances, numbness, speech issues) can occasionally indicate a TIA or stroke risk.",
        Vomiting: "Vomiting alongside head pain can signal a more severe migraine variant that may need IV treatment.",
        Dizziness: "Pronounced dizziness with migraine may indicate vestibular involvement worth discussing with a provider.",
        "Severe Head Pain": "Self-reported severe head pain warrants a professional assessment to rule out secondary causes.",
      };
      if (msgs[s]) reasons.push(msgs[s]);
    }
  });

  // 3. Symptom combinations
  CONCERNING_COMBOS.forEach(({ symptoms, reason }) => {
    if (symptoms.every((s) => entry.symptoms.includes(s))) {
      reasons.push(reason);
    }
  });

  // 4. Long duration + high severity
  if (entry.durationMin >= 180 && entry.severity >= 6) {
    reasons.push(
      "A migraine lasting 3+ hours at moderate-to-high severity (status migrainosus) may benefit from medical intervention."
    );
  }

  // Deduplicate
  const unique = [...new Set(reasons)];
  const level: "urgent" | "warning" =
    entry.severity >= 9 ||
    (entry.symptoms.includes("Aura") && entry.symptoms.includes("Vomiting"))
      ? "urgent"
      : "warning";

  return { triggered: unique.length > 0, reasons: unique, level };
}

// ─── Dialog ──────────────────────────────────────────────────────────────────

interface Props {
  open: boolean;
  onClose: () => void;
  result: AlertResult;
}

export default function MedicalAlertDialog({ open, onClose, result }: Props) {
  const isUrgent = result.level === "urgent";

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-sm rounded-2xl p-0 overflow-hidden border-0 shadow-2xl">
        {/* Header strip */}
        <div
          className="px-5 pt-5 pb-4"
          style={{
            background: isUrgent
              ? "linear-gradient(135deg, hsl(0 80% 96%), hsl(14 90% 94%))"
              : "linear-gradient(135deg, hsl(38 90% 95%), hsl(45 85% 92%))",
          }}
        >
          <DialogHeader>
            <div className="flex items-start gap-3">
              <div
                className="flex-shrink-0 rounded-full p-2.5 mt-0.5"
                style={{
                  background: isUrgent
                    ? "hsl(0 80% 90%)"
                    : "hsl(38 90% 88%)",
                }}
              >
                <AlertTriangle
                  className="h-5 w-5"
                  style={{ color: isUrgent ? "hsl(0 72% 45%)" : "hsl(32 85% 40%)" }}
                />
              </div>
              <div>
                <DialogTitle
                  className="text-base font-bold font-serif leading-snug"
                  style={{ color: isUrgent ? "hsl(0 60% 24%)" : "hsl(32 60% 22%)" }}
                >
                  {isUrgent
                    ? "We recommend seeing a doctor"
                    : "Consider speaking with a provider"}
                </DialogTitle>
                <DialogDescription
                  className="text-xs mt-1 leading-relaxed"
                  style={{ color: isUrgent ? "hsl(0 45% 38%)" : "hsl(32 45% 38%)" }}
                >
                  Based on what you just logged, a medical professional's opinion could be helpful.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
        </div>

        {/* Reasons */}
        <div className="px-5 py-4 space-y-2.5">
          <p className="text-[11px] font-semibold tracking-wider uppercase text-muted-foreground">
            Why we're flagging this
          </p>
          <ul className="space-y-2">
            {result.reasons.map((r, i) => (
              <li key={i} className="flex items-start gap-2">
                <span
                  className="mt-1.5 flex-shrink-0 h-1.5 w-1.5 rounded-full"
                  style={{
                    background: isUrgent ? "hsl(0 72% 50%)" : "hsl(32 85% 48%)",
                  }}
                />
                <p className="text-xs leading-relaxed text-foreground/80">{r}</p>
              </li>
            ))}
          </ul>
        </div>

        {/* Disclaimer */}
        <div className="mx-5 mb-4 rounded-xl px-3.5 py-2.5 bg-muted/60">
          <p className="text-[10.5px] text-muted-foreground leading-relaxed">
            <strong>Note:</strong> This is not a medical diagnosis. It's a gentle nudge based on your logged data. Always consult a qualified healthcare professional.
          </p>
        </div>

        <DialogFooter className="flex-col gap-2 px-5 pb-5">
          {isUrgent && (
            <Button
              className="w-full gap-2 rounded-xl"
              style={{
                background: "hsl(0 72% 50%)",
                color: "hsl(0 0% 100%)",
              }}
              onClick={onClose}
            >
              <PhoneCall className="h-4 w-4" />
              I'll contact my provider
            </Button>
          )}
          <Button
            variant="outline"
            className="w-full rounded-xl gap-2"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
            {isUrgent ? "Dismiss for now" : "Got it, thanks"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
