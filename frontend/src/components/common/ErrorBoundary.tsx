import React from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

interface Props {
  error: Error;
  resetError: () => void;
}

export function ErrorFallback({ error, resetError }: Props) {
  return (
    <div className="card-base neu w-full p-8 flex flex-col items-center justify-center text-center space-y-4 border-red-500/20">
      <div className="p-4 bg-red-500/10 rounded-full text-red-500">
        <AlertTriangle className="w-8 h-8" />
      </div>
      <h3 className="text-xl font-display font-semibold">Something went wrong</h3>
      <p className="text-muted-foreground max-w-md text-sm">{error.message}</p>
      <button 
        onClick={resetError}
        className="mt-4 flex items-center gap-2 px-6 py-2 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors font-medium text-sm"
      >
        <RefreshCw className="w-4 h-4" /> Try Again
      </button>
    </div>
  );
}

export class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean, error: Error | null }> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  reset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError && this.state.error) {
      return <ErrorFallback error={this.state.error} resetError={this.reset} />;
    }
    return this.props.children;
  }
}
