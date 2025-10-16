import { Component, type ReactNode } from "react";

interface RouteErrorBoundaryProps {
  children: ReactNode;
}

interface RouteErrorBoundaryState {
  hasError: boolean;
}

export default class RouteErrorBoundary extends Component<RouteErrorBoundaryProps, RouteErrorBoundaryState> {
  state: RouteErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch() {
    // Intentionally empty: the fallback handles recovery.
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="wf-page py-16">
          <div className="wf-card max-w-2xl mx-auto p-6">
            <p className="wf-eyebrow mb-2">Something broke</p>
            <h1 className="wf-h2 mb-3">We couldn't load this page</h1>
            <p className="wf-text-sm" style={{ color: "var(--color-ink-2)" }}>
              The page chunk may have failed to load because of a connection issue. Try again or reload the app.
            </p>
            <div className="flex flex-wrap gap-3 mt-5">
              <button
                type="button"
                className="wf-btn wf-btn-primary"
                onClick={() => window.location.reload()}
              >
                Retry
              </button>
              <button
                type="button"
                className="wf-btn wf-btn-secondary"
                onClick={() => (window.location.href = "/")}
              >
                Go home
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}