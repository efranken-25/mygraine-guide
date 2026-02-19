import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import { AuthProvider } from "./lib/auth.tsx";
import "./index.css";

// Apply saved theme before render to avoid flash
if (localStorage.getItem("theme") === "dark") {
  document.documentElement.classList.add("dark");
}

createRoot(document.getElementById("root")!).render(
  <AuthProvider>
    <App />
  </AuthProvider>
);

