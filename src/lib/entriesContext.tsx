import { createContext, useContext, useState, type ReactNode } from "react";
import type { UserEntry } from "@/components/LogMigraineForm";
import { SAMPLE_MIGRAINE_DATA } from "@/lib/sampleMigraineData";

interface UserEntriesContextType {
  entries: UserEntry[];
  addEntry: (entry: UserEntry) => void;
  updateEntry: (entry: UserEntry) => void;
  deleteEntry: (id: number | string) => void;
  loadDemoData: () => void;
  isDemoLoaded: boolean;
}

const UserEntriesContext = createContext<UserEntriesContextType | null>(null);

export function UserEntriesProvider({ children }: { children: ReactNode }) {
  const [entries, setEntries] = useState<UserEntry[]>(SAMPLE_MIGRAINE_DATA);
  const [isDemoLoaded, setIsDemoLoaded] = useState(false);

  const addEntry = (entry: UserEntry) => {
    setEntries(prev => [entry, ...prev]);
  };

  const updateEntry = (updatedEntry: UserEntry) => {
    setEntries(prev =>
      prev.map(e => (e.id === updatedEntry.id ? updatedEntry : e))
    );
  };

  const deleteEntry = (id: number | string) => {
    setEntries(prev => prev.filter(e => e.id !== id));
  };

  const loadDemoData = () => {
    setEntries(SAMPLE_MIGRAINE_DATA);
    setIsDemoLoaded(true);
  };

  return (
    <UserEntriesContext.Provider
      value={{
        entries,
        addEntry,
        updateEntry,
        deleteEntry,
        loadDemoData,
        isDemoLoaded,
      }}
    >
      {children}
    </UserEntriesContext.Provider>
  );
}

export function useUserEntries() {
  const ctx = useContext(UserEntriesContext);
  if (!ctx) {
    throw new Error("useUserEntries must be used within UserEntriesProvider");
  }
  return ctx;
}