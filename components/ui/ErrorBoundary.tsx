'use client';

import { Component, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;
      return (
        <div className="flex flex-col items-center justify-center gap-4 p-12 text-center">
          <div className="text-4xl">⚠</div>
          <h2 className="text-lg font-semibold text-textPrimary">Something went wrong</h2>
          <p className="max-w-md text-sm text-textSecondary">
            {this.state.error?.message || 'An unexpected error occurred while processing.'}
          </p>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-accentHover"
          >
            Try Again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
