import { Component, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from './ui';

interface Props { children: ReactNode; fallback?: ReactNode; }
interface State { hasError: boolean; error: Error | null; }

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;
      return (
        <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-red-100 text-red-500">
            <AlertTriangle size={28} />
          </span>
          <h2 className="mt-6 text-xl font-extrabold text-slate-900">Something went wrong</h2>
          <p className="mt-2 max-w-md text-sm text-slate-500">
            An unexpected error occurred. Please try refreshing the page.
          </p>
          {this.state.error && (
            <pre className="mt-4 max-w-lg whitespace-pre-wrap rounded-lg bg-red-50 p-4 text-left text-xs text-red-700">
              {this.state.error.message}
            </pre>
          )}
          <Button className="mt-6" onClick={() => { this.setState({ hasError: false, error: null }); window.location.reload(); }}>
            <RefreshCw size={16} /> Reload page
          </Button>
        </div>
      );
    }
    return this.props.children;
  }
}
