import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { ThemeProvider } from "./context/ThemeContext";
import { ToastProvider } from "./context/ToastContext";
import "./index.css";
import App from "./App.tsx";

// Easter egg for the curious developer
console.log(
  "%cMentorHub",
  "font-size: 20px; font-weight: 700; color: #4F46E5; font-family: 'Fraunces', Georgia, serif; letter-spacing: -0.02em;"
);
console.log(
  "%cConnecting mentors and mentees — one session at a time.\nPoking around? The source is open. Make it better.",
  "font-size: 12px; color: #474D7A; font-family: system-ui, sans-serif; line-height: 1.7;"
);

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <ToastProvider>
            <App />
          </ToastProvider>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  </StrictMode>
);
