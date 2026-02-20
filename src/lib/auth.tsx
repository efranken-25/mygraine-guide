import { createContext, useContext, useState, ReactNode } from "react";

// Mock credentials
const MOCK_EMAIL = "demo@mygraineguide.com";
const MOCK_PASSWORD = "migraine123";
const MOCK_USER = {
  id: "mock-user-001",
  email: MOCK_EMAIL,
  displayName: "Demo User",
};

type MockUser = typeof MOCK_USER;

type AuthContextType = {
  user: MockUser | null;
  loading: boolean;
  signIn: (email: string, password: string) => { success: boolean; error?: string };
  signOut: () => void;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: false,
  signIn: () => ({ success: false }),
  signOut: () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<MockUser | null>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("mock-auth") === "true" ? MOCK_USER : null;
    }
    return null;
  });

  const signIn = (email: string, password: string) => {
    if (email === MOCK_EMAIL && password === MOCK_PASSWORD) {
      setUser(MOCK_USER);
      localStorage.setItem("mock-auth", "true");
      return { success: true };
    }
    return { success: false, error: "Invalid email or password" };
  };

  const signOut = () => {
    setUser(null);
    localStorage.removeItem("mock-auth");
  };

  return (
    <AuthContext.Provider value={{ user, loading: false, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
