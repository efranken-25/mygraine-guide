import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import { Pill } from "lucide-react";

interface Props {
  open: boolean;
  onClose: () => void;
}

const OTC_RECOMMENDATIONS = [
  { name: "Ibuprofen (Advil/Motrin)", dose: "200–400 mg", note: "Take with food. Avoid if you have stomach issues." },
  { name: "Naproxen (Aleve)", dose: "220–440 mg", note: "Longer-lasting relief. Take with food." },
  { name: "Acetaminophen (Tylenol)", dose: "500–1000 mg", note: "Easier on the stomach. Don't exceed 3g/day." },
  { name: "Excedrin Migraine", dose: "2 caplets", note: "Contains acetaminophen, aspirin & caffeine." },
];

export default function OtcRecommendationDialog({ open, onClose }: Props) {
  // Debug: log opens so we can trace why dialog may not appear on some pages
  console.debug("OtcRecommendationDialog: render, open=", open);
  return (
    <AlertDialog open={open} onOpenChange={(v) => !v && onClose()}>
      <AlertDialogContent className="max-w-sm rounded-2xl">
        <AlertDialogHeader>
          <div className="flex items-center gap-2 mb-1">
            <div className="rounded-full p-2 bg-primary/10">
              <Pill className="h-5 w-5 text-primary" />
            </div>
            <AlertDialogTitle className="text-base">Consider taking something?</AlertDialogTitle>
          </div>
          <AlertDialogDescription className="text-xs text-muted-foreground">
            You didn't log any rescue medication. These OTC options may help with your migraine:
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-2 my-1">
          {OTC_RECOMMENDATIONS.map((rec) => (
            <div key={rec.name} className="rounded-xl border border-border bg-muted/40 px-3.5 py-2.5">
              <p className="text-sm font-semibold">{rec.name}</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                <span className="font-medium text-foreground/80">{rec.dose}</span> · {rec.note}
              </p>
            </div>
          ))}
        </div>

        <p className="text-[10px] text-muted-foreground italic">
          Always consult your doctor before starting any medication. This is not medical advice.
        </p>

        <AlertDialogFooter>
          <AlertDialogAction onClick={onClose} className="w-full rounded-xl">
            Got it
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
