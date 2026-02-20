import { createContext, useContext, useState, ReactNode } from "react";
import type { UserEntry } from "@/components/LogMigraineForm";

export const DEMO_ENTRIES: UserEntry[] = [
  { id: 1, date: "Mar 26", severity: 10, durationMin: 213, area: "Periorbital", symptoms: ["Severe Head Pain", "Nausea", "Light Sensitivity"], triggers: ["Travel", "Stress", "Caffeine"], meds: ["Eletriptan"], weather: "Cloudy", sleep: 6.7, caffeine: 151, water: 3, stress: "Very High", skippedMeal: false, notes: "Travel day; irregular meals", hormonalStatus: ["Menstruating"], isUserEntry: true },
  { id: 2, date: "Mar 24", severity: 8, durationMin: 66, area: "Occipital", symptoms: ["Throbbing Pain", "Neck Tension", "Nausea"], triggers: ["Caffeine", "Poor Sleep", "Rain/Pressure"], meds: ["Rizatriptan"], weather: "Light Rain", sleep: 4.4, caffeine: 224, water: 2, stress: "Very High", skippedMeal: false, notes: "Travel day; irregular meals", isUserEntry: true },
  { id: 3, date: "Mar 21", severity: 7, durationMin: 149, area: "Right Orbital", symptoms: ["Eye Pain", "Light Sensitivity", "Throbbing"], triggers: ["Bright Light", "Skipped Meal", "Hormonal/Menstrual"], meds: ["Ibuprofen"], weather: "Clear", sleep: 7.3, caffeine: 94, water: 5, stress: "High", skippedMeal: true, notes: "Lots of meetings in bright room", hormonalStatus: ["Menstruating", "Luteal"], isUserEntry: true },
  { id: 4, date: "Mar 18", severity: 9, durationMin: 129, area: "Bilateral Temporal", symptoms: ["Severe Head Pain", "Vomiting", "Sound Sensitivity", "Aura"], triggers: ["Weather/Storm", "Travel", "Skipped Meal", "Caffeine"], meds: ["Zolmitriptan"], weather: "Storm", sleep: 7.6, caffeine: 235, water: 2, stress: "Very High", skippedMeal: true, notes: "Travel day; irregular meals", isUserEntry: true },
  { id: 5, date: "Mar 13", severity: 9, durationMin: 82, area: "Frontal", symptoms: ["Severe Head Pain", "Nausea", "Aura", "Brain Fog"], triggers: ["Stress", "Weather/Storm", "Skipped Meal", "Poor Sleep"], meds: ["Sumatriptan"], weather: "Thunderstorm", sleep: 4.4, caffeine: 13, water: 6, stress: "Very High", skippedMeal: true, notes: "Argued with colleague; thunderstorm", isUserEntry: true },
  { id: 6, date: "Mar 9", severity: 8, durationMin: 173, area: "Left Temporal", symptoms: ["Throbbing Pain", "Neck Tension", "Fatigue"], triggers: ["Barometric Pressure", "Caffeine"], meds: ["Naproxen"], weather: "Foggy", sleep: 6.9, caffeine: 168, water: 4, stress: "Moderate", skippedMeal: false, notes: "Outdoor walk; low phone use", isUserEntry: true },
  { id: 7, date: "Mar 8", severity: 9, durationMin: 51, area: "Vertex", symptoms: ["Severe Head Pain", "Nausea", "Dizziness"], triggers: ["Travel", "Caffeine", "Stress", "Weather/Storm"], meds: ["Ibuprofen"], weather: "Snow", sleep: 5.9, caffeine: 260, water: 3, stress: "Very High", skippedMeal: false, notes: "Travel day; irregular meals", isUserEntry: true },
  { id: 8, date: "Mar 7", severity: 7, durationMin: 135, area: "Right Orbital", symptoms: ["Eye Pain", "Screen Fatigue", "Neck Tension", "Brain Fog"], triggers: ["Screen Time", "Caffeine", "Poor Sleep"], meds: ["Naproxen"], weather: "Foggy", sleep: 4.2, caffeine: 249, water: 3, stress: "Very High", skippedMeal: false, notes: "Long coding session; forgot breaks", isUserEntry: true },
];

interface EntriesContextValue {
  entries: UserEntry[];
  addEntry: (e: UserEntry) => void;
  updateEntry: (e: UserEntry) => void;
  deleteEntry: (id: number | string) => void;
  loadDemoData: () => void;
  isDemoLoaded: boolean;
}

const EntriesContext = createContext<EntriesContextValue | null>(null);

export function EntriesProvider({ children }: { children: ReactNode }) {
  const [entries, setEntries] = useState<UserEntry[]>([]);
  const [isDemoLoaded, setIsDemoLoaded] = useState(false);

  const addEntry = (e: UserEntry) => setEntries(prev => [e, ...prev]);

  const updateEntry = (e: UserEntry) => setEntries(prev => 
    prev.map(existing => existing.id === e.id ? e : existing)
  );

  const deleteEntry = (id: number | string) => setEntries(prev => 
    prev.filter(e => e.id !== id)
  );

  const loadDemoData = () => {
    setEntries(DEMO_ENTRIES);
    setIsDemoLoaded(true);
  };

  return (
    <EntriesContext.Provider value={{ entries, addEntry, updateEntry, deleteEntry, loadDemoData, isDemoLoaded }}>
      {children}
    </EntriesContext.Provider>
  );
}

export function useEntries() {
  const ctx = useContext(EntriesContext);
  if (!ctx) throw new Error("useEntries must be used within EntriesProvider");
  return ctx;
}
