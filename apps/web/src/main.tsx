import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { initSentry, Sentry } from "./lib/sentry";
import { initAnalytics } from "./lib/analytics";
import { AuthProvider } from "./context/AuthContext";
import { ThemeProvider } from "./context/ThemeContext";
import { ToastProvider } from "./context/ToastContext";
import "./index.css";
import App from "./App.tsx";

// Initialize Sentry and Analytics before rendering
initSentry();
initAnalytics();

function ErrorFallback() {
  return (
    <div style={{ padding: 40, textAlign: "center" }}>
      <h1 style={{ fontSize: 24, marginBottom: 16 }}>Something went wrong</h1>
      <p style={{ color: "#666", marginBottom: 24 }}>
        We've been notified and are working on a fix.
      </p>
      <button
        onClick={() => window.location.reload()}
        style={{
          padding: "10px 20px",
          background: "#10b981",
          color: "#fff",
          border: "none",
          borderRadius: 8,
          cursor: "pointer",
        }}
      >
        Reload Page
      </button>
    </div>
  );
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Sentry.ErrorBoundary fallback={<ErrorFallback />}>
      <BrowserRouter>
        <ThemeProvider>
          <AuthProvider>
            <ToastProvider>
              <App />
            </ToastProvider>
          </AuthProvider>
        </ThemeProvider>
      </BrowserRouter>
    </Sentry.ErrorBoundary>
  </StrictMode>
);
