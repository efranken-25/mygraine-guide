import { createContext, useContext, useState, useCallback, type ReactNode } from "react";
import type { UserEntry } from "@/components/LogMigraineForm";

interface UserEntriesContextType {
  userEntries: UserEntry[];
  addEntry: (entry: UserEntry) => void;
  updateEntry: (id: number, entry: UserEntry) => void;
  deleteEntry: (id: number) => void;
}

const UserEntriesContext = createContext<UserEntriesContextType | null>(null);

export function UserEntriesProvider({ children }: { children: ReactNode }) {
  const [userEntries, setUserEntries] = useState<UserEntry[]>([]);

  const addEntry = useCallback((entry: UserEntry) => {
    setUserEntries((prev) => [entry, ...prev]);
  }, []);

  const updateEntry = useCallback((id: number, entry: UserEntry) => {
    setUserEntries((prev) => prev.map((e) => (e.id === id ? entry : e)));
  }, []);

  const deleteEntry = useCallback((id: number) => {
    setUserEntries((prev) => prev.filter((e) => e.id !== id));
  }, []);

  return (
    <UserEntriesContext.Provider value={{ userEntries, addEntry, updateEntry, deleteEntry }}>
      {children}
    </UserEntriesContext.Provider>
  );
}

export function useUserEntries() {
  const ctx = useContext(UserEntriesContext);
  if (!ctx) throw new Error("useUserEntries must be used within UserEntriesProvider");
  return ctx;
}
